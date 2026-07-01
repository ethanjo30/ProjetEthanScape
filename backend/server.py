from fastapi import FastAPI, APIRouter, HTTPException
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import urllib.parse
from pathlib import Path
from datetime import datetime, timezone, timedelta
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone
from dotenv import load_dotenv
from fastapi_mail import ConnectionConfig, FastMail, MessageSchema, MessageType
from passlib.context import CryptContext
from jose import jwt, JWTError
from fastapi.security import OAuth2PasswordBearer
from fastapi import Depends
from fastapi import FastAPI, APIRouter, HTTPException, Depends
from typing import List, Optional, Any

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
db = client["EthanScape"]

app = FastAPI()
api_router = APIRouter(prefix="/api")

@api_router.get("/admin/stats")
async def get_admin_stats():
    res_count = await db.reservations.count_documents({})
    return {"reservations": {"total": res_count}}

@api_router.get("/admin/reservations")
async def get_all_reservations():
    cursor = db.reservations.find({}, {"_id": 0})
    return await cursor.to_list(length=1000)

# Déclarez la route SANS /api au début du chemin
@api_router.get("/client/reservations") 
async def get_client_reservations():
    cursor = db.reservations.find({}, {"_id": 0})
    return await cursor.to_list(length=1000)

# Modèle pour la mise à jour
class UpdateReservation(BaseModel):
    status: Optional[str] = None
    # Ajoutez d'autres champs si nécessaire

@api_router.get("/admin/escapes")
async def get_admin_escapes():
    cursor = db.escapes.find({}, {"_id": 0})
    return await cursor.to_list(length=1000)

@api_router.get("/admin/clients")
async def get_admin_clients():
    cursor = db.contacts.find({}, {"_id": 0}) # Assurez-vous que c'est la bonne collection
    return await cursor.to_list(length=1000)

@api_router.put("/admin/reservations/{res_id}")
async def update_reservation(res_id: str, data: UpdateReservation):
    # On utilise l'ID pour mettre à jour
    result = await db.reservations.update_one(
        {"id": res_id}, 
        {"$set": data.model_dump(exclude_unset=True)}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Réservation introuvable")
    return {"message": "Mise à jour réussie"}

@api_router.get("/admin/contacts")
async def get_all_contacts():
    cursor = db.contacts.find({}, {"_id": 0})
    return await cursor.to_list(length=1000)

# Configuration Email
conf = ConnectionConfig(
    MAIL_USERNAME=os.getenv('MAIL_USERNAME'),
    MAIL_PASSWORD=os.getenv('MAIL_PASSWORD'), 
    MAIL_FROM="contact@ethanscape.com",
    MAIL_PORT=2525,
    MAIL_SERVER="smtp-relay.brevo.com",
    MAIL_STARTTLS=True,
    MAIL_SSL_TLS=False,
    USE_CREDENTIALS=True,
    VALIDATE_CERTS=True
)



fastmail = FastMail(conf)
# ========================
# CONFIGURATION SÉCURITÉ (PLACE-LE ICI)
# ========================
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "cree_une_phrase_tres_longue_ici")
ALGORITHM = "HS256"
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/login")

class LoginRequest(BaseModel):
    username: str
    password: str
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
    difficulty: int
    min_players: int
    max_players: int
    image_url: str
    is_active: bool = True
    # Change datetime par Any ici pour accepter le format texte de MongoDB
    created_at: Any = Field(default_factory=lambda: datetime.now(timezone.utc))

class EscapeGameCreate(BaseModel):
    title: str
    description: str
    theme: str
    difficulty: int
    min_players: int
    max_players: int
    image_url: str

class ReservationCreate(BaseModel):
    escape_id: str
    escape_title: str
    client_name: str
    client_email: EmailStr
    client_phone: str
    street_address: str  
    zip_code: str       
    city: str          
    date: str
    time_slot: str
    duration: int
    num_people: int
    message: Optional[str] = None

class Reservation(ReservationCreate):
    id: Optional[str] = None
    price_per_person: float
    total_price: float
    status: str = "confirmed"
    created_at: datetime = Field(default_factory=datetime.utcnow)

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
@api_router.get("/escapes", response_model=List[EscapeGame])
async def get_escapes(theme: Optional[str] = None):
    # On retire le filtre pour voir si vos données s'affichent
    query = {} 
    
    if theme and theme != "all":
        query["theme"] = theme
    
    escapes_cursor = db.escapes.find(query, {"_id": 0})
    escapes = await escapes_cursor.to_list(length=100)
    
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

# --- C'EST CETTE FONCTION QUI CHANGE ---
@api_router.post("/escapes", response_model=EscapeGame) 
async def create_escape(escape: EscapeGameCreate, token: str = Depends(oauth2_scheme)):
    """Seul un admin connecté peut créer un escape game"""
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
    """Créer une nouvelle réservation et envoyer une notification par e-mail"""
    # Calcul automatique des prix via la fonction helper
    price_info = calculate_price(reservation.num_people, reservation.duration)
    
    # Création de l'objet de réservation complet
    reservation_obj = Reservation(
        **reservation.model_dump(),
        price_per_person=price_info["price_per_person"],
        total_price=price_info["total_price"]
    )
    
    # Préparation du document pour MongoDB
    doc = reservation_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    
    # Enregistrement dans MongoDB
    await db.reservations.insert_one(doc)

    # 🚨 BLOC D'ENVOI DE L'E-MAIL DE NOTIFICATION 🚨
    try:
        html_content = f"""
        <html>
            <body style="font-family: Arial, sans-serif; background-color: #0f172a; color: #ffffff; padding: 20px;">
                <div style="max-width: 600px; margin: 0 auto; background-color: #1e293b; padding: 30px; border: 1px solid #334155; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                    <h1 style="color: #fbbf24; margin-bottom: 10px; font-size: 24px;">🚨 Nouvelle réservation reçue !</h1>
                    <p style="color: #94a3b8; font-size: 16px;">Une nouvelle session vient d'être validée sur l'application EthanScape.</p>
                    <hr style="border: 0; border-top: 1px solid #334155; margin: 20px 0;" />
                    
                    <h3 style="color: #fbbf24; font-size: 18px; margin-bottom: 15px;">Détails de la session :</h3>
                    <table style="width: 100%; color: #e2e8f0; font-size: 15px; border-collapse: collapse; margin-bottom: 25px;">
                        <tr>
                            <td style="padding: 8px 0; font-weight: bold; color: #94a3b8; width: 40%;">Escape Game :</td>
                            <td style="padding: 8px 0; font-weight: bold; color: #ffffff;">{reservation_obj.escape_title}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; font-weight: bold; color: #94a3b8;">Date :</td>
                            <td style="padding: 8px 0; color: #ffffff;">{reservation_obj.date}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; font-weight: bold; color: #94a3b8;">Créneau Horaire :</td>
                            <td style="padding: 8px 0; color: #ffffff;">{reservation_obj.time_slot}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; font-weight: bold; color: #94a3b8;">Durée :</td>
                            <td style="padding: 8px 0; color: #ffffff;">{reservation_obj.duration} minutes</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; font-weight: bold; color: #94a3b8;">Participants :</td>
                            <td style="padding: 8px 0; color: #ffffff;">{reservation_obj.num_people} personnes</td>
                        </tr>
                        <tr style="border-top: 1px solid #334155;">
                            <td style="padding: 15px 0 0 0; font-weight: bold; color: #fbbf24; font-size: 18px;">Montant Total :</td>
                            <td style="padding: 15px 0 0 0; font-weight: bold; color: #fbbf24; font-size: 22px;">{reservation_obj.total_price}€</td>
                        </tr>
                    </table>

                    <h3 style="color: #fbbf24; font-size: 18px; margin-bottom: 15px;">Coordonnées du client :</h3>
                    <table style="width: 100%; color: #e2e8f0; font-size: 15px; border-collapse: collapse;">
                        <tr>
                            <td style="padding: 8px 0; font-weight: bold; color: #94a3b8; width: 40%;">Nom complet :</td>
                            <td style="padding: 8px 0; color: #ffffff;">{reservation_obj.client_name}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; font-weight: bold; color: #94a3b8;">E-mail :</td>
                            <td style="padding: 8px 0; color: #ffffff;">{reservation_obj.client_email}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; font-weight: bold; color: #94a3b8;">Téléphone :</td>
                            <td style="padding: 8px 0; color: #ffffff;">{reservation_obj.client_phone}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; font-weight: bold; color: #94a3b8;">Adresse :</td>
                            <td style="padding: 8px 0; color: #ffffff;">{reservation_obj.street_address}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; font-weight: bold; color: #94a3b8;">Code Postal / Ville :</td>
                            <td style="padding: 8px 0; color: #ffffff;">{reservation_obj.zip_code} {reservation_obj.city.upper()}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; font-weight: bold; color: #94a3b8;">Message client :</td>
                            <td style="padding: 8px 0; color: #94a3b8; font-style: italic;">{reservation_obj.message or 'Aucun message'}</td>
                        </tr>
                    </table>
                </div>
            </body>
        </html>
        """

        message = MessageSchema(
            subject=f"🚨 Nouvelle réservation : {reservation_obj.escape_title}",
            recipients=["ethanscape.servicesclients@gmail.com"],
            body=html_content,
            subtype=MessageType.html
        )

        await fastmail.send_message(message)
        logging.info("✉️ E-mail d'alerte admin envoyé avec l'adresse hiérarchisée !")

    except Exception as e:
        logging.error(f"❌ Échec de l'envoi de l'e-mail de notification : {e}")
        pass

    return reservation_obj


@api_router.get("/reservations", response_model=List[Reservation])
async def get_reservations():
    """Récupérer toutes les réservations pour l'admin"""
    reservations = await db.reservations.find({}, {"_id": 0}).to_list(1000)
    return reservations


@api_router.get("/available-slots")
async def get_available_slots(date: str, escape_id: Optional[str] = None):
    """Récupérer les créneaux avec filtrage par escape_id pour éviter le blocage global"""
    base_slots = ["09:00", "10:00", "11:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00"]
    query = {"date": date, "status": {"$ne": "cancelled"}}
    
    if escape_id:
        query["escape_id"] = escape_id
        
    booked = await db.reservations.find(
        query,
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
# ROUTES - AUTHENTICATION
# ========================
@api_router.post("/login")
async def login(data: LoginRequest):
    """Route pour connecter l'admin"""
    # Identifiants de test (tu pourras les mettre en BDD plus tard)
    ADMIN_EMAIL = "admin@ethanscape.com"
    ADMIN_PASS = "EthanScape2026!" # C'est le mot de passe que tu taperas sur le site

    if data.username == ADMIN_EMAIL and data.password == ADMIN_PASS:
        # Création du Token JWT
        access_token_expires = datetime.now(timezone.utc)+ timedelta(hours=24)
        token_data = {
            "sub": data.username,
            "exp": access_token_expires
        }
        token = jwt.encode(token_data, SECRET_KEY, algorithm=ALGORITHM)
        
        return {
            "access_token": token, 
            "token_type": "bearer",
            "user": {
                "email": ADMIN_EMAIL, 
                "role": "admin",
                "name": "Administrateur"
            }
        }
    
    raise HTTPException(status_code=401, detail="Email ou mot de passe incorrect")

class ContactMessageCreate(BaseModel):
    name: str
    email: EmailStr
    phone: Optional[str] = None
    subject: str
    message: str

@api_router.post("/contact")
async def handle_contact(contact: ContactMessageCreate):
    """Reçoit les messages du formulaire de contact"""
    try:
        # 1. Mise à jour ou Création (Upsert) dans MongoDB
        # On cherche par 'email'. Si l'email existe, on met à jour les infos. 
        # S'il n'existe pas, MongoDB le crée automatiquement.
        await db.contacts.update_one(
            {"email": contact.email},  # Critère de recherche
            {
                "$set": {
                    "name": contact.name,
                    "phone": contact.phone,
                    "updated_at": datetime.now(timezone.utc)
                },
                "$setOnInsert": { # Ces champs ne sont ajoutés QUE lors de la création
                    "created_at": datetime.now(timezone.utc)
                }
            },
            upsert=True
        )

        # 2. Ici, vous pouvez ajouter l'envoi d'email si besoin
        # 2. Envoi de l'e-mail (vous utilisez ici toutes les infos, y compris sujet et message)
        # Note : Assurez-vous d'avoir configuré 'fastmail' globalement
        # 2. Préparation et envoi de l'e-mail
        message = MessageSchema(
            subject=f"Nouveau contact : {contact.subject}",
            recipients=["ethanscape.servicesclients@gmail.com"],
            body=f"De: {contact.name}\nEmail: {contact.email}\nTel: {contact.phone}\n\nMessage:\n{contact.message}",
            subtype=MessageType.plain
        )
        
        # 🔥 C'EST CETTE LIGNE QUI MANQUE DANS VOTRE CODE ACTUEL !
        await fastmail.send_message(message)
        
        logging.info(f"✅ E-mail envoyé avec succès pour : {contact.name}")
        
        return {"message": "Message reçu avec succès !"}
    except Exception as e:
        logging.error(f"Erreur serveur : {e}")
        raise HTTPException(status_code=500, detail="Erreur lors de l'enregistrement du message")

# Include the router in the main app

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()