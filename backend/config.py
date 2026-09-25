import os
import boto3
from openai import OpenAI
from passlib.context import CryptContext
from dotenv import load_dotenv

load_dotenv()

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
JWT_SECRET = os.getenv("JWT_SECRET", "change-me-in-production-use-long-secret")
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