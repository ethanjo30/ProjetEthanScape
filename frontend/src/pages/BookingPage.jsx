import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { Calendar } from "../components/ui/calendar.jsx";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import usePricing from "../hooks/usePricing";
import { AlertCircle } from "lucide-react";
import {
  CalendarDays,
  Users,
  Clock,
  Euro,
  MapPin,
  CheckCircle2,
  Loader2,
  ChevronRight,
  ChevronLeft
} from "lucide-react";
import { format, addDays, isBefore, startOfDay } from "date-fns";
import { fr } from "date-fns/locale";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "https://projetethanscape.onrender.com";
const API = `${BACKEND_URL}/api`;

// Tous les créneaux disponibles
const ALL_SLOTS = ["09:00", "10:00", "11:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00"];

const BookingPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { calculatePrice } = usePricing();

  const [step, setStep] = useState(1);
  const [escapes, setEscapes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);

  // Form state
  const [selectedEscape, setSelectedEscape] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState("");
  const [duration, setDuration] = useState(60);
  const [numPeople, setNumPeople] = useState(4);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    street_address: '',
    zip_code: '',
    city: '',
    message: ""
  });

  // Price calculation
  const priceInfo = calculatePrice(numPeople, duration);

  useEffect(() => {
    fetchEscapes();
  }, []);

  useEffect(() => {
    const escapeId = searchParams.get("escape");
    if (escapeId && escapes.length > 0) {
      const escape = escapes.find(e => e.id === escapeId);
      if (escape) {
        setSelectedEscape(escape);
        setStep(2);
      }
    }
  }, [searchParams, escapes]);

  useEffect(() => {
    if (selectedDate) {
      fetchAvailableSlots(format(selectedDate, "yyyy-MM-dd"));
      setSelectedSlot(""); // Réinitialise la sélection visuelle à chaque changement de date
    }
  }, [selectedDate]);

  const fetchEscapes = async () => {
    try {
      const response = await axios.get(`${API}/escapes`);
      setEscapes(response.data);
    } catch (error) {
      console.error("Error fetching escapes:", error);
      toast.error("Erreur lors du chargement des escapes");
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableSlots = async (date) => {
    setSlotsLoading(true);
    setSelectedSlot(""); // IMPORTANT : réinitialiser le slot sélectionné lors d'un changement de date
    try {
      const response = await axios.get(`${API}/available-slots?date=${date}`);
      setAvailableSlots(response.data.slots || []);

    } catch (error) {
      // ...
    } finally {
      setSlotsLoading(false);
    }
  };


  const isPhoneValid = (phone) => {
    const phoneRegex = /^[0-9]{10}$/;
    // Vérifie si c'est bien 10 chiffres, ET que ce n'est pas le numéro interdit, ET que ça ne commence pas par 08
    return phoneRegex.test(phone) && phone !== "0606060606" && !phone.startsWith("08");
  };

  // Validation Email corrigée
  const isEmailValid = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Validation Nom corrigée
  const isNameValid = (name) => {
    // Autorise lettres, espaces, tirets, apostrophes
    const nameRegex = /^[a-zA-ZÀ-ÿ\s'-]{2,}$/;
    return name && nameRegex.test(name.trim());
  };

  // Validation Adresse corrigée
  const isAddressValid = (address) => {
    // Utilise \\s pour bien capturer l'espace
    const addressRegex = /^[a-zA-Z0-9À-ÿ\s,'-]{5,}$/;
    return address && addressRegex.test(address.trim());
  };

  // Validation code postal : Correct (5 chiffres)
  const isZipCodeValid = (zip) => {
    const zipRegex = /^[0-9]{5}$/;
    return zipRegex.test(zip);
  };

  // Validation ville : autorise lettres, espaces, tirets
  const isCityValid = (city) => {
    // Remplacement de 's' par '\\s'
    const cityRegex = /^[a-zA-ZÀ-ÿ\\s-]{2,}$/;
    return city && cityRegex.test(city.trim());
  };


  const getBlockedSlots = (slotTime) => {
    const slotIndex = ALL_SLOTS.indexOf(slotTime);
    if (slotIndex === -1) return [];

    // Définir les variables de blocage par défaut
    let paddingBefore = 1;
    let paddingAfter = 1;

    // Appliquer vos exceptions
    if (slotTime === "14:00") paddingBefore = 0;
    if (slotTime === "11:00") paddingAfter = 0;

    const blocked = [];

    // On boucle en utilisant les variables dynamiques
    for (let i = -paddingBefore; i <= paddingAfter; i++) {
      const targetIndex = slotIndex + i;

      if (targetIndex >= 0 && targetIndex < ALL_SLOTS.length) {
        blocked.push(ALL_SLOTS[targetIndex]);
      }
    }

    return blocked;
  };

  /**
   * Vérifie si un créneau peut être sélectionné (lui + les suivants doivent être libres)
   */
  const canSelectSlot = (slotTime) => {
    const slotsNeeded = getBlockedSlots(slotTime, duration);

    // Tous les créneaux nécessaires doivent être disponibles
    return slotsNeeded.every(s => {
      const slot = availableSlots.find(as => as.time === s);
      return slot && slot.is_available;
    });
  };

  /**
   * Vérifie si un créneau serait bloqué par la sélection actuelle
   */
  const isSlotBlockedBySelection = (slotTime) => {
    if (!selectedSlot) return false;
    const blockedSlots = getBlockedSlots(selectedSlot, duration);
    return blockedSlots.includes(slotTime) && slotTime !== selectedSlot;
  };



  const handleSubmit = async (e) => {
    e.preventDefault();

    // 1. Validation uniquement lors du clic sur le bouton
    if (!isEmailValid(formData.email)) {
      toast.error("Format d'adresse email invalide.");
      return;
    }
    if (!isPhoneValid(formData.phone)) {
      toast.error("Numéro de téléphone invalide ou non autorisé.");
      return;
    }

    if (!isNameValid(formData.name)) {
      toast.error("Veuillez inscrire votre nom et prenom.");
      return;
    }
    if (!isAddressValid(formData.street_address)) {
      toast.error("Veuillez entrer une adresse valide.");
      return;
    }
    if (!isZipCodeValid(formData.zip_code)) {
      toast.error("Le code postal doit contenir exactement 5 chiffres.");
      return;
    }
    if (!isCityValid(formData.city)) {
      toast.error("Veuillez entrer une ville valide.");
      return;
    }

    setSubmitting(true);

    try {
      const reservationData = {
        escape_id: selectedEscape.id,
        escape_title: selectedEscape.title, // N'oubliez pas d'ajouter ceci, requis par votre backend
        client_name: formData.name,
        client_email: formData.email,
        client_phone: formData.phone,
        street_address: formData.street_address,
        zip_code: String(formData.zip_code), // FORCE la conversion en chaîne de caractères
        city: formData.city,
        date: format(selectedDate, "yyyy-MM-dd"),
        time_slot: selectedSlot,
        duration: parseInt(duration, 10),
        num_people: parseInt(numPeople, 10),
        message: formData.message || null
      };

      console.log("Données envoyées au serveur :", JSON.stringify(reservationData, null, 2));

      await axios.post(`${API}/reservations`, reservationData);
      toast.success("Réservation envoyée avec succès !");
      setStep(5); // Passage à l'écran de succès
    } catch (error) {
      // C'est ici que le serveur envoie le détail de l'erreur 422
      if (error.response && error.response.data) {
        console.log("Détails de l'erreur serveur :", error.response.data);
        // Si votre API renvoie une liste d'erreurs, affichez-la :
        if (error.response.data.errors) {
          console.table(error.response.data.errors);
        }
      } else {
        console.error("Erreur:", error);
      }
      toast.error("Erreur 422 : Les données envoyées sont invalides.");
    }
  }

  const canProceed = () => {
    switch (step) {
      case 1: return selectedEscape !== null;
      case 2: return selectedDate !== null && selectedSlot !== "";
      case 3: return numPeople >= 4 && numPeople <= 39;
      case 4: return (
        formData.name.length > 0 &&
        formData.email.length > 0 &&
        formData.phone.length > 0 &&
        formData.street_address.length > 0 &&
        formData.zip_code.length > 0 &&
        formData.city.length > 0
      );
      default: return false;
    }
  };

  const disabledDays = (date) => {
    return isBefore(date, startOfDay(new Date()));
  };

  const durationText = { 30: "30 min", 60: "1 heure", 90: "1h30" };

  if (loading) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
      </div>
    );
  }


  // Success screen
  if (step === 5) {
    return (
      <div data-testid="booking-success" className="min-h-screen pt-24 pb-16 flex items-center justify-center">
        <div className="max-w-md mx-auto px-6 text-center">
          <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-green-500" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-4 font-['Playfair_Display']">
            Réservation confirmée !
          </h1>
          <p className="text-slate-400 mb-8">
            Nous avons bien reçu votre demande. Vous recevrez un email de confirmation dans les prochaines 48 heures.
          </p>
          <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-800 text-left mb-8">
            <h3 className="text-white font-semibold mb-4">Récapitulatif</h3>
            <div className="space-y-2 text-sm">
              <p className="text-slate-400">
                <span className="text-slate-300">Escape:</span> {selectedEscape?.title}
              </p>
              <p className="text-slate-400">
                <span className="text-slate-300">Date:</span> {selectedDate && format(selectedDate, "d MMMM yyyy", { locale: fr })}
              </p>
              <p className="text-slate-400">
                <span className="text-slate-300">Heure:</span> {selectedSlot}
              </p>
              <p className="text-slate-400">
                <span className="text-slate-300">Durée:</span> {durationText[duration]}
              </p>
              <p className="text-slate-400">
                <span className="text-slate-300">Participants:</span> {numPeople} personnes
              </p>
              <p className="text-amber-400 font-semibold mt-4">
                Total estimé: {priceInfo.totalPrice}€ *
              </p>
              <p className="text-slate-500 text-xs mt-2 italic">
                  * Au prix affiché s'ajouteront les frais de déplacement.
                </p>
            </div>
          </div>
          <Button
            onClick={() => navigate("/")}
            className="bg-amber-400 text-slate-900 hover:bg-amber-300 rounded-full px-8"
          >
            Retour à l'accueil
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div data-testid="booking-page" className="min-h-screen pt-24 pb-16">
      {/* Header */}
      <section className="py-8 bg-gradient-to-b from-slate-900 to-slate-950">
        <div className="max-w-7xl mx-auto px-6">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 font-['Playfair_Display'] text-center">
            Réserver votre <span className="text-amber-400">aventure</span>
          </h1>

          {/* Progress Steps */}
          <div className="flex items-center justify-center gap-2 md:gap-4 mt-8">
            {[
              { num: 1, label: "Escape" },
              { num: 2, label: "Date & Heure" },
              { num: 3, label: "Participants" },
              { num: 4, label: "Coordonnées" }
            ].map((s, index) => (
              <div key={s.num} className="flex items-center">
                <div
                  className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all ${step >= s.num
                    ? "bg-amber-400 text-slate-900"
                    : "bg-slate-800 text-slate-500"
                    }`}
                >
                  {s.num}
                </div>
                <span className={`hidden md:block ml-2 text-sm ${step >= s.num ? "text-white" : "text-slate-500"
                  }`}>
                  {s.label}
                </span>
                {index < 3 && (
                  <ChevronRight className="mx-2 text-slate-700" size={16} />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Step 1: Select Escape */}
            {step === 1 && (
              <div data-testid="step-1" className="space-y-6">
                <h2 className="text-2xl font-bold text-white font-['Playfair_Display']">
                  Choisissez votre escape
                </h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  {escapes.map((escape) => (
                    <button
                      key={escape.id}
                      onClick={() => setSelectedEscape(escape)}
                      data-testid={`select-escape-${escape.id}`}
                      className={`p-4 rounded-xl border text-left transition-all ${selectedEscape?.id === escape.id
                        ? "border-amber-400 bg-amber-400/10"
                        : "border-slate-800 bg-slate-900/50 hover:border-slate-700"
                        }`}
                    >
                      <div className="w-full h-42 flex items-center justify-center overflow-hidden rounded-lg bg-gray-900 border border-gray-800 mb-3">
                        <img
                          src={escape.image_url}
                          alt={escape.title}
                          className="max-h-full max-w-full object-contain"
                        />
                      </div>
                      <h3 className="text-white font-medium mb-1">{escape.title}</h3>
                      <p className="text-slate-400 text-sm">{escape.theme}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 2: Select Duration, Date & Time */}
            {step === 2 && (
              <div data-testid="step-2" className="space-y-6">
                <h2 className="text-2xl font-bold text-white font-['Playfair_Display']">
                  Choisissez la durée, date et heure
                </h2>

                {/* Duration Selection FIRST */}
                <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-800">
                  <Label className="text-white mb-3 block flex items-center gap-2">
                    <Clock size={18} className="text-amber-400" />
                    Durée de l'escape
                  </Label>
                  <div className="grid grid-cols-3 gap-3">
                    {[30, 60, 90].map((d) => (
                      <button
                        key={d}
                        onClick={() => setDuration(d)}
                        data-testid={`duration-${d}`}
                        className={`py-3 px-4 rounded-lg font-medium transition-all ${duration === d
                          ? "bg-amber-400 text-slate-900"
                          : "bg-slate-800 text-white hover:bg-slate-700"
                          }`}
                      >
                        {durationText[d]}
                      </button>
                    ))}
                  </div>
                  <p className="text-slate-500 text-xs mt-2">
                    {duration === 30 && "Session courte - Idéale pour découvrir"}
                    {duration === 60 && "Session standard - L'expérience complète"}
                    {duration === 90 && "Session longue - Pour les passionnés"}
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  {/* Calendar */}
                  <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-800">
                    <Label className="text-white mb-4 block">Date</Label>
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date) => {
                        setSelectedDate(date);
                        setSelectedSlot("");
                      }}
                      disabled={disabledDays}
                      locale={fr}
                      className="rounded-md"
                      data-testid="date-calendar"
                    />
                  </div>

                  {/* Time Slots */}
                  <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-800">
                    <Label className="text-white mb-4 block">Créneau horaire</Label>
                    {!selectedDate ? (
                      <p className="text-slate-500 text-sm">Sélectionnez d'abord une date</p>
                    ) : slotsLoading ? (
                      <Loader2 className="w-6 h-6 text-amber-400 animate-spin" />
                    ) : (
                      <>
                        <div className="grid grid-cols-2 gap-2">
                          {availableSlots.map((slot) => {
                            const canSelect = canSelectSlot(slot.time);
                            const isSelected = selectedSlot === slot.time;
                            const isBlockedBySelection = isSlotBlockedBySelection(slot.time);

                            return (
                              <button
                                key={slot.time}
                                onClick={() => canSelect && setSelectedSlot(slot.time)}
                                disabled={!canSelect}
                                data-testid={`slot-${slot.time}`}
                                className={`py-2 px-3 rounded-lg text-sm font-medium transition-all relative ${!slot.is_available
                                  ? "bg-slate-800/50 text-slate-600 cursor-not-allowed"
                                  : !canSelect
                                    ? "bg-slate-800/50 text-slate-600 cursor-not-allowed"
                                    : isSelected
                                      ? "bg-amber-400 text-slate-900"
                                      : "bg-slate-800 text-white hover:bg-slate-700"
                                  }`}

                              >
                                {slot.time}
                                {isBlockedBySelection && (
                                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-400 rounded-full flex items-center justify-center text-xs text-slate-900">
                                    +
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>


                        {/* Legend */}
                        <div className="mt-4 pt-4 border-t border-slate-700 space-y-2">
                          <div className="flex items-center gap-2 text-xs text-slate-400">
                            <div className="w-4 h-4 rounded bg-amber-400"></div>
                            <span>Créneau sélectionné</span>
                          </div>
                          {/*<div className="flex items-center gap-2 text-xs text-slate-400">
                            <div className="w-4 h-4 rounded bg-amber-400/30 border border-amber-400/50"></div>
                            <span>Créneaux réservés pour votre session</span>
                          </div>*/}
                          <div className="flex items-center gap-2 text-xs text-slate-400">
                            <div className="w-4 h-4 rounded bg-red-900/30"></div>
                            <span>Déjà réservé</span>
                          </div>
                        </div>


                        {selectedSlot && (
                          <div className="mt-4 p-3 bg-amber-400/10 border border-amber-400/30 rounded-lg">
                            <p className="text-amber-400 text-sm flex items-center gap-2">
                              <AlertCircle size={16} />
                              Session de {selectedSlot} à {
                                (() => {
                                  const [h, m] = selectedSlot.split(':').map(Number);
                                  const endMinutes = h * 60 + m + duration;
                                  const endH = Math.floor(endMinutes / 60);
                                  const endM = endMinutes % 60;
                                  return `${endH.toString().padStart(2, '0')}:${endM.toString().padStart(2, '0')}`;
                                })()
                              }
                            </p>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Number of People */}
            {step === 3 && (
              <div data-testid="step-3" className="space-y-6">
                <h2 className="text-2xl font-bold text-white font-['Playfair_Display']">
                  Nombre de participants
                </h2>

                <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-800">
                  <Label className="text-white mb-4 block flex items-center gap-2">
                    <Users size={18} className="text-amber-400" />
                    Combien serez-vous ?
                  </Label>
                  <div className="flex items-center gap-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setNumPeople(Math.max(4, numPeople - 1))}
                      className="w-12 h-12 p-0 text-xl"
                      data-testid="decrease-people"
                    >
                      -
                    </Button>
                    <Input
                      type="number"
                      min={4}
                      max={39}
                      value={numPeople}
                      onChange={(e) => setNumPeople(Math.min(39, Math.max(4, Number(e.target.value))))}
                      className="w-24 text-center text-xl bg-slate-800 border-slate-700"
                      data-testid="people-input"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setNumPeople(Math.min(39, numPeople + 1))}
                      className="w-12 h-12 p-0 text-xl"
                      data-testid="increase-people"
                    >
                      +
                    </Button>
                  </div>
                  <p className="text-slate-500 text-sm mt-3">Entre 4 et 39 personnes</p>

                  {/* Price info */}
                  <div className="mt-6 p-4 bg-slate-800/50 rounded-lg">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-slate-400">Catégorie</span>
                      <span className="text-white">{priceInfo.category}</span>
                    </div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-slate-400">Prix par personne</span>
                      <span className="text-white">{priceInfo.pricePerPerson}€</span>
                    </div>
                    <div className="flex justify-between text-lg font-semibold mt-3 pt-3 border-t border-slate-700">
                      <span className="text-white">Total</span>
                      <span className="text-amber-400">{priceInfo.totalPrice}€</span>
                    </div>
                  </div>
                </div>
              </div>
            )}


            {/* Step 4: Contact Info */}
            {step === 4 && (
              <form data-testid="step-4" className="space-y-6" onSubmit={handleSubmit}>
                <h2 className="text-2xl font-bold text-white font-['Playfair_Display']">
                  Vos coordonnées
                </h2>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name" className="text-white mb-2 block">Nom complet *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      className="bg-slate-800 border-slate-700"
                      data-testid="input-name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email" className="text-white mb-2 block">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className={`bg-slate-800 border-slate-700 ${!isEmailValid(formData.email) && formData.email.length > 0 ? 'border-red-500' : ''}`}
                    />
                    {!isEmailValid(formData.email) && formData.email.length > 0 && (
                      <p className="text-red-500 text-xs mt-1">Veuillez entrer une adresse email valide.</p>
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="phone" className="text-white mb-2 block">Téléphone *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    required
                    className="bg-slate-800 border-slate-700"
                    placeholder="06 XX XX XX XX"
                    data-testid="input-phone"
                  />
                </div>

                <div>
                  <Label className="text-white mb-2 block flex items-center gap-2">
                    <MapPin size={16} className="text-amber-400" />
                    Adresse de l'événement *
                  </Label>
                  <Input
                    value={formData.street_address}
                    onChange={(e) => setFormData({ ...formData, street_address: e.target.value })}
                    required
                    placeholder="12 Rue de la Paix"
                    className="bg-slate-800 border-slate-700 mb-3"
                    data-testid="input-street"
                  />
                  <div className="grid grid-cols-3 gap-3">
                    <Input
                      value={formData.zip_code}
                      onChange={(e) => setFormData({ ...formData, zip_code: e.target.value })}
                      required
                      placeholder="75002"
                      className="bg-slate-800 border-slate-700"
                      data-testid="input-zipcode"
                    />
                    <Input
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      required
                      placeholder="Paris"
                      className="bg-slate-800 border-slate-700 col-span-2"
                      data-testid="input-city"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="message" className="text-white mb-2 block">Message (optionnel)</Label>
                  <Textarea
                    id="message"
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Informations supplémentaires, demandes spéciales..."
                    className="bg-slate-800 border-slate-700 min-h-[80px]"
                    data-testid="input-message"
                  />
                </div>
              </form>
            )}

          </div>

          {/* Price Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-28 bg-slate-900/50 rounded-xl border border-slate-800 p-6">
              <h3 className="text-lg font-semibold text-white mb-4 font-['Playfair_Display']">
                Récapitulatif
              </h3>

              {selectedEscape && (
                <div className="mb-4 pb-4 border-b border-slate-800">
                  <div className="w-full h-32 flex items-center justify-center overflow-hidden rounded-lg bg-gray-900 border border-gray-800">
                    <img
                      src={selectedEscape.image_url}
                      alt={selectedEscape.title}
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                  <p className="text-white font-medium text-sm truncate">{selectedEscape.title}</p>
                  <p className="text-slate-400 text-xs">{selectedEscape.theme}</p>
                </div>
              )}

              <div className="space-y-3 text-sm">
                {selectedDate && (
                  <div className="flex items-center gap-2 text-slate-300">
                    <CalendarDays size={16} className="text-amber-400" />
                    {format(selectedDate, "d MMMM yyyy", { locale: fr })}
                  </div>
                )}
                {selectedSlot && (
                  <div className="flex items-center gap-2 text-slate-300">
                    <Clock size={16} className="text-amber-400" />
                    {selectedSlot} - {durationText[duration]}
                  </div>
                )}
                <div className="flex items-center gap-2 text-slate-300">
                  <Users size={16} className="text-amber-400" />
                  {numPeople} personnes
                </div>
              </div>

              {/* Navigation Buttons - Sidebar Version */}
              <div className="flex flex-col gap-3 mt-8">
                {step > 1 && (
                  <Button
                    type="button"
                    onClick={() => setStep(step - 1)}
                    className="h-12 w-40 flex items-center justify-center gap-2 bg-amber-400 hover:bg-amber-300 text-slate-900 font-semibold"
                    data-testid="btn-previous"
                  >
                    <ChevronLeft size={18} />
                    Précédent
                  </Button>
                )}

                {step < 4 ? (
                  <Button
                    type="button"
                    onClick={() => setStep(step + 1)}
                    disabled={!canProceed()}
                    className="h-12 w-40 bg-amber-400 text-slate-900 hover:bg-amber-300 flex items-center justify-center gap-2 font-semibold"
                    data-testid="btn-next"
                  >
                    Suivant
                    <ChevronRight size={18} />
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    onClick={handleSubmit}
                    disabled={!canProceed() || submitting}
                    className="h-12 w-40 bg-amber-400 text-slate-900 hover:bg-amber-300 flex items-center justify-center gap-2 font-semibold"
                    data-testid="btn-submit"
                  >
                    {submitting ? (
                      <Loader2 className="h-12 w-40 animate-spin" />
                    ) : (
                      <>
                        Confirmer
                        <CheckCircle2 size={18} />
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
export default BookingPage;