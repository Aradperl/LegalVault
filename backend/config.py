import logging
import os
import sys
from urllib.parse import urlparse

import boto3
from openai import OpenAI
from passlib.context import CryptContext
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger("legalvault")

# Railway / production env (set on the backend service, not the dashboard from code):
#   JWT_SECRET          long random value (e.g. openssl rand -hex 32). Required in production.
#   FRONTEND_URL        https://frontend-production-4e4c.up.railway.app
#   CORS_ORIGINS        optional comma-separated extra origins (do not use *)
#   ENVIRONMENT         production
#   AUTO_VERIFY_EMAIL   true only for local/dev; leave unset/false on Railway
#   SES_FROM_EMAIL      verified SES identity used as the From address

INSECURE_JWT_DEFAULT = "change-me-in-production-use-long-secret"
LOCAL_DEV_ORIGINS = ("http://localhost:5173", "http://127.0.0.1:5173")
LOCAL_HOSTS = frozenset({"localhost", "127.0.0.1", "::1"})


def _hostname(url: str) -> str:
    url = (url or "").strip()
    if not url:
        return ""
    parsed = urlparse(url if "://" in url else f"http://{url}")
    return (parsed.hostname or "").lower()


def _normalize_origin(url: str) -> str:
    return (url or "").strip().rstrip("/")


FRONTEND_URL = _normalize_origin(os.getenv("FRONTEND_URL", ""))
ENVIRONMENT = (os.getenv("ENVIRONMENT") or "").strip().lower()
AUTO_VERIFY_EMAIL = (os.getenv("AUTO_VERIFY_EMAIL") or "").strip().lower() in {
    "1",
    "true",
    "yes",
}

# Local-dev JWT fallback is allowed only when FRONTEND_URL's host is localhost.
IS_LOCALHOST = _hostname(FRONTEND_URL) in LOCAL_HOSTS
IS_PRODUCTION = ENVIRONMENT == "production" or not IS_LOCALHOST


def _require_production_jwt_secret() -> str:
    secret = os.getenv("JWT_SECRET")
    if secret and secret != INSECURE_JWT_DEFAULT:
        return secret
    msg = (
        "Refusing to start: JWT_SECRET is missing or still the insecure default "
        f"({INSECURE_JWT_DEFAULT!r}). Set a long random JWT_SECRET when "
        "ENVIRONMENT=production or FRONTEND_URL is not localhost "
        "(e.g. openssl rand -hex 32)."
    )
    logger.error(msg)
    print(msg, file=sys.stderr)
    raise SystemExit(1)


def get_cors_origins() -> list[str]:
    """FRONTEND_URL + CORS_ORIGINS + local Vite. Never returns *."""
    origins: set[str] = set(LOCAL_DEV_ORIGINS)
    if FRONTEND_URL:
        origins.add(FRONTEND_URL)
    for part in (os.getenv("CORS_ORIGINS") or "").split(","):
        origin = _normalize_origin(part)
        if origin and origin != "*":
            origins.add(origin)
    return sorted(origins)


CORS_ORIGINS = get_cors_origins()
JWT_SECRET = (
    _require_production_jwt_secret()
    if IS_PRODUCTION
    else (os.getenv("JWT_SECRET") or INSECURE_JWT_DEFAULT)
)

# AWS
aws_config = {
    "aws_access_key_id": os.getenv("AWS_ACCESS_KEY_ID"),
    "aws_secret_access_key": os.getenv("AWS_SECRET_ACCESS_KEY"),
    "region_name": os.getenv("AWS_REGION")
}

s3_client = boto3.client('s3', **aws_config)
dynamodb = boto3.resource('dynamodb', **aws_config)
contracts_table = dynamodb.Table('Analyzed_Contracts')
users_table = dynamodb.Table('Users')
# Contract_Folders: PK=user_id, SK=folder_id. Attributes: name, color, symbol, contract_ids (list)
folders_table = dynamodb.Table('Contract_Folders')

# AI & Auth
ai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT
JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

# Google Config
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
REDIRECT_URI = os.getenv("REDIRECT_URI", "http://localhost:8000/auth/callback")
SCOPES = [
    'https://www.googleapis.com/auth/calendar.events',
    'https://www.googleapis.com/auth/userinfo.profile',
    'openid'
]