import os
import time
import requests
import feedparser
import datetime
from typing import Optional
from google import genai
from dotenv import load_dotenv
from schemas import ArticleList
import logging

logger = logging.getLogger(__name__)

load_dotenv()

NEWS_API_KEY = os.getenv("NEWS_API_KEY")
# Initialize the client. The key is picked up from GEMINI_API_KEY env var
client = genai.Client()

def fetch_raw_news(target_date: Optional[datetime.date] = None) -> list:
    if target_date is None:
        target_date = datetime.date.today()
        
    rss_feeds = {
        "National": "https://www.thehindu.com/news/national/feeder/default.rss",
        "International": "https://www.thehindu.com/news/international/feeder/default.rss",
        "Business": "https://www.thehindu.com/business/feeder/default.rss",
        "Markets": "https://www.thehindu.com/business/markets/feeder/default.rss",
        "Economy": "https://www.thehindu.com/business/Economy/feeder/default.rss",
        "Industry": "https://www.thehindu.com/business/Industry/feeder/default.rss",
        "Technology": "https://www.thehindu.com/sci-tech/technology/feeder/default.rss",
        "Internet": "https://www.thehindu.com/sci-tech/internet/feeder/default.rss",
        "Science": "https://www.thehindu.com/sci-tech/science/feeder/default.rss",
        "Agriculture": "https://www.thehindu.com/sci-tech/agriculture/feeder/default.rss",
        "Health": "https://www.thehindu.com/sci-tech/health/feeder/default.rss",
        "Environment": "https://www.thehindu.com/sci-tech/energy-and-environment/feeder/default.rss",
        "Sports": "https://www.thehindu.com/sport/feeder/default.rss",
        "States": "https://www.thehindu.com/news/states/feeder/default.rss",
        "Cities": "https://www.thehindu.com/news/cities/feeder/default.rss",
        "Andhra Pradesh": "https://www.thehindu.com/news/national/andhra-pradesh/feeder/default.rss",
        "Opinion": "https://www.thehindu.com/opinion/feeder/default.rss",
        "Editorial": "https://www.thehindu.com/opinion/editorial/feeder/default.rss",
        "Books": "https://www.thehindu.com/books/feeder/default.rss",
        "Education": "https://www.thehindu.com/education/feeder/default.rss",
        "Elections": "https://www.thehindu.com/elections/feeder/default.rss"
    }
    
    all_articles = []
    
    for category, url in rss_feeds.items():
        try:
            feed = feedparser.parse(url)
            # Check for bozo exception (malformed XML or fetch error)
            if getattr(feed, 'bozo', 0) == 1 and not feed.entries:
                logger.warning(f"Failed to parse RSS feed for {category} at {url}: {feed.bozo_exception}")
                continue
                
            # Extract the top 6 entries from each feed that match target_date or are very fresh (within 1 day of target_date)
            added_for_category = 0
            for entry in feed.entries:
                # Parse the published date
                pub_date = None
                if hasattr(entry, 'published_parsed') and entry.published_parsed:
                    try:
                        pub_date = datetime.date(*entry.published_parsed[:3])
                    except Exception:
                        pass
                
                # Keep articles that are exactly on target_date, or 1 day prior (very fresh)
                is_fresh = False
                if pub_date is None:
                    # If no date is available, default to keeping it
                    is_fresh = True
                else:
                    delta = target_date - pub_date
                    # Within 0 to 1 days (same day or yesterday)
                    if datetime.timedelta(days=0) <= delta <= datetime.timedelta(days=1):
                        is_fresh = True
                
                if is_fresh:
                    article = {
                        "title": entry.title,
                        "link": entry.link,
                        "description": entry.description,
                        "category": category
                    }
                    all_articles.append(article)
                    added_for_category += 1
                    if added_for_category >= 6:
                        break
        except Exception as e:
            logger.error(f"Error fetching or parsing RSS feed for {category} at {url}: {e}", exc_info=True)
            continue
            
    return all_articles

def process_news_with_gemini(raw_news_data: list) -> ArticleList:
    all_processed_articles = []
    # Process in batches of 30 to reduce the number of API calls
    batch_size = 30
    
    for i in range(0, len(raw_news_data), batch_size):
        batch = raw_news_data[i:i + batch_size]
        
        prompt = f"""You are an expert MBA news editor for Sraman Briefcase. Summarize these articles. You MUST assign each article to exactly one of the following categories: 'National', 'International', 'Business', 'Markets', 'Economy', 'Industry', 'Technology', 'Internet', 'Science', 'Agriculture', 'Health', 'Environment', 'Sports', 'States', 'Cities', 'Andhra Pradesh', 'Opinion', 'Editorial', 'Books', 'Education', 'Elections', 'Geopolitics', 'Commerce', 'Politics'. Do NOT invent new categories.
        
        CRITICAL: You MUST process EVERY SINGLE article provided in the input. If the input contains {len(batch)} articles, you MUST output exactly {len(batch)} summaries. Do not group them together. Do not skip any.
        
        Raw news data:
        {batch}
        """
        models_to_try = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-2.0-flash-lite']
        max_retries = 3
        
        for attempt in range(max_retries):
            current_model = models_to_try[attempt % len(models_to_try)]
            try:
                response = client.models.generate_content(
                    model=current_model,
                    contents=prompt,
                    config={
                        'response_mime_type': 'application/json',
                        'response_schema': ArticleList
                    }
                )
                if response.parsed and hasattr(response.parsed, 'articles'):
                    all_processed_articles.extend(response.parsed.articles)
                break
            except Exception as e:
                if "429" in str(e) or "RESOURCE_EXHAUSTED" in str(e):
                    wait_time = 15 * (attempt + 1)
                    logger.warning(f"Transient API rate limit (429/RESOURCE_EXHAUSTED) hit on {current_model}. Waiting {wait_time}s before falling back or retrying...")
                    time.sleep(wait_time)
                elif "503" in str(e) or "UNAVAILABLE" in str(e) or "network" in str(e).lower():
                    wait_time = 10 * (attempt + 1)
                    logger.warning(f"Transient network error or API unavailability on {current_model}. Waiting {wait_time}s before retrying...")
                    time.sleep(wait_time)
                else:
                    logger.error(f"Critical error processing batch starting at index {i} with model {current_model}: {e}", exc_info=True)
                    break
            
        # Sleep to stay well under Gemini's 15 Requests Per Minute free tier limit
        time.sleep(15)
            
    return ArticleList(articles=all_processed_articles)

from deep_translator import GoogleTranslator

def get_definition(word: str) -> str:
    try:
        response = requests.get(f"https://api.dictionaryapi.dev/api/v2/entries/en/{word}")
        if response.status_code != 200:
            return "Sorry, could not find a definition for that word."
            
        data = response.json()
        if not isinstance(data, list) or len(data) == 0:
            return "Sorry, could not find a definition for that word."
            
        entry = data[0]
        meanings = entry.get("meanings", [])
        if not meanings:
            return "No meanings found."
            
        meaning = meanings[0]
        pos = meaning.get("partOfSpeech", "Unknown")
        pos = pos.capitalize()
        definitions = meaning.get("definitions", [])
        
        if not definitions:
            return "No definitions found."
            
        def_text = definitions[0].get("definition", "")
        
        return f"Part of Speech: {pos}\nMeaning: {def_text}"
    except Exception as e:
        return f"Error fetching definition: {e}"

def get_translation(word: str, language: str) -> str:
    try:
        # deep-translator handles lowercase full language names (e.g. 'hindi', 'spanish')
        target_lang = language.lower()
        translated = GoogleTranslator(source='auto', target=target_lang).translate(word)
        return translated
    except Exception as e:
        return f"Error translating text: {e}"
