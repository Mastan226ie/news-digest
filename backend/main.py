import os
import logging
import datetime
from typing import Optional
from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends, BackgroundTasks, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from apscheduler.schedulers.background import BackgroundScheduler

import schemas, services
from database import get_db, init_db

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

scheduler = BackgroundScheduler()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Verify DB connectivity now that the server has started (lazy connection fix)
    init_db()

    # Run every 60 minutes to preserve Gemini daily quota limits
    scheduler.add_job(fetch_and_store_news, 'interval', minutes=60)
    scheduler.start()
    
    # Bootstrap initial admins (always ensure these emails have admin access)
    from database import db
    try:
        import os
        # Fallback to defaults if the environment variable isn't set
        default_emails = "venkatamastan.mudigonda@gmail.com,sravyavaranasi2005@gmail.com"
        allowed_emails_str = os.getenv("ALLOWED_EMAILS", default_emails)
        
        emails = [e.strip() for e in allowed_emails_str.split(",") if e.strip()]
        for e in emails:
            db.users.update_one(
                {"email": e},
                {"$set": {"role": "admin"}, "$setOnInsert": {"created_at": datetime.datetime.utcnow().isoformat()}},
                upsert=True
            )
        logger.info(f"Verified {len(emails)} admins: {', '.join(emails)}")
    except Exception as e:
        logger.error(f"Error bootstrapping admins: {e}")

    yield
    scheduler.shutdown()

app = FastAPI(title="Sraman's News Digest API", lifespan=lifespan)

raw_origins = os.getenv("ALLOWED_ORIGINS", "https://sraman-news-digest.vercel.app,http://localhost:3000")
ALLOWED_ORIGINS = []
for origin in raw_origins.split(","):
    o = origin.strip().strip("'\"")
    if o:
        ALLOWED_ORIGINS.append(o)
        if o.endswith("/"):
            ALLOWED_ORIGINS.append(o[:-1])

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

def fetch_and_store_news(target_date: Optional[datetime.date] = None):
    if target_date is None:
        target_date = datetime.date.today()
    logger.info(f"Starting news fetch pipeline for {target_date}...")
    try:
        # Fetch raw news
        raw_news = services.fetch_raw_news(target_date)
        
        from database import db
        
        # Filter raw news to only process new articles that aren't already in the DB
        unprocessed_news = []
        seen_links_in_batch = set()
        
        for raw_article in raw_news:
            link = raw_article["link"]
            
            # Skip if we already added this exact same link in this current batch (removes duplicate API calls)
            if link in seen_links_in_batch:
                continue
                
            # Check both the main articles collection and our 'attempted' urls collection
            existing_by_link = db.news_articles.find_one({"source_url": link})
            existing_attempt = db.processed_urls.find_one({"source_url": link})
            
            if not existing_by_link and not existing_attempt:
                unprocessed_news.append(raw_article)
                seen_links_in_batch.add(link)
                
        if not unprocessed_news:
            logger.info(f"No new articles to fetch for {target_date}.")
            return
            
        # Immediately mark these as attempted so we never get stuck in an infinite retry loop if Gemini fails
        attempted_urls = [{"source_url": a["link"], "attempted_at": datetime.datetime.utcnow()} for a in unprocessed_news]
        if attempted_urls:
            db.processed_urls.insert_many(attempted_urls)
            
        # Process with Gemini
        processed_data = services.process_news_with_gemini(unprocessed_news)
        
        articles_to_insert = []
        for article in processed_data.articles:
            # Final deduplication by headline or source_url just in case
            existing = db.news_articles.find_one({
                "$or": [
                    {"headline": article.headline, "published_date": target_date.isoformat()},
                    {"source_url": article.source_url}
                ]
            })
            if not existing:
                articles_to_insert.append({
                    "published_date": target_date.isoformat(),
                    "category": article.category,
                    "headline": article.headline,
                    "description": article.description,
                    "source_url": article.source_url
                })
        
        if articles_to_insert:
            db.news_articles.insert_many(articles_to_insert)
            logger.info(f"Successfully stored {len(articles_to_insert)} new articles for {target_date}.")
        else:
            logger.info(f"No new articles to store for {target_date} (all duplicates or empty batch).")
            
    except Exception as e:
        logger.error(f"Error in news fetch pipeline: {e}")



@app.get("/api/news", response_model=schemas.NewsResponse)
def get_news(
    date: Optional[datetime.date] = None, 
    category: Optional[str] = None, 
    skip: int = 0,
    limit: int = 20,
    db = Depends(get_db)
):
    query = {}
    if date:
        query["published_date"] = date.isoformat()
    if category:
        import re
        safe_category = re.escape(category)
        query["category"] = re.compile(f"^{safe_category}$", re.IGNORECASE)
        
    cursor = db.news_articles.find(query).sort("_id", -1).skip(skip).limit(limit)
    
    articles = []
    for doc in cursor:
        articles.append({
            "id": str(doc["_id"]),
            "published_date": datetime.date.fromisoformat(doc["published_date"]),
            "category": doc["category"],
            "headline": doc["headline"],
            "description": doc["description"],
            "source_url": doc["source_url"]
        })
    return schemas.NewsResponse(articles=articles)

@app.post("/api/news/trigger-fetch")
def trigger_fetch(background_tasks: BackgroundTasks, date: Optional[datetime.date] = None):
    background_tasks.add_task(fetch_and_store_news, date)
    return {"message": f"News fetch pipeline triggered in the background for {date or 'today'}"}

@app.post("/api/assistant/define")
def assistant_define(word: str):
    definition = services.get_definition(word)
    return {"result": definition}

@app.post("/api/assistant/translate")
def assistant_translate(word: str, language: str):
    translation = services.get_translation(word, language)
    return {"result": translation}

@app.get("/api/user/stats", response_model=schemas.UserStatsResponse)
def get_user_stats(email: str, db = Depends(get_db)):
    if not email:
        return schemas.UserStatsResponse(email="", streak_days=0, today_reading_seconds=0, last_active_date="")
    
    today_str = datetime.date.today().isoformat()
    stats = db.user_stats.find_one({"email": email})
    
    if not stats:
        return schemas.UserStatsResponse(email=email, streak_days=0, today_reading_seconds=0, last_active_date="")
    
    # If last active date is older than yesterday, streak might be broken, but we'll let the track-time logic handle exact calculations
    # or just return as is.
    today_reading = stats.get("daily_reading", {}).get(today_str, 0)
    
    return schemas.UserStatsResponse(
        email=email,
        streak_days=stats.get("streak_days", 0),
        today_reading_seconds=today_reading,
        last_active_date=stats.get("last_active_date", "")
    )

@app.post("/api/user/track-time")
def track_user_time(req: schemas.TrackTimeRequest, db = Depends(get_db)):
    if not req.email:
        return {"status": "ignored", "reason": "No email provided"}
        
    today_date = datetime.date.today()
    today_str = today_date.isoformat()
    yesterday_str = (today_date - datetime.timedelta(days=1)).isoformat()
    
    stats = db.user_stats.find_one({"email": req.email})
    
    if not stats:
        db.user_stats.insert_one({
            "email": req.email,
            "streak_days": 1,
            "last_active_date": today_str,
            "daily_reading": {today_str: req.active_seconds}
        })
    else:
        last_active = stats.get("last_active_date", "")
        current_streak = stats.get("streak_days", 0)
        daily_reading = stats.get("daily_reading", {})
        
        # Update streak
        if last_active == yesterday_str:
            current_streak += 1
        elif last_active != today_str:
            # Streak broken, reset to 1
            current_streak = 1
            
        # Update daily reading time
        current_daily = daily_reading.get(today_str, 0)
        daily_reading[today_str] = current_daily + req.active_seconds
        
        db.user_stats.update_one(
            {"email": req.email},
            {"$set": {
                "streak_days": current_streak,
                "last_active_date": today_str,
                "daily_reading": daily_reading
            }}
        )
        
    return {"status": "success"}

@app.get("/api/user/read-articles")
def get_read_articles(email: str, db = Depends(get_db)):
    if not email:
        return {"read_article_ids": []}
    
    stats = db.user_stats.find_one({"email": email})
    if not stats:
        return {"read_article_ids": []}
        
    return {"read_article_ids": stats.get("read_articles", [])}

@app.post("/api/user/read-article")
def mark_article_read(req: schemas.MarkReadRequest, db = Depends(get_db)):
    if not req.email or not req.article_id:
        return {"status": "ignored"}
        
    db.user_stats.update_one(
        {"email": req.email},
        {"$addToSet": {"read_articles": req.article_id}},
        upsert=True
    )
    
    return {"status": "success"}

# --- USER MANAGEMENT / ADMIN ENDPOINTS ---

@app.get("/api/auth/verify")
def verify_user(email: str, db = Depends(get_db)):
    if not email:
        raise HTTPException(status_code=400, detail="Email required")
        
    user = db.users.find_one({"email": email})
    if not user:
        return {"allowed": False, "role": None}
        
    return {"allowed": True, "role": user.get("role", "user")}

def _verify_admin(admin_email: str, db):
    if not admin_email:
        raise HTTPException(status_code=401, detail="Unauthorized")
    admin_user = db.users.find_one({"email": admin_email})
    if not admin_user or admin_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Forbidden")

@app.get("/api/admin/users", response_model=list[schemas.UserResponse])
def get_all_users(admin_email: str, db = Depends(get_db)):
    _verify_admin(admin_email, db)
    users = []
    for u in db.users.find().sort("created_at", -1):
        users.append(schemas.UserResponse(
            email=u["email"],
            role=u.get("role", "user"),
            created_at=u.get("created_at", "")
        ))
    return users

@app.post("/api/admin/users")
def add_user(req: schemas.AddUserRequest, db = Depends(get_db)):
    _verify_admin(req.admin_email, db)
    
    if db.users.find_one({"email": req.email}):
        raise HTTPException(status_code=400, detail="User already exists")
        
    db.users.insert_one({
        "email": req.email,
        "role": req.role,
        "created_at": datetime.datetime.utcnow().isoformat()
    })
    return {"status": "success", "message": f"Added {req.email} as {req.role}"}

@app.put("/api/admin/users/{email}/role")
def update_user_role(email: str, req: schemas.UpdateRoleRequest, db = Depends(get_db)):
    _verify_admin(req.admin_email, db)
    
    res = db.users.update_one({"email": email}, {"$set": {"role": req.role}})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
        
    return {"status": "success", "message": f"Updated {email} role to {req.role}"}

@app.delete("/api/admin/users/{email}")
def delete_user(email: str, admin_email: str, db = Depends(get_db)):
    _verify_admin(admin_email, db)
    
    if email == admin_email:
        raise HTTPException(status_code=400, detail="Cannot delete yourself")
        
    res = db.users.delete_one({"email": email})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
        
    return {"status": "success", "message": f"Removed {email}"}

@app.delete("/api/admin/reset-database")
def reset_database(admin_email: str, db = Depends(get_db)):
    """DANGER: Completely clears the database. Requires admin privileges."""
    _verify_admin(admin_email, db)
    db.users.drop()
    db.news_articles.drop()
    db.processed_urls.drop()
    return {"message": "Database completely reset to initial state"}

if __name__ == "__main__":
    import uvicorn
    import os
    port = int(os.getenv("PORT", 8000))
    # Disable reload on Render to avoid startup issues
    is_render = os.getenv("RENDER") is not None
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=not is_render)
