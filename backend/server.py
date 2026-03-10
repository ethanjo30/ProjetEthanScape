from fastapi import FastAPI, APIRouter, HTTPException, Depends
from sqlalchemy import create_engine, Column, String, Integer, Float, Boolean, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from starlette.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from typing import List, Optional
import uuid
import os
from pathlib import Path
from dotenv import load_dotenv

# 1. Chargement de l'environnement
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# 2. Configuration MySQL
DATABASE_URL = "mysql+pymysql://root:Eth%40nSc%40p01@localhost:3306/ethanscape"

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# 3. Modèles de la base de données (Tables MySQL)
class EscapeGameDB(Base):
    __tablename__ = "escapes"
    id = Column(String(50), primary_key=True)
    title = Column(String(100))
    description = Column(Text)
    theme = Column(String(50))
    difficulty = Column(Integer)
    min_players = Column(Integer)
    max_players = Column(Integer)
    image_url = Column(String(255))
    is_active = Column(Boolean, default=True)

class ReservationDB(Base):
    __tablename__ = "reservations"
    id = Column(String(50), primary_key=True)
    escape_id = Column(String(50))
    client_name = Column(String(100))
    client_email = Column(String(100))
    date = Column(String(20))
    time_slot = Column(String(10))
    num_people = Column(Integer)
    total_price = Column(Float)

# Créer les tables si elles n'existent pas
Base.metadata.create_all(bind=engine)

# 4. FastAPI Setup
app = FastAPI()
api_router = APIRouter(prefix="/api")

# Configuration CORS (pour que le site React puisse parler au Python)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# 5. Configuration des Prix
PRICING = {
    "4-9": {"30": 22, "60": 25, "90": 28},
    "10-19": {"30": 19, "60": 22, "90": 25},
    "20-29": {"30": 16, "60": 19, "90": 22},
    "30-39": {"30": 13, "60": 16, "90": 19}
}

# 6. Dépendance pour la base de données
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# 7. Routes de l'API
@api_router.get("/escapes")
def get_escapes(db: Session = Depends(get_db)):
    return db.query(EscapeGameDB).all()

@api_router.post("/calculate-price")
def calculate_price(num_people: int, duration: int):
    # Logique de détermination de la catégorie
    if 4 <= num_people <= 9: category = "4-9"
    elif 10 <= num_people <= 19: category = "10-19"
    elif 20 <= num_people <= 29: category = "20-29"
    elif 30 <= num_people <= 39: category = "30-39"
    else: raise HTTPException(status_code=400, detail="Groupe doit être entre 4 et 39 personnes")

    price_pp = PRICING[category].get(str(duration))
    if not price_pp: raise HTTPException(status_code=400, detail="Durée invalide")
    
    return {
        "price_per_person": price_pp,
        "total_price": price_pp * num_people,
        "category": category
    }

@api_router.get("/seed")
def seed_db(db: Session = Depends(get_db)):
    # Ajoute un jeu de test pour voir si ça marche
    if db.query(EscapeGameDB).count() == 0:
        test_game = EscapeGameDB(
            id=str(uuid.uuid4()),
            title="Le Manoir de l'Oubli",
            theme="Horreur",
            description="Saurez-vous sortir vivant ?",
            difficulty=4, min_players=4, max_players=10,
            image_url="https://images.unsplash.com/photo-1509248961895-a37c5bb79ad2?w=800"
        )
        db.add(test_game)
        db.commit()
    return {"message": "Base ethanscape prête !"}

# 8. Lancement
app.include_router(api_router)