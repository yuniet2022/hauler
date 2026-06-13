import os
from dotenv import load_dotenv

load_dotenv("/etc/autologix-backend.env")

class Settings:
    database_url = os.getenv("DATABASE_URL", "").strip()
    if not database_url:
        raise RuntimeError("DATABASE_URL missing")

    cors_raw = os.getenv("CORS_ORIGINS", "*").strip()
    cors_origins = ["*"] if cors_raw == "*" else [x.strip() for x in cors_raw.split(",") if x.strip()]

    jwt_secret = os.getenv("JWT_SECRET", "CHANGE_ME").strip()
    jwt_alg = os.getenv("JWT_ALG", "HS256").strip()
    jwt_expires_min = int(os.getenv("JWT_EXPIRES_MIN", "43200"))

    ors_api_key = (os.getenv("ORS_API_KEY") or "").strip().strip('"').strip("'")
    ors_base_url = os.getenv("ORS_BASE_URL", "https://api.openrouteservice.org").rstrip("/")

    avg_truck_mph = float(os.getenv("AVG_TRUCK_MPH", "62"))
    drive_limit_hours = float(os.getenv("DRIVE_LIMIT_HOURS", "11"))
    rest_hours = float(os.getenv("REST_HOURS", "10"))
    eta_buffer_seconds = int(os.getenv("ETA_BUFFER_SECONDS", "1800"))

    allowed_public_roles = {"carrier", "dealer", "client", "admin", "driver"}

    # Spaces
    spaces_region = os.getenv("SPACES_REGION", "").strip()
    spaces_bucket = os.getenv("SPACES_BUCKET", "").strip()
    spaces_key = os.getenv("SPACES_KEY", "").strip()
    spaces_secret = os.getenv("SPACES_SECRET", "").strip()
    spaces_endpoint = os.getenv("SPACES_ENDPOINT", "").strip()
    spaces_public_base = os.getenv("SPACES_PUBLIC_BASE", "").strip()

    # RQ (prepared, off by default)
    use_rq = (os.getenv("USE_RQ", "0").strip() == "1")
    redis_url = os.getenv("REDIS_URL", "redis://127.0.0.1:6379/0").strip()
    rq_queue_name = os.getenv("RQ_QUEUE_NAME", "autologix").strip()
    rq_job_timeout = int(os.getenv("RQ_JOB_TIMEOUT", "900"))

    # SMTP
    smtp_host = os.getenv("SMTP_HOST", "").strip()
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_user = os.getenv("SMTP_USER", "").strip()
    smtp_pass = os.getenv("SMTP_PASS", "").strip()
    smtp_from = os.getenv("SMTP_FROM", "").strip()

settings = Settings()
