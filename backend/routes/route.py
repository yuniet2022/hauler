import requests
from fastapi import APIRouter, HTTPException
from core.config import settings

router = APIRouter(prefix="/route", tags=["route"])
def _require_ors():
    if not settings.ors_api_key:
        raise HTTPException(status_code=500, detail="ORS_API_KEY_NOT_CONFIGURED")

def safe_float(x, default=None):
    try:
        if x is None:
            return default
        return float(x)
    except Exception:
        return default

def extract_route_summary(geojson):
    meters = 0.0
    seconds = 0.0
    try:
        feat = (geojson.get("features") or [])[0]
        props = feat.get("properties") or {}
        summ = props.get("summary") or {}
        meters = safe_float(summ.get("distance"), 0.0) or 0.0
        seconds = safe_float(summ.get("duration"), 0.0) or 0.0
        if (meters == 0.0 and seconds == 0.0) and (props.get("segments") or []):
            seg0 = (props.get("segments") or [])[0]
            meters = safe_float(seg0.get("distance"), 0.0) or 0.0
            seconds = safe_float(seg0.get("duration"), 0.0) or 0.0
    except Exception:
        pass
    miles = meters / 1609.344 if meters else 0.0
    return {"meters": meters, "seconds": seconds, "miles": miles}

import math

def compute_eta(duration_seconds: float):
    base = max(0.0, safe_float(duration_seconds, 0.0) or 0.0)

    # Defaults (por si no están en settings)
    drive_limit_hours = safe_float(getattr(settings, "drive_limit_hours", 11.0), 11.0) or 11.0
    rest_hours       = safe_float(getattr(settings, "rest_hours", 10.0), 10.0) or 10.0

    buffer_every_hours = safe_float(getattr(settings, "buffer_every_hours", 7.0), 7.0) or 7.0
    buffer_unit_s      = max(0.0, safe_float(getattr(settings, "eta_buffer_seconds", 1800.0), 1800.0) or 1800.0)  # 30 min

    drive_limit_s = max(1.0, drive_limit_hours * 3600.0)
    rest_s        = max(0.0, rest_hours * 3600.0)
    buffer_every_s= max(1.0, buffer_every_hours * 3600.0)

    # ---------------- BREAKS (sleep) ----------------
    # ceil(base/11h) - 1  => 11.00h => 0, 11.01h => 1, 22.00h => 1, 22.01h => 2
    if base <= drive_limit_s:
        breaks_count = 0
    else:
        breaks_count = max(0, int(math.ceil(base / drive_limit_s)) - 1)

    breaks_seconds = breaks_count * rest_s

    # ---------------- BUFFERS ----------------
    # si base <= 7h => 0
    # si base > 7h => ceil(base/7h) buffers (redondeo por exceso)
    if base <= buffer_every_s:
        buffers_count = 0
    else:
        buffers_count = int(math.ceil(base / buffer_every_s))

    buffer_seconds = buffers_count * buffer_unit_s

    eta_seconds = int(base + breaks_seconds + buffer_seconds)

    return {
        "avg_speed_mph": getattr(settings, "avg_truck_mph", 62.0),
        "buffer_seconds": int(buffer_seconds),
        "buffers_count": buffers_count,
        "breaks_count": breaks_count,
        "break_seconds": int(breaks_seconds),
        "eta_seconds": eta_seconds,
    }

def directions_with_fallback(s_lng, s_lat, e_lng, e_lat):
    _require_ors()

    def call(profile: str):
        url = f"{settings.ors_base_url}/v2/directions/{profile}/geojson"
        headers = {"Authorization": settings.ors_api_key, "Content-Type": "application/json"}
        body = {"coordinates": [[s_lng, s_lat], [e_lng, e_lat]]}

        r = requests.post(url, headers=headers, json=body, timeout=15)

        if r.status_code >= 400:
            # IMPORTANTE: devuelve el status y un pedacito del body
            raise HTTPException(
                status_code=502,
                detail=f"ORS_{profile}_HTTP_{r.status_code}: {r.text[:200]}"
            )

        out = r.json()
        out["profile_used"] = profile
        return out

    try:
        return call("driving-hgv")
    except HTTPException:
        return call("driving-car")

from fastapi import HTTPException

@router.post("/estimate")
def route_estimate(payload: dict):
    origin = payload.get("origin") or {}
    dest = payload.get("destination") or {}

    s_lat = safe_float(origin.get("lat"), None)
    s_lng = safe_float(origin.get("lng"), None)
    e_lat = safe_float(dest.get("lat"), None)
    e_lng = safe_float(dest.get("lng"), None)

    if None in [s_lat, s_lng, e_lat, e_lng]:
        raise HTTPException(status_code=422, detail="invalid_origin_destination_coords")

    try:
        geo = directions_with_fallback(s_lng, s_lat, e_lng, e_lat)
    except Exception as e:
        msg = str(e)

        # ORS "no routable point" / code 2010
        if ("Could not find routable point" in msg) or ('"code":2010' in msg) or ("code': 2010" in msg) or ("ORS_" in msg):
            raise HTTPException(
                status_code=422,
                detail={
                    "code": "unroutable_point",
                    "message": "Por favor cambie la dirección; esa ubicación tiene restricciones o no es enrutable. Seleccione otra sugerencia del autocomplete.",
                    "raw": msg,
                },
            )

        # cualquier otro error real
        raise HTTPException(
            status_code=500,
            detail={"code": "estimate_failed", "raw": msg},
        )

    summ = extract_route_summary(geo)
    eta = compute_eta(summ["seconds"])

    return {
        "routing": {
            "profile_used": geo.get("profile_used"),
            "distance_meters": summ["meters"],
            "distance_miles": summ["miles"],
            "duration_seconds": summ["seconds"],
            "geojson": geo,
            "provider": "openrouteservice",
        },
        "eta": eta,
    }
