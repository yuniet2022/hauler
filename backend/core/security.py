from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional
import jwt
from passlib.context import CryptContext
from passlib.exc import UnknownHashError
from core.config import settings

pwd_context = CryptContext(
    schemes=["bcrypt", "pbkdf2_sha256"],
    deprecated="auto",
)

def hash_password(pw: str) -> str:
    return pwd_context.hash(pw)

def verify_password(pw: str, pw_hash: str) -> bool:
    if not pw_hash:
        return False
    try:
        return pwd_context.verify(pw, pw_hash)
    except UnknownHashError:
        return False
    except Exception:
        return False

def create_token(payload: Dict[str, Any], expires_minutes: Optional[int] = None) -> str:
    exp_min = expires_minutes if expires_minutes is not None else settings.jwt_expires_min
    to_encode = dict(payload)
    to_encode["exp"] = datetime.now(timezone.utc) + timedelta(minutes=int(exp_min))
    to_encode["iat"] = datetime.now(timezone.utc)
    return jwt.encode(to_encode, settings.jwt_secret, algorithm=settings.jwt_alg)

def decode_token(token: str) -> Dict[str, Any]:
    return jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_alg])
