""""from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app
app = FastAPI()

# Create a router with the /api prefix
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
    ""Calculate price based on number of people and duration""
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
    ""Get all escape games, optionally filtered by theme""
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
    ""Get a specific escape game by ID""
    escape = await db.escapes.find_one({"id": escape_id}, {"_id": 0})
    if not escape:
        raise HTTPException(status_code=404, detail="Escape game non trouvé")
    
    if isinstance(escape.get('created_at'), str):
        escape['created_at'] = datetime.fromisoformat(escape['created_at'])
    
    return escape

@api_router.post("/escapes", response_model=EscapeGame)
async def create_escape(escape: EscapeGameCreate):
    ""Create a new escape game""
    escape_obj = EscapeGame(**escape.model_dump())
    doc = escape_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.escapes.insert_one(doc)
    return escape_obj

@api_router.get("/themes")
async def get_themes():
    ""Get all unique themes""
    themes = await db.escapes.distinct("theme", {"is_active": True})
    return {"themes": themes}

# ========================
# ROUTES - PRICING
# ========================
@api_router.post("/calculate-price", response_model=PriceResponse)
async def calculate_price_endpoint(data: PriceCalculation):
    ""Calculate price for a reservation""
    result = calculate_price(data.num_people, data.duration)
    return result

@api_router.get("/pricing")
async def get_pricing():
    ""Get the full pricing grid""
    return PRICING

# ========================
# ROUTES - RESERVATIONS
# ========================
@api_router.post("/reservations", response_model=Reservation)
async def create_reservation(reservation: ReservationCreate):
    ""Create a new reservation""
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

@api_router.get("/reservations", response_model=List[Reservation])
async def get_reservations():
    ""Get all reservations""
    reservations = await db.reservations.find({}, {"_id": 0}).to_list(1000)
    
    for res in reservations:
        if isinstance(res.get('created_at'), str):
            res['created_at'] = datetime.fromisoformat(res['created_at'])
    
    return reservations

@api_router.get("/available-slots")
async def get_available_slots(date: str):
    ""Get available time slots for a given date""
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
    ""Submit a contact message""
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
    ""Seed the database with sample escape games""
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
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
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
    client.close()"""




"""
version 2

Je vais maintenant créer le système complet avec authentification, admin et envoi d'emails. Pour Gmail SMTP, tu devras créer un "mot de passe d'application" dans ton compte Google.
Action: file_editor create /app/backend/server.py --file-text "from fastapi import FastAPI, APIRouter, HTTPException, Depends, BackgroundTasks
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import jwt
import bcrypt
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
JWT_SECRET = os.environ.get('JWT_SECRET', 'ethanscape-secret-key-2024')
JWT_ALGORITHM = \"HS256\"
JWT_EXPIRATION_HOURS = 24

# Email Configuration
SMTP_EMAIL = os.environ.get('SMTP_EMAIL', 'ethanscape.servicesclients@gmail.com')
SMTP_PASSWORD = os.environ.get('SMTP_PASSWORD', '')  # App password from Google
ADMIN_EMAIL = \"ethanscape.servicesclients@gmail.com\"

# Admin credentials
ADMIN_CREDENTIALS = {
    \"email\": \"ethanscape.servicesclients@gmail.com\",
    \"password_hash\": bcrypt.hashpw(\"Eth@nSc@p01\".encode(), bcrypt.gensalt()).decode()
}

# Create the main app
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix=\"/api\")
security = HTTPBearer(auto_error=False)

# ========================
# PRICING CONFIGURATION
# ========================
PRICING = {
    \"4-9\": {\"30\": 22, \"60\": 25, \"90\": 28},
    \"10-19\": {\"30\": 19, \"60\": 22, \"90\": 25},
    \"20-29\": {\"30\": 16, \"60\": 19, \"90\": 22},
    \"30-39\": {\"30\": 13, \"60\": 16, \"90\": 19}
}

# ========================
# MODELS
# ========================
class User(BaseModel):
    model_config = ConfigDict(extra=\"ignore\")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: str
    password_hash: str
    name: str
    phone: Optional[str] = None
    is_admin: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    last_order_at: Optional[datetime] = None

class UserRegister(BaseModel):
    email: EmailStr
    password: str
    name: str
    phone: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    phone: Optional[str]
    is_admin: bool

class EscapeGame(BaseModel):
    model_config = ConfigDict(extra=\"ignore\")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: str
    theme: str
    difficulty: int
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

class EscapeGameUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    theme: Optional[str] = None
    difficulty: Optional[int] = None
    min_players: Optional[int] = None
    max_players: Optional[int] = None
    image_url: Optional[str] = None
    is_active: Optional[bool] = None

class Reservation(BaseModel):
    model_config = ConfigDict(extra=\"ignore\")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: Optional[str] = None
    escape_id: str
    escape_title: str
    client_name: str
    client_email: str
    client_phone: str
    client_address: str
    date: str
    time_slot: str
    duration: int
    num_people: int
    price_per_person: float
    total_price: float
    message: Optional[str] = None
    status: str = \"pending\"
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
    model_config = ConfigDict(extra=\"ignore\")
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
    duration: int

class PriceResponse(BaseModel):
    price_per_person: float
    total_price: float
    group_category: str

# ========================
# HELPER FUNCTIONS
# ========================
def calculate_price(num_people: int, duration: int) -> dict:
    if num_people < 4 or num_people > 39:
        raise HTTPException(status_code=400, detail=\"Nombre de personnes doit être entre 4 et 39\")
    if duration not in [30, 60, 90]:
        raise HTTPException(status_code=400, detail=\"Durée doit être 30, 60 ou 90 minutes\")
    
    if 4 <= num_people <= 9:
        category = \"4-9\"
        category_label = \"4-9 personnes\"
    elif 10 <= num_people <= 19:
        category = \"10-19\"
        category_label = \"10-19 personnes\"
    elif 20 <= num_people <= 29:
        category = \"20-29\"
        category_label = \"20-29 personnes\"
    else:
        category = \"30-39\"
        category_label = \"30-39 personnes\"
    
    price_per_person = PRICING[category][str(duration)]
    total_price = price_per_person * num_people
    
    return {
        \"price_per_person\": price_per_person,
        \"total_price\": total_price,
        \"group_category\": category_label
    }

def create_token(user_id: str, is_admin: bool = False) -> str:
    payload = {
        \"user_id\": user_id,
        \"is_admin\": is_admin,
        \"exp\": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def verify_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail=\"Token expiré\")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail=\"Token invalide\")

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    if not credentials:
        raise HTTPException(status_code=401, detail=\"Authentification requise\")
    
    payload = verify_token(credentials.credentials)

    Je vais corriger le problème de connexion admin et ajouter le RGPD dans le footer.

**Note importante** : Notre plateforme utilise **MongoDB** (pas MySQL). Pour utiliser MySQL sur ton ordinateur, je te fournirai un guide d'adaptation dans l'export final.
Action: file_editor str_replace /app/backend/server.py --old-str "async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    if not credentials:
        raise HTTPException(status_code=401, detail=\"Authentification requise\")
    
    payload = verify_token(credentials.credentials)
    user = await db.users.find_one({\"id\": payload[\"user_id\"]}, {\"_id\": 0})
    if not user:
        raise HTTPException(status_code=401, detail=\"Utilisateur non trouvé\")
    return user" --new-str "async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    if not credentials:
        raise HTTPException(status_code=401, detail=\"Authentification requise\")
    
    payload = verify_token(credentials.credentials)
    
   "" # Handle admin user
    if payload.get(\"is_admin\") and payload.get(\"user_id\") == \"admin\":
        return {
            \"id\": \"admin\",
            \"email\": ADMIN_CREDENTIALS[\"email\"],
            \"name\": \"Administrateur\",
            \"phone\": None,
            \"is_admin\": True
        }""
    
    user = await db.users.find_one({\"id\": payload[\"user_id\"]}, {\"_id\": 0})
    if not user:
        raise HTTPException(status_code=401, detail=\"Utilisateur non trouvé\")
    return user"
Observation: Edit was successful.

    user = await db.users.find_one({\"id\": payload[\"user_id\"]}, {\"_id\": 0})
    if not user:
        raise HTTPException(status_code=401, detail=\"Utilisateur non trouvé\")
    return user

async def get_current_user_optional(credentials: HTTPAuthorizationCredentials = Depends(security)):
    if not credentials:
        return None
    try:
        payload = verify_token(credentials.credentials)
        user = await db.users.find_one({\"id\": payload[\"user_id\"]}, {\"_id\": 0})
        return user
    except:
        return None

async def require_admin(credentials: HTTPAuthorizationCredentials = Depends(security)):
    if not credentials:
        raise HTTPException(status_code=401, detail=\"Authentification requise\")
    
    payload = verify_token(credentials.credentials)
    if not payload.get(\"is_admin\"):
        raise HTTPException(status_code=403, detail=\"Accès administrateur requis\")
    return payload

def send_email(to_email: str, subject: str, html_content: str):
    \"\"\"Send email via Gmail SMTP\"\"\"
    if not SMTP_PASSWORD:
        logging.warning(\"SMTP_PASSWORD not set, email not sent\")
        return False
    
    try:
        msg = MIMEMultipart('alternative')
        msg['Subject'] = subject
        msg['From'] = SMTP_EMAIL
        msg['To'] = to_email
        
        html_part = MIMEText(html_content, 'html')
        msg.attach(html_part)
        
        with smtplib.SMTP_SSL('smtp.gmail.com', 465) as server:
            server.login(SMTP_EMAIL, SMTP_PASSWORD)
            server.sendmail(SMTP_EMAIL, to_email, msg.as_string())
        
        logging.info(f\"Email sent to {to_email}\")
        return True
    except Exception as e:
        logging.error(f\"Failed to send email: {e}\")
        return False

def send_reservation_email(reservation: dict):
    \"\"\"Send reservation notification to admin\"\"\"
    duration_text = {30: \"30 minutes\", 60: \"1 heure\", 90: \"1h30\"}
    
    html = f\"\"\"
    <html>
    <body style=\"font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;\">
        <div style=\"max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px;\">
            <h1 style=\"color: #fbbf24; text-align: center;\">🎮 Nouvelle Réservation EthanScape</h1>
            
            <h2 style=\"color: #333;\">Détails de la réservation</h2>
            <table style=\"width: 100%; border-collapse: collapse;\">
                <tr><td style=\"padding: 10px; border-bottom: 1px solid #eee;\"><strong>Escape:</strong></td>
                    <td style=\"padding: 10px; border-bottom: 1px solid #eee;\">{reservation['escape_title']}</td></tr>
                <tr><td style=\"padding: 10px; border-bottom: 1px solid #eee;\"><strong>Date:</strong></td>
                    <td style=\"padding: 10px; border-bottom: 1px solid #eee;\">{reservation['date']}</td></tr>
                <tr><td style=\"padding: 10px; border-bottom: 1px solid #eee;\"><strong>Heure:</strong></td>
                    <td style=\"padding: 10px; border-bottom: 1px solid #eee;\">{reservation['time_slot']}</td></tr>
                <tr><td style=\"padding: 10px; border-bottom: 1px solid #eee;\"><strong>Durée:</strong></td>
                    <td style=\"padding: 10px; border-bottom: 1px solid #eee;\">{duration_text.get(reservation['duration'], str(reservation['duration']))}</td></tr>
                <tr><td style=\"padding: 10px; border-bottom: 1px solid #eee;\"><strong>Participants:</strong></td>
                    <td style=\"padding: 10px; border-bottom: 1px solid #eee;\">{reservation['num_people']} personnes</td></tr>
                <tr><td style=\"padding: 10px; border-bottom: 1px solid #eee;\"><strong>Prix total:</strong></td>
                    <td style=\"padding: 10px; border-bottom: 1px solid #eee; color: #fbbf24; font-weight: bold;\">{reservation['total_price']}€</td></tr>
            </table>
            
            <h2 style=\"color: #333; margin-top: 20px;\">Informations client</h2>
            <table style=\"width: 100%; border-collapse: collapse;\">
                <tr><td style=\"padding: 10px; border-bottom: 1px solid #eee;\"><strong>Nom:</strong></td>
                    <td style=\"padding: 10px; border-bottom: 1px solid #eee;\">{reservation['client_name']}</td></tr>
                <tr><td style=\"padding: 10px; border-bottom: 1px solid #eee;\"><strong>Email:</strong></td>
                    <td style=\"padding: 10px; border-bottom: 1px solid #eee;\">{reservation['client_email']}</td></tr>
                <tr><td style=\"padding: 10px; border-bottom: 1px solid #eee;\"><strong>Téléphone:</strong></td>
                    <td style=\"padding: 10px; border-bottom: 1px solid #eee;\">{reservation['client_phone']}</td></tr>
                <tr><td style=\"padding: 10px; border-bottom: 1px solid #eee;\"><strong>Adresse:</strong></td>
                    <td style=\"padding: 10px; border-bottom: 1px solid #eee;\">{reservation['client_address']}</td></tr>
            </table>
            
            {f\"<p style='margin-top: 20px; padding: 15px; background: #f9f9f9; border-radius: 5px;'><strong>Message:</strong><br>{reservation.get('message', '')}</p>\" if reservation.get('message') else \"\"}
            
            <p style=\"text-align: center; color: #666; margin-top: 30px; font-size: 12px;\">
                Cette réservation a été effectuée via le site EthanScape
            </p>
        </div>
    </body>
    </html>
    \"\"\"
    
    send_email(ADMIN_EMAIL, f\"🎮 Nouvelle réservation - {reservation['client_name']}\", html)

def send_client_confirmation(reservation: dict):
    \"\"\"Send confirmation email to client\"\"\"
    duration_text = {30: \"30 minutes\", 60: \"1 heure\", 90: \"1h30\"}
    
    html = f\"\"\"
    <html>
    <body style=\"font-family: Arial, sans-serif; background-color: #020617; padding: 20px;\">
        <div style=\"max-width: 600px; margin: 0 auto; background: #0f172a; padding: 30px; border-radius: 10px; color: white;\">
            <h1 style=\"color: #fbbf24; text-align: center;\">🎮 EthanScape</h1>
            <h2 style=\"text-align: center;\">Votre réservation est confirmée !</h2>
            
            <p>Bonjour {reservation['client_name']},</p>
            <p>Merci pour votre réservation ! Nous avons bien reçu votre demande et nous vous contacterons prochainement pour confirmer les détails.</p>
            
            <div style=\"background: #1e293b; padding: 20px; border-radius: 8px; margin: 20px 0;\">
                <h3 style=\"color: #fbbf24; margin-top: 0;\">Récapitulatif</h3>
                <p><strong>Escape:</strong> {reservation['escape_title']}</p>
                <p><strong>Date:</strong> {reservation['date']}</p>
                <p><strong>Heure:</strong> {reservation['time_slot']}</p>
                <p><strong>Durée:</strong> {duration_text.get(reservation['duration'], str(reservation['duration']))}</p>
                <p><strong>Participants:</strong> {reservation['num_people']} personnes</p>
                <p><strong>Adresse:</strong> {reservation['client_address']}</p>
                <p style=\"font-size: 24px; color: #fbbf24;\"><strong>Total: {reservation['total_price']}€</strong></p>
            </div>
            
            <p>Des questions ? Contactez-nous:</p>
            <p>📞 06 59 55 88 85</p>
            <p>📧 ethanscape.servicesclients@gmail.com</p>
            
            <p style=\"text-align: center; color: #94a3b8; margin-top: 30px; font-size: 12px;\">
                © EthanScape - L'escape game qui vient à vous
            </p>
        </div>
    </body>
    </html>
    \"\"\"
    
    send_email(reservation['client_email'], \"🎮 Confirmation de votre réservation EthanScape\", html)

# ========================
# ROUTES - AUTH
# ========================
@api_router.post(\"/auth/register\")
async def register(data: UserRegister):
    \"\"\"Register a new client\"\"\"
    existing = await db.users.find_one({\"email\": data.email})
    if existing:
        raise HTTPException(status_code=400, detail=\"Cet email est déjà utilisé\")
    
    password_hash = bcrypt.hashpw(data.password.encode(), bcrypt.gensalt()).decode()
    
    user = User(
        email=data.email,
        password_hash=password_hash,
        name=data.name,
        phone=data.phone
    )
    
    doc = user.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    if doc.get('last_order_at'):
        doc['last_order_at'] = doc['last_order_at'].isoformat()
    
    await db.users.insert_one(doc)
    
    token = create_token(user.id, is_admin=False)
    return {
        \"token\": token,
        \"user\": {
            \"id\": user.id,
            \"email\": user.email,
            \"name\": user.name,
            \"phone\": user.phone,
            \"is_admin\": False
        }
    }

@api_router.post(\"/auth/login\")
async def login(data: UserLogin):
    \"\"\"Login for clients and admin\"\"\"
    # Check if admin
    if data.email == ADMIN_CREDENTIALS[\"email\"]:
        if bcrypt.checkpw(data.password.encode(), ADMIN_CREDENTIALS[\"password_hash\"].encode()):
            token = create_token(\"admin\", is_admin=True)
            return {
                \"token\": token,
                \"user\": {
                    \"id\": \"admin\",
                    \"email\": ADMIN_CREDENTIALS[\"email\"],
                    \"name\": \"Administrateur\",
                    \"phone\": None,
                    \"is_admin\": True
                }
            }
        raise HTTPException(status_code=401, detail=\"Mot de passe incorrect\")
    
    # Check regular user
    user = await db.users.find_one({\"email\": data.email}, {\"_id\": 0})
    if not user:
        raise HTTPException(status_code=401, detail=\"Email ou mot de passe incorrect\")
    
    if not bcrypt.checkpw(data.password.encode(), user[\"password_hash\"].encode()):
        raise HTTPException(status_code=401, detail=\"Email ou mot de passe incorrect\")
    
    token = create_token(user[\"id\"], is_admin=False)
    return {
        \"token\": token,
        \"user\": {
            \"id\": user[\"id\"],
            \"email\": user[\"email\"],
            \"name\": user[\"name\"],
            \"phone\": user.get(\"phone\"),
            \"is_admin\": False
        }
    }

@api_router.get(\"/auth/me\")
async def get_me(user = Depends(get_current_user)):
    \"\"\"Get current user info\"\"\"
    return {
        \"id\": user[\"id\"] if isinstance(user, dict) else user.id,
        \"email\": user.get(\"email\", \"\"),
        \"name\": user.get(\"name\", \"\"),
        \"phone\": user.get(\"phone\"),
        \"is_admin\": user.get(\"is_admin\", False)
    }

# ========================
# ROUTES - CLIENT DASHBOARD
# ========================
@api_router.get(\"/client/reservations\")
async def get_client_reservations(user = Depends(get_current_user)):
    \"\"\"Get client's reservation history\"\"\"
    if user.get(\"is_admin\"):
        raise HTTPException(status_code=403, detail=\"Route réservée aux clients\")
    
    reservations = await db.reservations.find(
        {\"$or\": [{\"user_id\": user[\"id\"]}, {\"client_email\": user[\"email\"]}]},
        {\"_id\": 0}
    ).sort(\"created_at\", -1).to_list(100)
    
    for res in reservations:
        if isinstance(res.get('created_at'), str):
            res['created_at'] = datetime.fromisoformat(res['created_at'])
    
    return reservations

# ========================
# ROUTES - ADMIN
# ========================
@api_router.get(\"/admin/escapes\")
async def admin_get_escapes(admin = Depends(require_admin)):
    \"\"\"Get all escapes including inactive\"\"\"
    escapes = await db.escapes.find({}, {\"_id\": 0}).to_list(100)
    for escape in escapes:
        if isinstance(escape.get('created_at'), str):
            escape['created_at'] = datetime.fromisoformat(escape['created_at'])
    return escapes

@api_router.post(\"/admin/escapes\")
async def admin_create_escape(escape: EscapeGameCreate, admin = Depends(require_admin)):
    \"\"\"Create a new escape game\"\"\"
    escape_obj = EscapeGame(**escape.model_dump())
    doc = escape_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.escapes.insert_one(doc)
    return escape_obj

@api_router.put(\"/admin/escapes/{escape_id}\")
async def admin_update_escape(escape_id: str, update: EscapeGameUpdate, admin = Depends(require_admin)):
    \"\"\"Update an escape game\"\"\"
    update_data = {k: v for k, v in update.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail=\"Aucune donnée à mettre à jour\")
    
    result = await db.escapes.update_one({\"id\": escape_id}, {\"$set\": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail=\"Escape non trouvé\")
    
    updated = await db.escapes.find_one({\"id\": escape_id}, {\"_id\": 0})
    return updated

@api_router.delete(\"/admin/escapes/{escape_id}\")
async def admin_delete_escape(escape_id: str, admin = Depends(require_admin)):
    \"\"\"Delete an escape game\"\"\"
    result = await db.escapes.delete_one({\"id\": escape_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail=\"Escape non trouvé\")
    return {\"message\": \"Escape supprimé avec succès\"}

@api_router.get(\"/admin/reservations\")
async def admin_get_reservations(admin = Depends(require_admin)):
    \"\"\"Get all reservations\"\"\"
    reservations = await db.reservations.find({}, {\"_id\": 0}).sort(\"created_at\", -1).to_list(1000)
    for res in reservations:
        if isinstance(res.get('created_at'), str):
            res['created_at'] = datetime.fromisoformat(res['created_at'])
    return reservations

@api_router.put(\"/admin/reservations/{reservation_id}/status\")
async def admin_update_reservation_status(reservation_id: str, status: str, admin = Depends(require_admin)):
    \"\"\"Update reservation status\"\"\"
    if status not in [\"pending\", \"confirmed\", \"cancelled\"]:
        raise HTTPException(status_code=400, detail=\"Statut invalide\")
    
    result = await db.reservations.update_one(
        {\"id\": reservation_id},
        {\"$set\": {\"status\": status}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail=\"Réservation non trouvée\")
    
    return {\"message\": \"Statut mis à jour\"}

@api_router.get(\"/admin/clients\")
async def admin_get_clients(admin = Depends(require_admin)):
    \"\"\"Get all clients\"\"\"
    clients = await db.users.find({\"is_admin\": {\"$ne\": True}}, {\"_id\": 0, \"password_hash\": 0}).to_list(1000)
    for client in clients:
        if isinstance(client.get('created_at'), str):
            client['created_at'] = datetime.fromisoformat(client['created_at'])
        if isinstance(client.get('last_order_at'), str):
            client['last_order_at'] = datetime.fromisoformat(client['last_order_at'])
    return clients

@api_router.delete(\"/admin/clients/{client_id}\")
async def admin_delete_client(client_id: str, admin = Depends(require_admin)):
    \"\"\"Delete a client\"\"\"
    result = await db.users.delete_one({\"id\": client_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail=\"Client non trouvé\")
    return {\"message\": \"Client supprimé\"}

@api_router.get(\"/admin/contacts\")
async def admin_get_contacts(admin = Depends(require_admin)):
    \"\"\"Get all contact messages\"\"\"
    contacts = await db.contact_messages.find({}, {\"_id\": 0}).sort(\"created_at\", -1).to_list(1000)
    for contact in contacts:
        if isinstance(contact.get('created_at'), str):
            contact['created_at'] = datetime.fromisoformat(contact['created_at'])
    return contacts

@api_router.get(\"/admin/stats\")
async def admin_get_stats(admin = Depends(require_admin)):
    \"\"\"Get dashboard statistics\"\"\"
    total_escapes = await db.escapes.count_documents({})
    active_escapes = await db.escapes.count_documents({\"is_active\": True})
    total_reservations = await db.reservations.count_documents({})
    pending_reservations = await db.reservations.count_documents({\"status\": \"pending\"})
    total_clients = await db.users.count_documents({\"is_admin\": {\"$ne\": True}})
    total_contacts = await db.contact_messages.count_documents({})
    
    return {
        \"escapes\": {\"total\": total_escapes, \"active\": active_escapes},
        \"reservations\": {\"total\": total_reservations, \"pending\": pending_reservations},
        \"clients\": total_clients,
        \"contacts\": total_contacts
    }

# ========================
# RGPD - Auto cleanup after 2 years
# ========================
@api_router.post(\"/admin/cleanup-old-clients\")
async def cleanup_old_clients(admin = Depends(require_admin)):
    \"\"\"Delete clients with no orders in the last 2 years (RGPD compliance)\"\"\"
    two_years_ago = datetime.now(timezone.utc) - timedelta(days=730)
    
    # Find clients to delete
    clients_to_delete = await db.users.find({
        \"is_admin\": {\"$ne\": True},
        \"$or\": [
            {\"last_order_at\": {\"$lt\": two_years_ago.isoformat()}},
            {\"last_order_at\": None, \"created_at\": {\"$lt\": two_years_ago.isoformat()}}
        ]
    }, {\"_id\": 0, \"id\": 1, \"email\": 1}).to_list(1000)
    
    deleted_count = 0
    for client in clients_to_delete:
        await db.users.delete_one({\"id\": client[\"id\"]})
        deleted_count += 1
    
    return {
        \"message\": f\"{deleted_count} clients supprimés (RGPD - 2 ans sans commande)\",
        \"deleted_count\": deleted_count
    }

# ========================
# ROUTES - ESCAPES (Public)
# ========================
@api_router.get(\"/\")
async def root():
    return {\"message\": \"EthanScape API\"}

@api_router.get(\"/escapes\", response_model=List[EscapeGame])
async def get_escapes(theme: Optional[str] = None):
    query = {\"is_active\": True}
    if theme and theme != \"all\":
        query[\"theme\"] = theme
    
    escapes = await db.escapes.find(query, {\"_id\": 0}).to_list(100)
    for escape in escapes:
        if isinstance(escape.get('created_at'), str):
            escape['created_at'] = datetime.fromisoformat(escape['created_at'])
    return escapes

@api_router.get(\"/escapes/{escape_id}\", response_model=EscapeGame)
async def get_escape(escape_id: str):
    escape = await db.escapes.find_one({\"id\": escape_id}, {\"_id\": 0})
    if not escape:
        raise HTTPException(status_code=404, detail=\"Escape game non trouvé\")
    if isinstance(escape.get('created_at'), str):
        escape['created_at'] = datetime.fromisoformat(escape['created_at'])
    return escape

@api_router.get(\"/themes\")
async def get_themes():
    themes = await db.escapes.distinct(\"theme\", {\"is_active\": True})
    return {\"themes\": themes}

# ========================
# ROUTES - PRICING
# ========================
@api_router.post(\"/calculate-price\", response_model=PriceResponse)
async def calculate_price_endpoint(data: PriceCalculation):
    result = calculate_price(data.num_people, data.duration)
    return result

@api_router.get(\"/pricing\")
async def get_pricing():
    return PRICING

# ========================
# ROUTES - RESERVATIONS
# ========================
@api_router.post(\"/reservations\", response_model=Reservation)
async def create_reservation(
    reservation: ReservationCreate,
    background_tasks: BackgroundTasks,
    user = Depends(get_current_user_optional)
):
    price_info = calculate_price(reservation.num_people, reservation.duration)
    
    reservation_obj = Reservation(
        **reservation.model_dump(),
        user_id=user[\"id\"] if user else None,
        price_per_person=price_info[\"price_per_person\"],
        total_price=price_info[\"total_price\"]
    )
    
    doc = reservation_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.reservations.insert_one(doc)
    
    # Update user's last_order_at
    if user:
        await db.users.update_one(
            {\"id\": user[\"id\"]},
            {\"$set\": {\"last_order_at\": datetime.now(timezone.utc).isoformat()}}
        )
    
    # Send emails in background
    background_tasks.add_task(send_reservation_email, doc)
    background_tasks.add_task(send_client_confirmation, doc)
    
    return reservation_obj

@api_router.get(\"/available-slots\")
async def get_available_slots(date: str):
    base_slots = [\"09:00\", \"10:00\", \"11:00\", \"14:00\", \"15:00\", \"16:00\", \"17:00\", \"18:00\", \"19:00\", \"20:00\"]
    
    booked = await db.reservations.find(
        {\"date\": date, \"status\": {\"$ne\": \"cancelled\"}},
        {\"_id\": 0, \"time_slot\": 1}
    ).to_list(100)
    booked_times = [b[\"time_slot\"] for b in booked]
    
    slots = []
    for time in base_slots:
        slots.append({
            \"time\": time,
            \"is_available\": time not in booked_times
        })
    
    return {\"date\": date, \"slots\": slots}

# ========================
# ROUTES - CONTACT
# ========================
@api_router.post(\"/contact\", response_model=ContactMessage)
async def create_contact_message(contact: ContactMessageCreate, background_tasks: BackgroundTasks):
    message_obj = ContactMessage(**contact.model_dump())
    doc = message_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.contact_messages.insert_one(doc)
    
    # Send email notification
    html = f\"\"\"
    <html>
    <body style=\"font-family: Arial, sans-serif; padding: 20px;\">
        <h1 style=\"color: #fbbf24;\">📩 Nouveau message de contact</h1>
        <p><strong>De:</strong> {contact.name} ({contact.email})</p>
        <p><strong>Téléphone:</strong> {contact.phone or 'Non renseigné'}</p>
        <p><strong>Sujet:</strong> {contact.subject}</p>
        <div style=\"background: #f4f4f4; padding: 15px; border-radius: 5px; margin-top: 15px;\">
            <p>{contact.message}</p>
        </div>
    </body>
    </html>
    \"\"\"
    background_tasks.add_task(send_email, ADMIN_EMAIL, f\"📩 Contact: {contact.subject}\", html)
    
    return message_obj

# ========================
# SEED DATA
# ========================
@api_router.post(\"/seed\")
async def seed_database():
    sample_escapes = [
        {
            \"id\": str(uuid.uuid4()),
            \"title\": \"Le Manoir Hanté\",
            \"description\": \"Une nuit d'horreur vous attend dans ce manoir abandonné depuis des décennies. Des bruits étranges, des portes qui claquent... Saurez-vous découvrir les secrets qui hantent ces murs avant qu'il ne soit trop tard?\",
            \"theme\": \"Horreur\",
            \"difficulty\": 4,
            \"min_players\": 4,
            \"max_players\": 12,
            \"image_url\": \"https://images.unsplash.com/photo-1519074069444-1ba4fff66d16?w=800\",
            \"is_active\": True,
            \"created_at\": datetime.now(timezone.utc).isoformat()
        },
        {
            \"id\": str(uuid.uuid4()),
            \"title\": \"Le Casse du Siècle\",
            \"description\": \"Votre équipe de cambrioleurs d'élite a une mission: s'introduire dans le coffre-fort de la plus grande banque de Paris. Chaque seconde compte, les alarmes sont sophistiquées. Êtes-vous assez malins?\",
            \"theme\": \"Braquage\",
            \"difficulty\": 5,
            \"min_players\": 4,
            \"max_players\": 15,
            \"image_url\": \"https://images.unsplash.com/photo-1582139329536-e7284fece509?w=800\",
            \"is_active\": True,
            \"created_at\": datetime.now(timezone.utc).isoformat()
        },
        {
            \"id\": str(uuid.uuid4()),
            \"title\": \"L'Affaire Sherlock\",
            \"description\": \"221B Baker Street. Le célèbre détective a disparu, laissant derrière lui une série d'indices cryptiques. En tant que ses apprentis, vous devez résoudre sa dernière enquête et retrouver sa trace.\",
            \"theme\": \"Enquête\",
            \"difficulty\": 3,
            \"min_players\": 4,
            \"max_players\": 10,
            \"image_url\": \"https://images.unsplash.com/photo-1582909146538-22dfdbc8d0d2?w=800\",
            \"is_active\": True,
            \"created_at\": datetime.now(timezone.utc).isoformat()
        },
        {
            \"id\": str(uuid.uuid4()),
            \"title\": \"La Quête du Temple Perdu\",
            \"description\": \"Au cœur de la jungle amazonienne, un temple antique renferme un trésor légendaire. Mais attention aux pièges mortels laissés par ses anciens gardiens. L'aventure de votre vie commence maintenant!\",
            \"theme\": \"Aventure\",
            \"difficulty\": 3,
            \"min_players\": 4,
            \"max_players\": 20,
            \"image_url\": \"https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800\",
            \"is_active\": True,
            \"created_at\": datetime.now(timezone.utc).isoformat()
        },
        {
            \"id\": str(uuid.uuid4()),
            \"title\": \"L'Évasion de la Prison\",
            \"description\": \"Enfermés à tort dans la prison la plus sécurisée du pays, vous n'avez qu'une heure avant le changement de garde pour vous échapper. Creusez, fouinez, déjouez les gardes!\",
            \"theme\": \"Évasion\",
            \"difficulty\": 4,
            \"min_players\": 4,
            \"max_players\": 12,
            \"image_url\": \"https://images.unsplash.com/photo-1584267385494-9fdd9a71ad75?w=800\",
            \"is_active\": True,
            \"created_at\": datetime.now(timezone.utc).isoformat()
        },
        {
            \"id\": str(uuid.uuid4()),
            \"title\": \"Le Laboratoire du Savant Fou\",
            \"description\": \"Un scientifique dément a créé un virus mortel. Infiltrez son laboratoire secret, trouvez l'antidote et neutralisez la menace avant que le compte à rebours n'atteigne zéro!\",
            \"theme\": \"Science-Fiction\",
            \"difficulty\": 5,
            \"min_players\": 4,
            \"max_players\": 15,
            \"image_url\": \"https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=800\",
            \"is_active\": True,
            \"created_at\": datetime.now(timezone.utc).isoformat()
        }
    ]
    
    await db.escapes.delete_many({})
    await db.escapes.insert_many(sample_escapes)
    
    return {\"message\": \"Database seeded successfully\", \"count\": len(sample_escapes)}

# Include the router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=[\"*\"],
    allow_headers=[\"*\"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event(\"shutdown\")
async def shutdown_db_client():
    client.close()
"
Observation: Overwrite successful: /app/backend/server.py"""


""" verssion 3

Je dois corriger le problème de redirection après login admin et l'endpoint `/auth/me` pour les admins :
Action: file_editor view /app/backend/server.py
Observation: [Showing lines 225-260 of 855 total] /app/backend/server.py:
225|    except jwt.ExpiredSignatureError:
226|        raise HTTPException(status_code=401, detail="Token expiré")
227|    except jwt.InvalidTokenError:
228|        raise HTTPException(status_code=401, detail="Token invalide")
229|
230|async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
231|    if not credentials:
232|        raise HTTPException(status_code=401, detail="Authentification requise")
233|    
234|    payload = verify_token(credentials.credentials)
235|    user = await db.users.find_one({"id": payload["user_id"]}, {"_id": 0})
236|    if not user:
237|        raise HTTPException(status_code=401, detail="Utilisateur non trouvé")
238|    return user
239|
240|async def get_current_user_optional(credentials: HTTPAuthorizationCredentials = Depends(security)):
241|    if not credentials:
242|        return None
243|    try:
244|        payload = verify_token(credentials.credentials)
245|        user = await db.users.find_one({"id": payload["user_id"]}, {"_id": 0})
246|        return user
247|    except:
248|        return None
249|
250|async def require_admin(credentials: HTTPAuthorizationCredentials = Depends(security)):
251|    if not credentials:
252|        raise HTTPException(status_code=401, detail="Authentification requise")
253|    
254|    payload = verify_token(credentials.credentials)
255|    if not payload.get("is_admin"):
256|        raise HTTPException(status_code=403, detail="Accès administrateur requis")
257|    return payload
258|
259|def send_email(to_email: str, subject: str, html_content: str):
260|    ""Send email via Gmail SMTP""
 [36 lines shown. Remaining: lines 261-855 (595 lines). Use view_range parameter to continue.] """