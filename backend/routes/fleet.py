import uuid
import secrets
import string
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from core.deps import get_db, get_current_user
from models.truck import TruckDB
from models.driver import DriverDB
from models.user import User
from core.security import hash_password
from core.mailer import send_driver_credentials_email

router = APIRouter(tags=["fleet"])

def generate_temp_password(length: int = 10) -> str:
    alphabet = string.ascii_letters + string.digits + "!@#$%&*"
    return "".join(secrets.choice(alphabet) for _ in range(length))



# --------------------
# TRUCKS
# --------------------

@router.get("/trucks/{owner_id}")
def get_trucks(
    owner_id: str,
    db: Session = Depends(get_db),
    auth=Depends(get_current_user),
):
    user, _, _, _ = auth

    if user.role != "admin":
        owner_id = user.id

    items = db.query(TruckDB).filter(TruckDB.owner_id == str(owner_id)).all()

    return [
        {
            "id": t.id,
            "owner_id": t.owner_id,
            "name": t.name,
            "vin": t.vin,
            "plate": t.plate,
            "status": t.status,
        }
        for t in items
    ]

@router.post("/trucks")
def add_truck(
    truck: dict,
    db: Session = Depends(get_db),
    auth=Depends(get_current_user),
):
    user, _, _, _ = auth

    owner_id = (truck.get("owner_id") or "").strip()

    if user.role != "admin":
        owner_id = user.id

    if not owner_id:
        raise HTTPException(status_code=422, detail="owner_id_required")

    t = TruckDB(
        id=f"TRK-{uuid.uuid4().hex[:6].upper()}",
        owner_id=owner_id,
        name=truck.get("name"),
        vin=truck.get("vin"),
        plate=truck.get("plate"),
        status=truck.get("status") or "READY",
    )

    db.add(t)
    db.commit()
    db.refresh(t)

    return {
        "id": t.id,
        "owner_id": t.owner_id,
        "name": t.name,
        "vin": t.vin,
        "plate": t.plate,
        "status": t.status,
    }


# --------------------
# DRIVERS
# --------------------

@router.get("/drivers/{owner_id}")
def get_drivers(
    owner_id: str,
    db: Session = Depends(get_db),
    auth=Depends(get_current_user),
):
    user, _, _, _ = auth

    if user.role != "admin":
        owner_id = user.id

    items = db.query(DriverDB).filter(DriverDB.owner_id == str(owner_id)).all()

    return [
        {
            "id": d.id,
            "owner_id": d.owner_id,
            "name": d.name,
            "email": d.email,
            "phone": d.phone,
            "license_number": d.license_number,
            "license_expiration": str(d.license_expiration) if d.license_expiration else None,
            "status": d.status,
        }
        for d in items
    ]

@router.post("/drivers")
def add_driver(
    driver: dict,
    db: Session = Depends(get_db),
    auth=Depends(get_current_user),
):
    user, _, _, _ = auth

    if user.role not in ["admin", "carrier"]:
        raise HTTPException(status_code=403, detail="FORBIDDEN")

    owner_id = (driver.get("owner_id") or "").strip()

    # OBLIGATORIO: carrier solo crea choferes para sí mismo
    if user.role != "admin":
        owner_id = str(user.id)

    if not owner_id:
        raise HTTPException(status_code=422, detail="owner_id_required")

    name = (driver.get("name") or "").strip()
    phone = (driver.get("phone") or "").strip()
    email = (driver.get("email") or "").strip().lower()
    license_number = (driver.get("license_number") or "").strip()
    license_expiration_raw = (driver.get("license_expiration") or "").strip()

    if not name:
        raise HTTPException(status_code=422, detail="name_required")

    if not phone:
        raise HTTPException(status_code=422, detail="phone_required")

    if not email:
        raise HTTPException(status_code=422, detail="email_required")

    existing_user = db.query(User).filter(User.email == email).first()
    if existing_user:
        raise HTTPException(status_code=409, detail="email_already_exists")

    license_expiration = None
    if license_expiration_raw:
        try:
            license_expiration = datetime.strptime(license_expiration_raw, "%Y-%m-%d").date()
        except ValueError:
            raise HTTPException(status_code=422, detail="license_expiration_invalid_format_use_YYYY_MM_DD")

    temp_password = generate_temp_password()

    new_user = User(
        name=name,
        email=email,
        password_hash=hash_password(temp_password),
        role="driver",
        status="ACTIVE",
        phone=phone,
        must_change_password=True,
    )
    db.add(new_user)
    db.flush()  # get new_user.id without full commit

    d = DriverDB(
        id=f"DRV-{uuid.uuid4().hex[:6].upper()}",
        owner_id=str(owner_id),
        user_id=new_user.id,
        name=name,
        email=email,
        phone=phone,
        license_number=license_number or None,
        license_expiration=license_expiration,
        status=driver.get("status") or "AVAILABLE",
    )

    db.add(d)
    db.commit()
    db.refresh(d)
    try:
        send_driver_credentials_email(
            to_email=email,
            temp_password=temp_password,
            name=name,
        )
    except Exception as e:
        print("DRIVER EMAIL ERROR:", str(e))

    return {
        "id": d.id,
        "owner_id": d.owner_id,
        "user_id": str(d.user_id) if d.user_id else None,
        "name": d.name,
        "email": d.email,
        "phone": d.phone,
        "license_number": d.license_number,
        "license_expiration": str(d.license_expiration) if d.license_expiration else None,
        "status": d.status,
        "temp_password": temp_password,
        "must_change_password": True,
    }


@router.delete("/drivers/{driver_id}")
def delete_driver(
    driver_id: str,
    db: Session = Depends(get_db),
    auth=Depends(get_current_user),
):
    user, _, _, _ = auth

    d = db.query(DriverDB).filter(DriverDB.id == driver_id).first()
    if not d:
        raise HTTPException(status_code=404, detail="driver_not_found")

    # OBLIGATORIO: carrier solo elimina choferes propios
    if user.role != "admin" and str(d.owner_id) != str(user.id):
        raise HTTPException(status_code=403, detail="FORBIDDEN")

    linked_user = None
    if d.user_id:
        try:
            linked_user = db.query(User).filter(User.id == d.user_id).first()
        except Exception:
            linked_user = None

    if linked_user:
        linked_user.status = "DISABLED"

    db.delete(d)
    db.commit()

    return {"ok": True, "deleted_id": driver_id}

@router.delete("/trucks/{truck_id}")
def delete_truck(
    truck_id: str,
    db: Session = Depends(get_db),
    auth=Depends(get_current_user),
):
    user, _, _, _ = auth

    truck = db.query(TruckDB).filter(TruckDB.id == truck_id).first()
    if not truck:
        raise HTTPException(status_code=404, detail="truck_not_found")

    if user.role != "admin" and str(truck.owner_id) != str(user.id):
        raise HTTPException(status_code=403, detail="FORBIDDEN")

    db.delete(truck)
    db.commit()

    return {"ok": True, "deleted_id": truck_id}
