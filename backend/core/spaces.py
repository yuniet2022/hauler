from core.config import settings

def spaces_ready() -> bool:
    return all([settings.spaces_bucket, settings.spaces_key, settings.spaces_secret, settings.spaces_endpoint])

def spaces_public_url(key: str) -> str:
    base = settings.spaces_public_base.rstrip("/") if settings.spaces_public_base else ""
    return f"{base}/{key}" if base else key
