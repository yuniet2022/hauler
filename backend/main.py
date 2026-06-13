import logging
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from core.config import settings
from db.base import Base
from db.session import engine

from routes.health import router as health_router
from routes.auth import router as auth_router
from routes.users import router as users_router
from routes.geo import router as geo_router
from routes.route import router as route_router
from routes.market import router as market_router
from routes.client_requests import router as client_requests_router
from routes.fleet import router as fleet_router
from routes.system import router as system_router
from routes.inspections import router as inspections_router
from routes.autocomplete import router as autocomplete_router
from routes.admin import router as admin_router
from routes.companies import router as companies_router
from routes.offers import router as offers_router
from routes.kyc import router as kyc_router
from routes.admin_kyc import router as admin_kyc_router
from routes.client_kyc import router as client_kyc_router

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("AUTOLOGIX-PRO")

app = FastAPI(title="Car Route System API", docs_url="/docs", openapi_url="/openapi.json")
Base.metadata.create_all(bind=engine)


app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def log_req(request: Request, call_next):
    logger.info(f"{request.method} {request.url.path}")
    return await call_next(request)

@app.get("/api/health")
def health():
    return {"status": "ONLINE", "service": "autologix-pro"}

# ------------------------
# ROUTER LOADER (SAFE)
# ------------------------
def include_router_safe(import_path: str, prefix: str, tag: str):
    """
    import_path example: "routes.auth"
    expects module has: router = APIRouter(...)
    """
    try:
        mod = __import__(import_path, fromlist=["router"])
        r = getattr(mod, "router", None)
        if r is None:
            logger.warning(f"[router-missing] {import_path} has no `router` object")
            return
        app.include_router(r, prefix=prefix, tags=[tag])
        logger.info(f"[router] loaded {import_path} -> {prefix}")
    except Exception as e:
        logger.warning(f"[router-skip] {import_path} not loaded: {e}")

# Ensure tables exist (sin alembic por ahora)
# Ensure tables exist (sin alembic por ahora)
Base.metadata.create_all(bind=engine)

# ------------------------
# ROUTERS (ONE PREFIX RULE)
# ------------------------
app.include_router(health_router, prefix="/api", tags=["health"])
app.include_router(auth_router, prefix="/api/auth", tags=["auth"])

# 👇 estos routers deben tener prefix interno tipo "/users", "/geo", etc (SIN /api)
app.include_router(users_router, prefix="/api", tags=["users"])
app.include_router(autocomplete_router, prefix="/api", tags=["autocomplete"])
app.include_router(geo_router, prefix="/api", tags=["geo"])
app.include_router(route_router, prefix="/api", tags=["route"])
app.include_router(market_router, prefix="/api", tags=["market"])
app.include_router(client_requests_router, prefix="/api", tags=["client-requests"])
app.include_router(fleet_router, prefix="/api", tags=["fleet"])
app.include_router(system_router, prefix="/api", tags=["system"])
app.include_router(inspections_router, prefix="/api", tags=["inspections"])
app.include_router(kyc_router, prefix="/api")
app.include_router(admin_kyc_router, prefix="/api")
app.include_router(client_kyc_router, prefix="/api")

# admin/companies/offers con safe loader
include_router_safe("routes.admin", "/api", "admin")
include_router_safe("routes.companies", "/api", "companies")
include_router_safe("routes.offers", "/api", "offers")

