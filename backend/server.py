# inmport de toute les fonctionnalité
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

# Récupération des variables base de donnée 
mongo_url = os.getenv('MONGO_URL')
db_name = os.getenv('DB_NAME')

#si il n'est pas trouver mettre message d'erreur 
if not mongo_url:
    raise RuntimeError("ERREUR : MONGO_URL est introuvable dans le fichier .env")

# Connexion MongoDB
client = AsyncIOMotorClient(mongo_url)
db = client["EthanScape"]

app = FastAPI()
api_router = APIRouter(prefix="/api")


# Configuration Email avec brevo
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

SECRET_KEY = os.getenv("JWT_SECRET_KEY")
ALGORITHM = "HS256"
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/login")

# ========================
# MODELS
# ========================
class EscapeGame(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: str
    theme: str
    difficulty: str
    min_players: int
    max_players: int
    image_url: str
    is_active: bool = True
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


# ========================
# ROUTES - ESCAPES
# ========================

# retourne la liste des escape trouver dans la bdd
@api_router.get("/escapes", response_model=List[EscapeGame])
async def get_escapes(theme: Optional[str] = None):
    # On retire le filtre pour voir si vos données s'affichent
    query = {} 
    
    # Prise en compte du paramètre theme s'il est renseigné et différent de "all"
    if theme and theme.lower() != "all":
        # Recherche insensible à la casse avec regex (ex: "marvel" trouvera "Marvel")
        query["theme"] = {"$regex": f"^{theme}$", "$options": "i"}

    escapes_cursor = db.escapes.find(query)
    escapes = []
    async for doc in escapes_cursor:

        if "id" not in doc or not doc["id"]:
            doc["id"] = str(doc["_id"])
        escapes.append(doc)

    return escapes

# recupere l'escape selectionné grace a son id 
@api_router.get("/escapes/{escape_id}", response_model=EscapeGame)
async def get_escape(escape_id: str):

    escape = await db.escapes.find_one({"id": escape_id}, {"_id": 0})
    if not escape:
        raise HTTPException(status_code=404, detail="Escape game non trouvé")
    
    if isinstance(escape.get('created_at'), str):
        escape['created_at'] = datetime.fromisoformat(escape['created_at'])
    
    return escape

# met une seul fois le theme pour la recherche par theme
@api_router.get("/themes")
async def get_themes():
    """Get all unique themes"""
    themes = await db.escapes.distinct("theme", {"is_active": True})
    return {"themes": themes}

# ========================
# ROUTES - RESERVATIONS
# ========================
@api_router.post("/reservations", response_model=Reservation)
async def create_reservation(reservation: ReservationCreate):
    """Créer une nouvelle réservation et envoyer une notification par e-mail"""
    
    # Création de l'objet de réservation complet
    reservation_obj = Reservation(
        **reservation.model_dump(),
    )
    
    # envoi des donée recueilli a mongo
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

        # envoie message sur boite mail
        message = MessageSchema(
            subject=f"🚨 Nouvelle réservation : {reservation_obj.escape_title}",
            recipients=["ethanscape.servicesclients@gmail.com"],
            body=html_content,
            subtype=MessageType.html
        )

        await fastmail.send_message(message)
        logging.info("✉️ E-mail d'alerte admin envoyé avec l'adresse hiérarchisée !")

    # message d'erreur 
    except Exception as e:
        logging.error(f"❌ Échec de l'envoi de l'e-mail de notification : {e}")
        pass

    return reservation_obj
# recupere et affiche si les jour est crénaux son libre 
@api_router.get("/available-slots")
async def get_available_slots(date: str):
    """Récupérer les créneaux disponibles pour une date donnée"""
    base_slots = ["09:00", "10:00", "11:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00"]
    query = {"date": date, "status": {"$ne": "cancelled"}}
        
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

    @api_router.get("/available-slots")


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
        # mise a jour ou création du contact dans mongo
        await db.contacts.update_one(
            {"email": contact.email}, 
            {
                "$set": {
                    "name": contact.name,
                    "phone": contact.phone,
                    "updated_at": datetime.now(timezone.utc)
                },
                "$setOnInsert": { 
                    "created_at": datetime.now(timezone.utc)
                }
            },
            upsert=True
        )

        # envoi du message sur la boite mail 
        message = MessageSchema(
            subject=f"Nouveau contact : {contact.subject}",
            recipients=["ethanscape.servicesclients@gmail.com"],
            body=f"De: {contact.name}\nEmail: {contact.email}\nTel: {contact.phone}\n\nMessage:\n{contact.message}",
            subtype=MessageType.plain
        )
        
        await fastmail.send_message(message)
        
        logging.info(f"✅ E-mail envoyé avec succès pour : {contact.name}")
        
        return {"message": "Message reçu avec succès !"}
    except Exception as e:
        logging.error(f"Erreur serveur : {e}")
        raise HTTPException(status_code=500, detail="Erreur lors de l'enregistrement du message")

# sécurité react fast api
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