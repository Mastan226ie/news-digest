import os
import logging
from pymongo import MongoClient
from dotenv import load_dotenv

logger = logging.getLogger(__name__)

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
        self._client = None
        self._db = None

    def _init_db(self):
        if self._client is None:
            self._client = MongoClient(MONGODB_URL, serverSelectionTimeoutMS=5000)
            self._db = self._client[MONGODB_DB_NAME]

    def __getattr__(self, name):
        self._init_db()
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
