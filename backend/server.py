from fastapi import FastAPI, APIRouter, HTTPException
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import urllib.parse
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone
from dotenv import load_dotenv

# Chargement du .env
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Récupération des variables
mongo_url = os.getenv('MONGO_URL')
db_name = os.getenv('DB_NAME')

if not mongo_url:
    raise RuntimeError("ERREUR : MONGO_URL est introuvable dans le fichier .env")

# Connexion MongoDB
client = AsyncIOMotorClient(mongo_url)
db = client[db_name]

app = FastAPI()
api_router = APIRouter(prefix="/api")

# ========================
# PRICING CONFIGURATION
# ========================
PRICING = {
    "4-9": {"30": 22, "60": 25, "90": 28},
    "10-19": {"30": 19, "60": 22, "90": 25},
    "20-29": {"30": 16, "60": 19, "90": 22},
    "30-39": {"30": 13, "60": 16, "90": 19}
}

# ========================
# MODELS
# ========================
class EscapeGame(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: str
    theme: str
    difficulty: int  # 1-5
    min_players: int
    max_players: int
    image_url: str
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class EscapeGameCreate(BaseModel):
    title: str
    description: str
    theme: str
    difficulty: int
    min_players: int
    max_players: int
    image_url: str

class Reservation(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    escape_id: str
    escape_title: str
    client_name: str
    client_email: str
    client_phone: str
    client_address: str
    date: str
    time_slot: str
    duration: int  # 30, 60, 90 minutes
    num_people: int
    price_per_person: float
    total_price: float
    message: Optional[str] = None
    status: str = "pending"  # pending, confirmed, cancelled
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ReservationCreate(BaseModel):
    escape_id: str
    escape_title: str
    client_name: str
    client_email: EmailStr
    client_phone: str
    client_address: str
    date: str
    time_slot: str
    duration: int
    num_people: int
    message: Optional[str] = None

class ContactMessage(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    email: str
    phone: Optional[str] = None
    subject: str
    message: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ContactMessageCreate(BaseModel):
    name: str
    email: EmailStr
    phone: Optional[str] = None
    subject: str
    message: str

class PriceCalculation(BaseModel):
    num_people: int
    duration: int  # 30, 60, 90

class PriceResponse(BaseModel):
    price_per_person: float
    total_price: float
    group_category: str

class TimeSlot(BaseModel):
    time: str
    is_available: bool

# ========================
# HELPER FUNCTIONS
# ========================
def calculate_price(num_people: int, duration: int) -> dict:
    """Calculate price based on number of people and duration"""
    if num_people < 4 or num_people > 39:
        raise HTTPException(status_code=400, detail="Nombre de personnes doit être entre 4 et 39")
    
    if duration not in [30, 60, 90]:
        raise HTTPException(status_code=400, detail="Durée doit être 30, 60 ou 90 minutes")
    
    # Determine group category
    if 4 <= num_people <= 9:
        category = "4-9"
        category_label = "4-9 personnes"
    elif 10 <= num_people <= 19:
        category = "10-19"
        category_label = "10-19 personnes"
    elif 20 <= num_people <= 29:
        category = "20-29"
        category_label = "20-29 personnes"
    else:
        category = "30-39"
        category_label = "30-39 personnes"
    
    price_per_person = PRICING[category][str(duration)]
    total_price = price_per_person * num_people
    
    return {
        "price_per_person": price_per_person,
        "total_price": total_price,
        "group_category": category_label
    }

# ========================
# ROUTES - ESCAPES
# ========================
@api_router.get("/")
async def root():
    return {"message": "EthanScape API"}

@api_router.get("/escapes", response_model=List[EscapeGame])
async def get_escapes(theme: Optional[str] = None):
    """Get all escape games, optionally filtered by theme"""
    query = {"is_active": True}
    if theme and theme != "all":
        query["theme"] = theme
    
    escapes = await db.escapes.find(query, {"_id": 0}).to_list(100)
    
    for escape in escapes:
        if isinstance(escape.get('created_at'), str):
            escape['created_at'] = datetime.fromisoformat(escape['created_at'])
    
    return escapes

@api_router.get("/escapes/{escape_id}", response_model=EscapeGame)
async def get_escape(escape_id: str):
    """Get a specific escape game by ID"""
    escape = await db.escapes.find_one({"id": escape_id}, {"_id": 0})
    if not escape:
        raise HTTPException(status_code=404, detail="Escape game non trouvé")
    
    if isinstance(escape.get('created_at'), str):
        escape['created_at'] = datetime.fromisoformat(escape['created_at'])
    
    return escape

@api_router.post("/escapes", response_model=EscapeGame) 
async def create_escape(escape: EscapeGameCreate):
    """Create a new escape game"""
    escape_obj = EscapeGame(**escape.model_dump())
    doc = escape_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.escapes.insert_one(doc)
    return escape_obj

@api_router.get("/themes")
async def get_themes():
    """Get all unique themes"""
    themes = await db.escapes.distinct("theme", {"is_active": True})
    return {"themes": themes}

# ========================
# ROUTES - PRICING
# ========================
@api_router.post("/calculate-price", response_model=PriceResponse)
async def calculate_price_endpoint(data: PriceCalculation):
    """Calculate price for a reservation"""
    result = calculate_price(data.num_people, data.duration)
    return result

@api_router.get("/pricing")
async def get_pricing():
    """Get the full pricing grid"""
    return PRICING

# ========================
# ROUTES - RESERVATIONS
# ========================
@api_router.post("/reservations", response_model=Reservation)
async def create_reservation(reservation: ReservationCreate):
    """Create a new reservation"""
    price_info = calculate_price(reservation.num_people, reservation.duration)
    
    reservation_obj = Reservation(
        **reservation.model_dump(),
        price_per_person=price_info["price_per_person"],
        total_price=price_info["total_price"]
    )
    
    doc = reservation_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.reservations.insert_one(doc)
    return reservation_obj
    
@api_router.post("/reservations", response_model=List[Reservation])
async def get_reservations():
    """Get all reservations"""
    reservations = await db.reservations.find({}, {"_id": 0}).to_list(1000)
    
    for res in reservations:
        if isinstance(res.get('created_at'), str):
            res['created_at'] = datetime.fromisoformat(res['created_at'])
    
    return reservations

@api_router.get("/available-slots")
async def get_available_slots(date: str):
    """Get available time slots for a given date"""
    # Base time slots
    base_slots = ["09:00", "10:00", "11:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00"]
    
    # Find booked slots for this date
    booked = await db.reservations.find(
        {"date": date, "status": {"$ne": "cancelled"}},
        {"_id": 0, "time_slot": 1}
    ).to_list(100)
    booked_times = [b["time_slot"] for b in booked]
    
    slots = []
    for time in base_slots:
        slots.append({
            "time": time,
            "is_available": time not in booked_times
        })
    
    return {"date": date, "slots": slots}

# ========================
# ROUTES - CONTACT
# ========================
@api_router.post("/contact", response_model=ContactMessage)
async def create_contact_message(contact: ContactMessageCreate):
    """Submit a contact message"""
    message_obj = ContactMessage(**contact.model_dump())
    doc = message_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.contact_messages.insert_one(doc)
    return message_obj

# ========================
# SEED DATA
# ========================
@api_router.post("/seed")
async def seed_database():
    """Seed the database with sample escape games"""
    sample_escapes = [
        {
            "id": str(uuid.uuid4()),
            "title": "Le Manoir Hanté",
            "description": "Une nuit d'horreur vous attend dans ce manoir abandonné depuis des décennies. Des bruits étranges, des portes qui claquent... Saurez-vous découvrir les secrets qui hantent ces murs avant qu'il ne soit trop tard?",
            "theme": "Horreur",
            "difficulty": 4,
            "min_players": 4,
            "max_players": 12,
            "image_url": "https://images.unsplash.com/photo-1509248961895-a37c5bb79ad2?w=800",
            "is_active": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Le Casse du Siècle",
            "description": "Votre équipe de cambrioleurs d'élite a une mission: s'introduire dans le coffre-fort de la plus grande banque de Paris. Chaque seconde compte, les alarmes sont sophistiquées. Êtes-vous assez malins?",
            "theme": "Braquage",
            "difficulty": 5,
            "min_players": 4,
            "max_players": 15,
            "image_url": "https://images.unsplash.com/photo-1582139329536-e7284fece509?w=800",
            "is_active": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "title": "L'Affaire Sherlock",
            "description": "221B Baker Street. Le célèbre détective a disparu, laissant derrière lui une série d'indices cryptiques. En tant que ses apprentis, vous devez résoudre sa dernière enquête et retrouver sa trace.",
            "theme": "Enquête",
            "difficulty": 3,
            "min_players": 4,
            "max_players": 10,
            "image_url": "https://images.unsplash.com/photo-1582909146538-22dfdbc8d0d2?w=800",
            "is_active": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "title": "La Quête du Temple Perdu",
            "description": "Au cœur de la jungle amazonienne, un temple antique renferme un trésor légendaire. Mais attention aux pièges mortels laissés par ses anciens gardiens. L'aventure de votre vie commence maintenant!",
            "theme": "Aventure",
            "difficulty": 3,
            "min_players": 4,
            "max_players": 20,
            "image_url": "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800",
            "is_active": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "title": "L'Évasion de la Prison",
            "description": "Enfermés à tort dans la prison la plus sécurisée du pays, vous n'avez qu'une heure avant le changement de garde pour vous échapper. Creusez, fouinez, déjouez les gardes!",
            "theme": "Évasion",
            "difficulty": 4,
            "min_players": 4,
            "max_players": 12,
            "image_url": "https://images.unsplash.com/photo-1584267385494-9fdd9a71ad75?w=800",
            "is_active": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Le Laboratoire du Savant Fou",
            "description": "Un scientifique dément a créé un virus mortel. Infiltrez son laboratoire secret, trouvez l'antidote et neutralisez la menace avant que le compte à rebours n'atteigne zéro!",
            "theme": "Science-Fiction",
            "difficulty": 5,
            "min_players": 4,
            "max_players": 15,
            "image_url": "https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=800",
            "is_active": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    
    # Clear existing and insert new
    await db.escapes.delete_many({})
    await db.escapes.insert_many(sample_escapes)
    
    return {"message": "Database seeded successfully", "count": len(sample_escapes)}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()