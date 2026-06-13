from fastapi import Depends, HTTPException
from core.deps import get_current_user
from models.user import User

def require_roles(*roles: str):
    def _dep(user: User = Depends(get_current_user)):
        if user.role not in roles:
            raise HTTPException(status_code=403, detail="FORBIDDEN")
        return user
    return _dep
