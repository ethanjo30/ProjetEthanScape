
/*Action: file_editor create /app/frontend/src/pages/BookingPage.jsx --file-text "import { useState, useEffect } from \"react\";
import { useSearchParams, useNavigate } from \"react-router-dom\";
import axios from \"axios\";
import { toast } from \"sonner\";
import { Calendar } from \"@/components/ui/calendar\";
import { Button } from \"@/components/ui/button\";
import { Input } from \"@/components/ui/input\";
import { Label } from \"@/components/ui/label\";
import { Textarea } from \"@/components/ui/textarea\";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from \"@/components/ui/select\";
import usePricing from \"@/hooks/usePricing\";
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
} from \"lucide-react\";
import { format, addDays, isBefore, startOfDay } from \"date-fns\";
import { fr } from \"date-fns/locale\";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

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
  const [selectedSlot, setSelectedSlot] = useState(\"\");
  const [duration, setDuration] = useState(60);
  const [numPeople, setNumPeople] = useState(4);
  const [formData, setFormData] = useState({
    name: \"\",
    email: \"\",
    phone: \"\",
    address: \"\",
    message: \"\"
  });

  // Price calculation
  const priceInfo = calculatePrice(numPeople, duration);

  useEffect(() => {
    fetchEscapes();
  }, []);

  useEffect(() => {
    const escapeId = searchParams.get(\"escape\");
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
      fetchAvailableSlots(format(selectedDate, \"yyyy-MM-dd\"));
    }
  }, [selectedDate]);

  const fetchEscapes = async () => {
    try {
      const response = await axios.get(`${API}/escapes`);
      setEscapes(response.data);
    } catch (error) {
      console.error(\"Error fetching escapes:\", error);
      toast.error(\"Erreur lors du chargement des escapes\");
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableSlots = async (date) => {
    setSlotsLoading(true);
    try {
      const response = await axios.get(`${API}/available-slots?date=${date}`);
      setAvailableSlots(response.data.slots || []);
    } catch (error) {
      console.error(\"Error fetching slots:\", error);
    } finally {
      setSlotsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const reservationData = {
        escape_id: selectedEscape.id,
        escape_title: selectedEscape.title,
        client_name: formData.name,
        client_email: formData.email,
        client_phone: formData.phone,
        client_address: formData.address,
        date: format(selectedDate, \"yyyy-MM-dd\"),
        time_slot: selectedSlot,
        duration: duration,
        num_people: numPeople,
        message: formData.message || null
      };

      await axios.post(`${API}/reservations`, reservationData);
      toast.success(\"Réservation envoyée avec succès !\");
      setStep(5); // Success step
    } catch (error) {
      console.error(\"Error submitting reservation:\", error);
      toast.error(\"Erreur lors de la réservation. Veuillez réessayer.\");
    } finally {
      setSubmitting(false);
    }
  };

  const canProceed = () => {
    switch (step) {
      case 1: return selectedEscape !== null;
      case 2: return selectedDate !== null && selectedSlot !== \"\";
      case 3: return numPeople >= 4 && numPeople <= 39;
      case 4: return formData.name && formData.email && formData.phone && formData.address;
      default: return false;
    }
  };

  const disabledDays = (date) => {
    return isBefore(date, startOfDay(new Date()));
  };

  if (loading) {
    return (
      <div className=\"min-h-screen pt-24 flex items-center justify-center\">
        <Loader2 className=\"w-8 h-8 text-amber-400 animate-spin\" />
      </div>
    );
  }

  // Success screen
  if (step === 5) {
    return (
      <div data-testid=\"booking-success\" className=\"min-h-screen pt-24 pb-16 flex items-center justify-center\">
        <div className=\"max-w-md mx-auto px-6 text-center\">
          <div className=\"w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6\">
            <CheckCircle2 className=\"w-10 h-10 text-green-500\" />
          </div>
          <h1 className=\"text-3xl font-bold text-white mb-4 font-['Playfair_Display']\">
            Réservation confirmée !
          </h1>
          <p className=\"text-slate-400 mb-8\">
            Nous avons bien reçu votre demande. Vous recevrez un email de confirmation dans les prochaines heures.
          </p>
          <div className=\"bg-slate-900/50 rounded-xl p-6 border border-slate-800 text-left mb-8\">
            <h3 className=\"text-white font-semibold mb-4\">Récapitulatif</h3>
            <div className=\"space-y-2 text-sm\">
              <p className=\"text-slate-400\">
                <span className=\"text-slate-300\">Escape:</span> {selectedEscape?.title}
              </p>
              <p className=\"text-slate-400\">
                <span className=\"text-slate-300\">Date:</span> {selectedDate && format(selectedDate, \"d MMMM yyyy\", { locale: fr })}
              </p>
              <p className=\"text-slate-400\">
                <span className=\"text-slate-300\">Heure:</span> {selectedSlot}
              </p>
              <p className=\"text-slate-400\">
                <span className=\"text-slate-300\">Participants:</span> {numPeople} personnes
              </p>
              <p className=\"text-amber-400 font-semibold mt-4\">
                Total: {priceInfo.totalPrice}€
              </p>
            </div>
          </div>
          <Button
            onClick={() => navigate(\"/\")}
            className=\"bg-amber-400 text-slate-900 hover:bg-amber-300 rounded-full px-8\"
          >
            Retour à l'accueil
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div data-testid=\"booking-page\" className=\"min-h-screen pt-24 pb-16\">
      {/* Header *}
      <section className=\"py-8 bg-gradient-to-b from-slate-900 to-slate-950\">
        <div className=\"max-w-7xl mx-auto px-6\">
          <h1 className=\"text-4xl md:text-5xl font-bold text-white mb-4 font-['Playfair_Display'] text-center\">
            Réserver votre <span className=\"text-amber-400\">aventure</span>
          </h1>
          
          {/* Progress Steps *}
          <div className=\"flex items-center justify-center gap-2 md:gap-4 mt-8\">
            {[
              { num: 1, label: \"Escape\" },
              { num: 2, label: \"Date\" },
              { num: 3, label: \"Détails\" },
              { num: 4, label: \"Infos\" }
            ].map((s, index) => (
              <div key={s.num} className=\"flex items-center\">
                <div 
                  className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                    step >= s.num 
                      ? \"bg-amber-400 text-slate-900\" 
                      : \"bg-slate-800 text-slate-500\"
                  }`}
                >
                  {s.num}
                </div>
                <span className={`hidden md:block ml-2 text-sm ${
                  step >= s.num ? \"text-white\" : \"text-slate-500\"
                }`}>
                  {s.label}
                </span>
                {index < 3 && (
                  <ChevronRight className=\"mx-2 text-slate-700\" size={16} />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className=\"max-w-5xl mx-auto px-6 py-12\">
        <div className=\"grid lg:grid-cols-3 gap-8\">
          {/* Main Content *}
          <div className=\"lg:col-span-2\">
            {/* Step 1: Select Escape *}
            {step === 1 && (
              <div data-testid=\"step-1\" className=\"space-y-6\">
                <h2 className=\"text-2xl font-bold text-white font-['Playfair_Display']\">
                  Choisissez votre escape
                </h2>
                <div className=\"grid sm:grid-cols-2 gap-4\">
                  {escapes.map((escape) => (
                    <button
                      key={escape.id}
                      onClick={() => setSelectedEscape(escape)}
                      data-testid={`select-escape-${escape.id}`}
                      className={`p-4 rounded-xl border text-left transition-all ${
                        selectedEscape?.id === escape.id
                          ? \"border-amber-400 bg-amber-400/10\"
                          : \"border-slate-800 bg-slate-900/50 hover:border-slate-700\"
                      }`}
                    >
                      <img 
                        src={escape.image_url} 
                        alt={escape.title}
                        className=\"w-full h-32 object-cover rounded-lg mb-3\"
                      />
                      <h3 className=\"text-white font-medium mb-1\">{escape.title}</h3>
                      <p className=\"text-slate-400 text-sm\">{escape.theme}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 2: Select Date & Time *}
            {step === 2 && (
              <div data-testid=\"step-2\" className=\"space-y-6\">
                <h2 className=\"text-2xl font-bold text-white font-['Playfair_Display']\">
                  Choisissez la date et l'heure
                </h2>
                
                <div className=\"grid md:grid-cols-2 gap-6\">
                  <div className=\"bg-slate-900/50 rounded-xl p-4 border border-slate-800\">
                    <Label className=\"text-white mb-4 block\">Date</Label>
                    <Calendar
                      mode=\"single\"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      disabled={disabledDays}
                      locale={fr}
                      className=\"rounded-md\"
                      data-testid=\"date-calendar\"
                    />
                  </div>
                  
                  <div className=\"bg-slate-900/50 rounded-xl p-4 border border-slate-800\">
                    <Label className=\"text-white mb-4 block\">Créneau horaire</Label>
                    {!selectedDate ? (
                      <p className=\"text-slate-500 text-sm\">Sélectionnez d'abord une date</p>
                    ) : slotsLoading ? (
                      <Loader2 className=\"w-6 h-6 text-amber-400 animate-spin\" />
                    ) : (
                      <div className=\"grid grid-cols-2 gap-2\">
                        {availableSlots.map((slot) => (
                          <button
                            key={slot.time}
                            onClick={() => slot.is_available && setSelectedSlot(slot.time)}
                            disabled={!slot.is_available}
                            data-testid={`slot-${slot.time}`}
                            className={`py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                              !slot.is_available
                                ? \"bg-slate-800/50 text-slate-600 cursor-not-allowed\"
                                : selectedSlot === slot.time
                                ? \"bg-amber-400 text-slate-900\"
                                : \"bg-slate-800 text-white hover:bg-slate-700\"
                            }`}
                          >
                            {slot.time}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Duration & People *}
            {step === 3 && (
              <div data-testid=\"step-3\" className=\"space-y-6\">
                <h2 className=\"text-2xl font-bold text-white font-['Playfair_Display']\">
                  Détails de votre réservation
                </h2>
                
                <div className=\"space-y-6\">
                  <div className=\"bg-slate-900/50 rounded-xl p-6 border border-slate-800\">
                    <Label className=\"text-white mb-4 block flex items-center gap-2\">
                      <Clock size={18} className=\"text-amber-400\" />
                      Durée de l'escape
                    </Label>
                    <Select value={String(duration)} onValueChange={(v) => setDuration(Number(v))}>
                      <SelectTrigger className=\"w-full bg-slate-800 border-slate-700\" data-testid=\"duration-select\">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value=\"30\">30 minutes</SelectItem>
                        <SelectItem value=\"60\">1 heure</SelectItem>
                        <SelectItem value=\"90\">1 heure 30</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className=\"bg-slate-900/50 rounded-xl p-6 border border-slate-800\">
                    <Label className=\"text-white mb-4 block flex items-center gap-2\">
                      <Users size={18} className=\"text-amber-400\" />
                      Nombre de participants
                    </Label>
                    <div className=\"flex items-center gap-4\">
                      <Button
                        type=\"button\"
                        variant=\"outline\"
                        onClick={() => setNumPeople(Math.max(4, numPeople - 1))}
                        className=\"w-10 h-10 p-0\"
                        data-testid=\"decrease-people\"
                      >
                        -
                      </Button>
                      <Input
                        type=\"number\"
                        min={4}
                        max={39}
                        value={numPeople}
                        onChange={(e) => setNumPeople(Math.min(39, Math.max(4, Number(e.target.value))))}
                        className=\"w-20 text-center bg-slate-800 border-slate-700\"
                        data-testid=\"people-input\"
                      />
                      <Button
                        type=\"button\"
                        variant=\"outline\"
                        onClick={() => setNumPeople(Math.min(39, numPeople + 1))}
                        className=\"w-10 h-10 p-0\"
                        data-testid=\"increase-people\"
                      >
                        +
                      </Button>
                    </div>
                    <p className=\"text-slate-500 text-sm mt-2\">Entre 4 et 39 personnes</p>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Contact Info *}
            {step === 4 && (
              <form data-testid=\"step-4\" className=\"space-y-6\" onSubmit={handleSubmit}>
                <h2 className=\"text-2xl font-bold text-white font-['Playfair_Display']\">
                  Vos informations
                </h2>
                
                <div className=\"grid sm:grid-cols-2 gap-4\">
                  <div>
                    <Label htmlFor=\"name\" className=\"text-white mb-2 block\">Nom complet *</Label>
                    <Input
                      id=\"name\"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      required
                      className=\"bg-slate-800 border-slate-700\"
                      data-testid=\"input-name\"
                    />
                  </div>
                  <div>
                    <Label htmlFor=\"email\" className=\"text-white mb-2 block\">Email *</Label>
                    <Input
                      id=\"email\"
                      type=\"email\"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      required
                      className=\"bg-slate-800 border-slate-700\"
                      data-testid=\"input-email\"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor=\"phone\" className=\"text-white mb-2 block\">Téléphone *</Label>
                  <Input
                    id=\"phone\"
                    type=\"tel\"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    required
                    className=\"bg-slate-800 border-slate-700\"
                    data-testid=\"input-phone\"
                  />
                </div>

                <div>
                  <Label htmlFor=\"address\" className=\"text-white mb-2 block flex items-center gap-2\">
                    <MapPin size={16} className=\"text-amber-400\" />
                    Adresse de l'événement *
                  </Label>
                  <Textarea
                    id=\"address\"
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    required
                    placeholder=\"Adresse complète où se déroulera l'escape game\"
                    className=\"bg-slate-800 border-slate-700 min-h-[80px]\"
                    data-testid=\"input-address\"
                  />
                </div>

                <div>
                  <Label htmlFor=\"message\" className=\"text-white mb-2 block\">Message (optionnel)</Label>
                  <Textarea
                    id=\"message\"
                    value={formData.message}
                    onChange={(e) => setFormData({...formData, message: e.target.value})}
                    placeholder=\"Informations supplémentaires, demandes spéciales...\"
                    className=\"bg-slate-800 border-slate-700 min-h-[80px]\"
                    data-testid=\"input-message\"
                  />
                </div>
              </form>
            )}

            {/* Navigation Buttons *}
            <div className=\"flex justify-between mt-8\">
              {step > 1 && (
                <Button
                  type=\"button\"
                  variant=\"outline\"
                  onClick={() => setStep(step - 1)}
                  className=\"flex items-center gap-2\"
                  data-testid=\"btn-previous\"
                >
                  <ChevronLeft size={18} />
                  Précédent
                </Button>
              )}
              
              {step < 4 ? (
                <Button
                  type=\"button\"
                  onClick={() => setStep(step + 1)}
                  disabled={!canProceed()}
                  className=\"ml-auto bg-amber-400 text-slate-900 hover:bg-amber-300 flex items-center gap-2\"
                  data-testid=\"btn-next\"
                >
                  Suivant
                  <ChevronRight size={18} />
                </Button>
              ) : (
                <Button
                  type=\"submit\"
                  onClick={handleSubmit}
                  disabled={!canProceed() || submitting}
                  className=\"ml-auto bg-amber-400 text-slate-900 hover:bg-amber-300 flex items-center gap-2\"
                  data-testid=\"btn-submit\"
                >
                  {submitting ? (
                    <Loader2 className=\"w-5 h-5 animate-spin\" />
                  ) : (
                    <>
                      Confirmer la réservation
                      <CheckCircle2 size={18} />
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>

          {/* Price Sidebar *}
          <div className=\"lg:col-span-1\">
            <div className=\"sticky top-28 bg-slate-900/50 rounded-xl border border-slate-800 p-6\">
              <h3 className=\"text-lg font-semibold text-white mb-4 font-['Playfair_Display']\">
                Récapitulatif
              </h3>
              
              {selectedEscape && (
                <div className=\"mb-4 pb-4 border-b border-slate-800\">
                  <img 
                    src={selectedEscape.image_url} 
                    alt={selectedEscape.title}
                    className=\"w-full h-24 object-cover rounded-lg mb-2\"
                  />
                  <p className=\"text-white font-medium\">{selectedEscape.title}</p>
                  <p className=\"text-slate-400 text-sm\">{selectedEscape.theme}</p>
                </div>
              )}

              <div className=\"space-y-3 text-sm\">
                {selectedDate && (
                  <div className=\"flex items-center gap-2 text-slate-300\">
                    <CalendarDays size={16} className=\"text-amber-400\" />
                    {format(selectedDate, \"d MMMM yyyy\", { locale: fr })}
                  </div>
                )}
                {selectedSlot && (
                  <div className=\"flex items-center gap-2 text-slate-300\">
                    <Clock size={16} className=\"text-amber-400\" />
                    {selectedSlot}
                  </div>
                )}
                <div className=\"flex items-center gap-2 text-slate-300\">
                  <Clock size={16} className=\"text-amber-400\" />
                  {duration === 30 ? \"30 minutes\" : duration === 60 ? \"1 heure\" : \"1h30\"}
                </div>
                <div className=\"flex items-center gap-2 text-slate-300\">
                  <Users size={16} className=\"text-amber-400\" />
                  {numPeople} personnes
                </div>
              </div>

              <div className=\"mt-6 pt-4 border-t border-slate-800\">
                <div className=\"flex justify-between text-slate-400 text-sm mb-2\">
                  <span>Prix par personne</span>
                  <span>{priceInfo.pricePerPerson}€</span>
                </div>
                <div className=\"flex justify-between text-white font-semibold\">
                  <span>Total</span>
                  <span className=\"text-2xl text-amber-400\" data-testid=\"total-price\">
                    {priceInfo.totalPrice}€
                  </span>
                </div>
                <p className=\"text-slate-500 text-xs mt-2\">
                  Catégorie: {priceInfo.category}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingPage;
"
Observation: Create successful: /app/frontend/src/pages/BookingPage.jsx*/