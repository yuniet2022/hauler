from fastapi import APIRouter, Query
import requests
from core.config import settings

router = APIRouter(tags=["Autocomplete"])

@router.get("/autocomplete")
def autocomplete(
    q: str = Query(..., min_length=2),
    limit: int = Query(8, ge=1, le=20),
):
    url = f"{settings.ors_base_url}/geocode/autocomplete"

    params = {
        "api_key": settings.ors_api_key,
        "text": q,
        "size": limit,
        # IMPORTANTE: fuerza USA (ORS lo soporta)
        "boundary.country": "USA",
    }

    r = requests.get(url, params=params, timeout=8)
    r.raise_for_status()

    data = r.json()
    features = data.get("features", [])

    results = []
    for f in features:
        props = f.get("properties", {})
        geom = f.get("geometry", {})
        coords = geom.get("coordinates", [None, None])

        country = props.get("country")
        if country not in ("United States", "USA", "United States of America"):
            continue

        label = props.get("label") or props.get("name") or ""
        name = props.get("name") or label

        results.append({
            "label": label,
            "name": name,
            "city": props.get("locality"),
            "state": props.get("region"),
            "country": "United States",
            "lat": coords[1],
            "lng": coords[0],
        })

    return {"results": results}
