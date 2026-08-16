import os
import logging
from pymongo import MongoClient
from dotenv import load_dotenv

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# --- DNS FIX FOR RENDER ---
# Render's internal DNS resolver is completely broken for MongoDB SRV records.
# We force dnspython (used by pymongo) to use Google's public DNS (8.8.8.8) instead.
try:
    import dns.resolver
    dns.resolver.default_resolver = dns.resolver.Resolver(configure=False)
    dns.resolver.default_resolver.nameservers = ['8.8.8.8', '8.8.4.4']
except ImportError:
    pass

load_dotenv()

MONGODB_URL = os.getenv("MONGODB_URL")
MONGODB_DB_NAME = os.getenv("MONGODB_DB_NAME", "news_digest")

if not MONGODB_URL:
    raise ValueError("MONGODB_URL environment variable is missing. Please configure your Atlas URI in backend/.env")
if "<username>" in MONGODB_URL:
    raise ValueError("MONGODB_URL contains a placeholder '<username>'. Please configure your actual Atlas URI in backend/.env")

# Lazy connection proxy to prevent Render DNS crashes during Uvicorn startup
class DatabaseProxy:
    def __init__(self):
        self._db = None
        self._client = None

    def _init_db(self):
        if self._db is None:
            if not MONGODB_URL:
                logger.warning("MONGODB_URL is not set. Database operations will fail.")
                return
            import time
            from pymongo.errors import ConfigurationError
            # Render's DNS often fails on the first few attempts. We must retry the SRV resolution.
            retries = 5
            for attempt in range(retries):
                try:
                    self._client = MongoClient(MONGODB_URL, serverSelectionTimeoutMS=5000)
                    # Force a ping to ensure the connection and DNS actually worked
                    self._client.admin.command('ping')
                    self._db = self._client[MONGODB_DB_NAME]
                    logger.info("🔌 Successfully connected to MongoDB via DatabaseProxy!")
                    break
                except Exception as e:
                    logger.error(f"⚠️ MongoDB DNS/Connection error on attempt {attempt+1}/{retries}: {e}")
                    if attempt < retries - 1:
                        time.sleep(2)
                    else:
                        logger.error("❌ Failed to connect to MongoDB after multiple retries. Raising error.")
                        raise

    def __getattr__(self, name):
        self._init_db()
        if self._db is None:
            raise Exception("Database is not initialized. Check MONGODB_URL.")
        return getattr(self._db, name)
        
    def __getitem__(self, name):
        self._init_db()
        return self._db[name]

db = DatabaseProxy()

def init_db():
    """
    Call this once during app lifespan startup (not at import time) to verify
    connectivity and create indexes. Errors here are logged but don't crash the server.
    """
    try:
        db._init_db()
        db._client.server_info()
        logger.info(f"🔌 Successfully connected to MongoDB database: '{MONGODB_DB_NAME}'")

        db.news_articles.create_index([("published_date", -1)])
        db.news_articles.create_index([("category", 1)])
        logger.info("⚡ Database indexes verified and active on news_articles collection")
    except Exception as e:
        logger.error(f"❌ Failed to connect to MongoDB at startup: {e}")
        logger.error("The server will continue running. Retrying on the next request.")

def get_db():
    try:
        yield db
    finally:
        pass
