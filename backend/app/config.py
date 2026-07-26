import os
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI", "")
MONGO_DB_NAME = os.getenv("MONGO_DB_NAME", "cropcast")

CLERK_PUBLISHABLE_KEY = os.getenv("CLERK_PUBLISHABLE_KEY", "")
CLERK_SECRET_KEY = os.getenv("CLERK_SECRET_KEY", "")
CLERK_ISSUER_DOMAIN = os.getenv("CLERK_ISSUER_DOMAIN", "")

PORT = int(os.getenv("PORT", 5000))
NODE_ENV = os.getenv("NODE_ENV", "development")
