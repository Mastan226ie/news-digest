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

# Lazy connection: create the client but DON'T call server_info() at import time.
# This lets the FastAPI/uvicorn server start up and bind its port successfully even
# if the Atlas DNS resolves slowly (common cold-start on Render free tier).
# The actual TCP connection is established on the first real operation.
client = MongoClient(MONGODB_URL, serverSelectionTimeoutMS=5000)
db = client[MONGODB_DB_NAME]

def init_db():
    """
    Call this once during app lifespan startup (not at import time) to verify
    connectivity and create indexes. Errors here are logged but don't crash the server.
    """
    try:
        client.server_info()
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
