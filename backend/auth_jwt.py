import os
from datetime import datetime, timedelta
from typing import Any, Dict, Callable, Optional

from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import jwt, JWTError
from passlib.context import CryptContext

# --------------------
# PASSWORDS (bcrypt)
# --------------------
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(p: str) -> str:
    return pwd_context.hash(p)

def verify_password(p: str, hashed: str) -> bool:
    try:
        return pwd_context.verify(p, hashed)
    except Exception:
        return False

def looks_like_bcrypt(s: str) -> bool:
    if not s:
        return False
    return s.startswith("$2a$") or s.startswith("$2b$") or s.startswith("$2y$")

def verify_and_migrate_password(db, user, raw_password: str, password_field: str = "password") -> bool:
    """
    - Si en DB hay bcrypt, verifica normal
    - Si en DB está plano (legacy), compara plano y MIGRA a bcrypt en el primer login
    """
    stored = getattr(user, password_field, None) or ""
    if looks_like_bcrypt(stored):
        return verify_password(raw_password, stored)

    # legacy (plain)
    if raw_password == stored:
        setattr(user, password_field, hash_password(raw_password))
        db.add(user)
        db.commit()
        db.refresh(user)
        return True

    return False

# --------------------
# JWT
# --------------------
security = HTTPBearer(auto_error=True)

JWT_SECRET = os.getenv("JWT_SECRET", "")
JWT_ALG = os.getenv("JWT_ALG", "HS256")
JWT_EXPIRES_MIN = int(os.getenv("JWT_EXPIRES_MIN", "1440"))

if not JWT_SECRET:
    # En prod: mejor abortar al arrancar, pero lo dejo como warning para que no te tumbe el boot.
    print("WARNING: JWT_SECRET is missing. Set it in /etc/autologix-backend.env")

def create_access_token(payload: Dict[str, Any]) -> str:
    exp = datetime.utcnow() + timedelta(minutes=JWT_EXPIRES_MIN)
    to_encode = {**payload, "exp": exp}
    return jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALG)

def decode_token(token: str) -> Dict[str, Any]:
    return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALG])

def get_current_user_payload(creds: HTTPAuthorizationCredentials = Depends(security)) -> Dict[str, Any]:
    token = creds.credentials
    try:
        data = decode_token(token)
        return data
    except JWTError:
        raise HTTPException(status_code=401, detail="INVALID_TOKEN")

def get_current_user_id(creds: HTTPAuthorizationCredentials = Depends(security)) -> str:
    data = get_current_user_payload(creds)
    user_id = data.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="INVALID_TOKEN")
    return str(user_id)

def build_current_user_dependency(get_db, UserModel) -> Callable:
    """
    Devuelve una función dependency que:
    - lee JWT
    - busca user en DB
    - devuelve el user
    """
    def _dep(
        db = Depends(get_db),
        creds: HTTPAuthorizationCredentials = Depends(security),
    ):
        data = get_current_user_payload(creds)
        user_id = data.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="INVALID_TOKEN")

        user = db.query(UserModel).filter(UserModel.id == str(user_id)).first()
        if not user:
            raise HTTPException(status_code=401, detail="USER_NOT_FOUND")
        return user

    return _dep

def require_roles(get_current_user_dep: Callable, *roles: str) -> Callable:
    """
    Uso:
      require_client = require_roles(get_current_user, "client")
      @app.get(..., dependencies=[Depends(require_client)])
    """
    def _dep(user = Depends(get_current_user_dep)):
        user_role = getattr(user, "role", None)
        if user_role not in roles:
            raise HTTPException(status_code=403, detail="FORBIDDEN")
        return user
    return _dep
