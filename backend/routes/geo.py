import requests
from fastapi import APIRouter, Query, HTTPException
from core.config import settings

router = APIRouter()

def _require_ors():
    if not settings.ors_api_key:
        raise HTTPException(status_code=500, detail="ORS_API_KEY_NOT_CONFIGURED")

@router.get("/autocomplete")
def geo_autocomplete(q: str = Query(..., min_length=3), limit: int = 8):
    _require_ors()
    url = f"{settings.ors_base_url}/geocode/autocomplete"
    headers = {"Authorization": settings.ors_api_key}
    params = {"text": q.strip(), "boundary.country": "USA", "size": max(1, min(int(limit), 10))}
    r = requests.get(url, headers=headers, params=params, timeout=12)
    if r.status_code >= 400:
        raise HTTPException(status_code=502, detail="ORS_GEOCODE_FAILED")
    data = r.json()

    out = []
    for f in (data.get("features") or [])[:limit]:
        props = f.get("properties") or {}
        geom = f.get("geometry") or {}
        coords = geom.get("coordinates") or [None, None]
        out.append({
            "label": props.get("label") or props.get("name") or "",
            "formatted": props.get("label") or props.get("name") or "",
            "place_id": props.get("id") or props.get("gid") or "",
            "lng": coords[0],
            "lat": coords[1],
            "raw": props,
        })
    return {"results": out}
