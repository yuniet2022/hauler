# backend/main.py
from fastapi import FastAPI, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import uuid
import os
import sqlalchemy
from sqlalchemy import create_engine, Column, Integer, String, Float, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session

app = FastAPI()

# --- CONFIGURACIÓN BASE DE DATOS ---
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://user:password@db:5432/autologix")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# --- MODELOS SQL ---
class LoadModel(Base):
    __tablename__ = "loads"
    id = Column(String, primary_key=True, index=True)
    origin = Column(String)
    destination = Column(String)
    price = Column(Float)
    status = Column(String)

# Crear tablas
Base.metadata.create_all(bind=engine)

# Dependencia para obtener sesión DB
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- SCHEMAS (Pydantic) ---
class QuoteRequest(BaseModel):
    origin: str
    destination: str
    vehicle: str
    inoperable: bool

# --- ENDPOINTS ---

@app.get("/")
def read_root():
    return {"status": "online", "system": "AutoLogix AI Backend v1.0"}

@app.post("/api/quote")
def calculate_quote(req: QuoteRequest):
    # Lógica de precios (Demo)
    base_rate = 0.85 # $0.85 por milla
    miles_simulated = 1200 # Simulado
    
    price = miles_simulated * base_rate
    if req.inoperable:
        price += 150 # Winch fee
        
    return {
        "price": round(price, 2),
        "miles": miles_simulated,
        "valid_until": datetime.now().isoformat()
    }

@app.get("/api/health")
def health_check():
    return {"db": "connected"}