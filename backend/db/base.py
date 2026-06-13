from sqlalchemy.orm import declarative_base

Base = declarative_base()

# IMPORT MODELS SO SQLALCHEMY REGISTERS TABLES
from models.user import User
from models.truck import TruckDB
from models.driver import DriverDB
