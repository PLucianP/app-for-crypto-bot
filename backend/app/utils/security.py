from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from jose import JWTError, jwt
from passlib.context import CryptContext
from cryptography.fernet import Fernet
from app.config import get_settings
import base64
import secrets

settings = get_settings()

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Encryption for API keys
def generate_encryption_key() -> bytes:
    """Generate a new encryption key"""
    return Fernet.generate_key()

def get_or_create_encryption_key() -> Fernet:
    """Get or create encryption key from settings"""
    # In production, this should be stored securely
    key = settings.secret_key.encode()[:32].ljust(32, b'0')
    encoded_key = base64.urlsafe_b64encode(key)
    return Fernet(encoded_key)

def encrypt_api_key(api_key: str) -> str:
    """Encrypt an API key"""
    fernet = get_or_create_encryption_key()
    encrypted = fernet.encrypt(api_key.encode())
    return encrypted.decode()

def decrypt_api_key(encrypted_key: str) -> str:
    """Decrypt an API key"""
    fernet = get_or_create_encryption_key()
    decrypted = fernet.decrypt(encrypted_key.encode())
    return decrypted.decode()

def mask_api_key(api_key: str) -> str:
    """Mask API key showing only last 4 characters"""
    if len(api_key) <= 4:
        return "*" * len(api_key)
    return "*" * (len(api_key) - 4) + api_key[-4:]

# JWT tokens
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Create JWT access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.access_token_expire_minutes)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)
    return encoded_jwt

def verify_token(token: str) -> Optional[Dict[str, Any]]:
    """Verify JWT token"""
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        return payload
    except JWTError:
        return None

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password against hash"""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """Hash a password"""
    return pwd_context.hash(password)

def generate_api_token() -> str:
    """Generate a secure random API token"""
    return secrets.token_urlsafe(32)
