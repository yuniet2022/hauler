from fastapi import APIRouter
router = APIRouter()

@router.get("/health")
def health():
    return {"status": "ONLINE", "service": "car-route-backend"}

@router.get("")
def api_root():
    return {"status": "ONLINE"}
