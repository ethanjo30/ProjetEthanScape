
/*Action: file_editor create /app/frontend/src/pages/ClientDashboard.jsx --file-text "import { useState, useEffect } from \"react\";
import { useNavigate, Link } from \"react-router-dom\";
import { useAuth } from \"@/contexts/AuthContext\";
import axios from \"axios\";
import { toast } from \"sonner\";
import { Button } from \"@/components/ui/button\";
import { 
  Calendar, 
  Clock, 
  Users, 
  MapPin, 
  LogOut, 
  Loader2,
  CheckCircle2,
  XCircle,
  AlertCircle
} from \"lucide-react\";
import { format } from \"date-fns\";
import { fr } from \"date-fns/locale\";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ClientDashboard = () => {
  const navigate = useNavigate();
  const { user, logout, loading: authLoading } = useAuth();
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate(\"/connexion\");
    } else if (!authLoading && user?.is_admin) {
      navigate(\"/admin\");
    } else if (user) {
      fetchReservations();
    }
  }, [user, authLoading, navigate]);

  const fetchReservations = async () => {
    try {
      const response = await axios.get(`${API}/client/reservations`);
      setReservations(response.data);
    } catch (error) {
      console.error(\"Error fetching reservations:\", error);
      toast.error(\"Erreur lors du chargement des réservations\");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    toast.success(\"Déconnexion réussie\");
    navigate(\"/\");
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case \"confirmed\":
        return (
          <span className=\"inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400\">
            <CheckCircle2 size={12} />
            Confirmée
          </span>
        );
      case \"cancelled\":
        return (
          <span className=\"inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-500/20 text-red-400\">
            <XCircle size={12} />
            Annulée
          </span>
        );
      default:
        return (
          <span className=\"inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-amber-500/20 text-amber-400\">
            <AlertCircle size={12} />
            En attente
          </span>
        );
    }
  };

  const durationText = { 30: \"30 min\", 60: \"1h\", 90: \"1h30\" };

  if (authLoading || loading) {
    return (
      <div className=\"min-h-screen pt-24 flex items-center justify-center\">
        <Loader2 className=\"w-8 h-8 text-amber-400 animate-spin\" />
      </div>
    );
  }

  return (
    <div data-testid=\"client-dashboard\" className=\"min-h-screen pt-24 pb-16\">
      <div className=\"max-w-5xl mx-auto px-6\">
        {/* Header *}
        <div className=\"flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8\">
          <div>
            <h1 className=\"text-3xl font-bold text-white font-['Playfair_Display']\">
              Bonjour, <span className=\"text-amber-400\">{user?.name}</span>
            </h1>
            <p className=\"text-slate-400 mt-1\">{user?.email}</p>
          </div>
          <Button
            onClick={handleLogout}
            variant=\"outline\"
            className=\"flex items-center gap-2\"
            data-testid=\"logout-btn\"
          >
            <LogOut size={18} />
            Se déconnecter
          </Button>
        </div>

        {/* Stats *}
        <div className=\"grid grid-cols-2 md:grid-cols-3 gap-4 mb-8\">
          <div className=\"bg-slate-900/50 rounded-xl border border-slate-800 p-4\">
            <p className=\"text-slate-400 text-sm\">Total réservations</p>
            <p className=\"text-2xl font-bold text-white\">{reservations.length}</p>
          </div>
          <div className=\"bg-slate-900/50 rounded-xl border border-slate-800 p-4\">
            <p className=\"text-slate-400 text-sm\">Confirmées</p>
            <p className=\"text-2xl font-bold text-green-400\">
              {reservations.filter(r => r.status === \"confirmed\").length}
            </p>
          </div>
          <div className=\"bg-slate-900/50 rounded-xl border border-slate-800 p-4\">
            <p className=\"text-slate-400 text-sm\">En attente</p>
            <p className=\"text-2xl font-bold text-amber-400\">
              {reservations.filter(r => r.status === \"pending\").length}
            </p>
          </div>
        </div>

        {/* Reservations *}
        <div className=\"bg-slate-900/50 rounded-xl border border-slate-800 p-6\">
          <div className=\"flex justify-between items-center mb-6\">
            <h2 className=\"text-xl font-semibold text-white font-['Playfair_Display']\">
              Mes Réservations
            </h2>
            <Link to=\"/reservation\">
              <Button className=\"bg-amber-400 text-slate-900 hover:bg-amber-300\">
                Nouvelle réservation
              </Button>
            </Link>
          </div>

          {reservations.length === 0 ? (
            <div className=\"text-center py-12\">
              <p className=\"text-slate-400 mb-4\">Vous n'avez pas encore de réservation</p>
              <Link to=\"/escapes\">
                <Button variant=\"outline\">Découvrir nos escapes</Button>
              </Link>
            </div>
          ) : (
            <div className=\"space-y-4\">
              {reservations.map((reservation) => (
                <div
                  key={reservation.id}
                  className=\"bg-slate-800/50 rounded-lg p-4 border border-slate-700\"
                  data-testid={`reservation-${reservation.id}`}
                >
                  <div className=\"flex flex-col md:flex-row justify-between gap-4\">
                    <div className=\"flex-1\">
                      <div className=\"flex items-center gap-3 mb-2\">
                        <h3 className=\"text-white font-medium\">{reservation.escape_title}</h3>
                        {getStatusBadge(reservation.status)}
                      </div>
                      
                      <div className=\"grid grid-cols-2 md:grid-cols-4 gap-3 text-sm\">
                        <div className=\"flex items-center gap-2 text-slate-400\">
                          <Calendar size={14} className=\"text-amber-400\" />
                          {reservation.date}
                        </div>
                        <div className=\"flex items-center gap-2 text-slate-400\">
                          <Clock size={14} className=\"text-amber-400\" />
                          {reservation.time_slot} ({durationText[reservation.duration]})
                        </div>
                        <div className=\"flex items-center gap-2 text-slate-400\">
                          <Users size={14} className=\"text-amber-400\" />
                          {reservation.num_people} pers.
                        </div>
                        <div className=\"flex items-center gap-2 text-slate-400\">
                          <MapPin size={14} className=\"text-amber-400\" />
                          {reservation.client_address.substring(0, 30)}...
                        </div>
                      </div>
                    </div>
                    
                    <div className=\"text-right\">
                      <p className=\"text-2xl font-bold text-amber-400\">{reservation.total_price}€</p>
                      <p className=\"text-slate-500 text-xs\">
                        {reservation.price_per_person}€/pers.
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* RGPD Notice *}
        <div className=\"mt-8 p-4 bg-slate-900/30 rounded-lg border border-slate-800\">
          <p className=\"text-slate-500 text-sm\">
            🔒 <strong>Protection de vos données:</strong> Conformément au RGPD, vos données personnelles 
            sont conservées pendant 2 ans à compter de votre dernière commande, puis automatiquement supprimées.{\" \"}
            <Link to=\"/rgpd\" className=\"text-amber-400 hover:underline\">En savoir plus</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ClientDashboard;
"
Observation: Create successful: /app/frontend/src/pages/ClientDashboard.jsx*/


/* version 2


Maintenant, mettons à jour le dashboard client pour afficher les escapes faits et permettre de laisser des avis :
Action: file_editor create /app/frontend/src/pages/ClientDashboard.jsx --file-text "import { useState, useEffect } from \"react\";
import { useNavigate, Link } from \"react-router-dom\";
import { useAuth } from \"@/contexts/AuthContext\";
import axios from \"axios\";
import { toast } from \"sonner\";
import { Button } from \"@/components/ui/button\";
import { Textarea } from \"@/components/ui/textarea\";
import { Tabs, TabsContent, TabsList, TabsTrigger } from \"@/components/ui/tabs\";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from \"@/components/ui/dialog\";
import { 
  Calendar, 
  Clock, 
  Users, 
  MapPin, 
  LogOut, 
  Loader2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Star,
  MessageSquare,
  History,
  Ticket
} from \"lucide-react\";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ClientDashboard = () => {
  const navigate = useNavigate();
  const { user, logout, loading: authLoading } = useAuth();
  const [reservations, setReservations] = useState([]);
  const [completedEscapes, setCompletedEscapes] = useState([]);
  const [myReviews, setMyReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Review modal state
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState(\"\");
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate(\"/connexion\");
    } else if (!authLoading && user?.is_admin) {
      navigate(\"/admin\");
    } else if (user) {
      fetchAllData();
    }
  }, [user, authLoading, navigate]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [resResponse, completedResponse, reviewsResponse] = await Promise.all([
        axios.get(`${API}/client/reservations`),
        axios.get(`${API}/client/completed-escapes`),
        axios.get(`${API}/client/reviews`)
      ]);
      setReservations(resResponse.data);
      setCompletedEscapes(completedResponse.data);
      setMyReviews(reviewsResponse.data);
    } catch (error) {
      console.error(\"Error fetching data:\", error);
      toast.error(\"Erreur lors du chargement des données\");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    toast.success(\"Déconnexion réussie\");
    navigate(\"/\");
  };

  const openReviewModal = (reservation) => {
    setSelectedReservation(reservation);
    setReviewRating(5);
    setReviewComment(\"\");
    setShowReviewModal(true);
  };

  const submitReview = async () => {
    if (!reviewComment.trim()) {
      toast.error(\"Veuillez écrire un commentaire\");
      return;
    }
    
    setSubmittingReview(true);
    try {
      await axios.post(`${API}/client/reviews`, {
        reservation_id: selectedReservation.id,
        rating: reviewRating,
        comment: reviewComment
      });
      toast.success(\"Merci pour votre avis !\");
      setShowReviewModal(false);
      fetchAllData();
    } catch (error) {
      toast.error(error.response?.data?.detail || \"Erreur lors de l'envoi\");
    } finally {
      setSubmittingReview(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case \"confirmed\":
        return (
          <span className=\"inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400\">
            <CheckCircle2 size={12} />
            Confirmée
          </span>
        );
      case \"cancelled\":
        return (
          <span className=\"inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-500/20 text-red-400\">
            <XCircle size={12} />
            Annulée
          </span>
        );
      default:
        return (
          <span className=\"inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-amber-500/20 text-amber-400\">
            <AlertCircle size={12} />
            En attente
          </span>
        );
    }
  };

  const renderStars = (rating, interactive = false, onSelect = null) => {
    return (
      <div className=\"flex gap-1\">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type=\"button\"
            onClick={() => interactive && onSelect && onSelect(star)}
            className={`${interactive ? \"cursor-pointer hover:scale-110 transition-transform\" : \"cursor-default\"}`}
            disabled={!interactive}
          >
            <Star
              size={interactive ? 28 : 16}
              className={star <= rating ? \"text-amber-400 fill-amber-400\" : \"text-slate-600\"}
            />
          </button>
        ))}
      </div>
    );
  };

  const durationText = { 30: \"30 min\", 60: \"1h\", 90: \"1h30\" };

  if (authLoading || loading) {
    return (
      <div className=\"min-h-screen pt-24 flex items-center justify-center\">
        <Loader2 className=\"w-8 h-8 text-amber-400 animate-spin\" />
      </div>
    );
  }

  return (
    <div data-testid=\"client-dashboard\" className=\"min-h-screen pt-24 pb-16\">
      <div className=\"max-w-5xl mx-auto px-6\">
        {/* Header *}
        <div className=\"flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8\">
          <div>
            <h1 className=\"text-3xl font-bold text-white font-['Playfair_Display']\">
              Bonjour, <span className=\"text-amber-400\">{user?.name}</span>
            </h1>
            <p className=\"text-slate-400 mt-1\">{user?.email}</p>
          </div>
          <Button
            onClick={handleLogout}
            variant=\"outline\"
            className=\"flex items-center gap-2\"
            data-testid=\"logout-btn\"
          >
            <LogOut size={18} />
            Se déconnecter
          </Button>
        </div>

        {/* Stats *}
        <div className=\"grid grid-cols-2 md:grid-cols-4 gap-4 mb-8\">
          <div className=\"bg-slate-900/50 rounded-xl border border-slate-800 p-4\">
            <div className=\"flex items-center gap-2 text-slate-400 text-sm mb-1\">
              <Ticket size={16} />
              Réservations
            </div>
            <p className=\"text-2xl font-bold text-white\">{reservations.length}</p>
          </div>
          <div className=\"bg-slate-900/50 rounded-xl border border-slate-800 p-4\">
            <div className=\"flex items-center gap-2 text-slate-400 text-sm mb-1\">
              <CheckCircle2 size={16} />
              Confirmées
            </div>
            <p className=\"text-2xl font-bold text-green-400\">
              {reservations.filter(r => r.status === \"confirmed\").length}
            </p>
          </div>
          <div className=\"bg-slate-900/50 rounded-xl border border-slate-800 p-4\">
            <div className=\"flex items-center gap-2 text-slate-400 text-sm mb-1\">
              <History size={16} />
              Escapes faits
            </div>
            <p className=\"text-2xl font-bold text-amber-400\">{completedEscapes.length}</p>
          </div>
          <div className=\"bg-slate-900/50 rounded-xl border border-slate-800 p-4\">
            <div className=\"flex items-center gap-2 text-slate-400 text-sm mb-1\">
              <MessageSquare size={16} />
              Avis laissés
            </div>
            <p className=\"text-2xl font-bold text-white\">{myReviews.length}</p>
          </div>
        </div>

        {/* Tabs *}
        <Tabs defaultValue=\"reservations\" className=\"w-full\">
          <TabsList className=\"mb-6\">
            <TabsTrigger value=\"reservations\" className=\"flex items-center gap-2\">
              <Ticket size={16} />
              Mes Réservations
            </TabsTrigger>
            <TabsTrigger value=\"completed\" className=\"flex items-center gap-2\">
              <History size={16} />
              Escapes Réalisés
            </TabsTrigger>
            <TabsTrigger value=\"reviews\" className=\"flex items-center gap-2\">
              <Star size={16} />
              Mes Avis
            </TabsTrigger>
          </TabsList>

          {/* Reservations Tab *}
          <TabsContent value=\"reservations\">
            <div className=\"bg-slate-900/50 rounded-xl border border-slate-800 p-6\">
              <div className=\"flex justify-between items-center mb-6\">
                <h2 className=\"text-xl font-semibold text-white font-['Playfair_Display']\">
                  Toutes mes réservations
                </h2>
                <Link to=\"/reservation\">
                  <Button className=\"bg-amber-400 text-slate-900 hover:bg-amber-300\">
                    Nouvelle réservation
                  </Button>
                </Link>
              </div>

              {reservations.length === 0 ? (
                <div className=\"text-center py-12\">
                  <p className=\"text-slate-400 mb-4\">Vous n'avez pas encore de réservation</p>
                  <Link to=\"/escapes\">
                    <Button variant=\"outline\">Découvrir nos escapes</Button>
                  </Link>
                </div>
              ) : (
                <div className=\"space-y-4\">
                  {reservations.map((reservation) => (
                    <div
                      key={reservation.id}
                      className=\"bg-slate-800/50 rounded-lg p-4 border border-slate-700\"
                      data-testid={`reservation-${reservation.id}`}
                    >
                      <div className=\"flex flex-col md:flex-row justify-between gap-4\">
                        <div className=\"flex-1\">
                          <div className=\"flex items-center gap-3 mb-2\">
                            <h3 className=\"text-white font-medium\">{reservation.escape_title}</h3>
                            {getStatusBadge(reservation.status)}
                          </div>
                          
                          <div className=\"grid grid-cols-2 md:grid-cols-4 gap-3 text-sm\">
                            <div className=\"flex items-center gap-2 text-slate-400\">
                              <Calendar size={14} className=\"text-amber-400\" />
                              {reservation.date}
                            </div>
                            <div className=\"flex items-center gap-2 text-slate-400\">
                              <Clock size={14} className=\"text-amber-400\" />
                              {reservation.time_slot} ({durationText[reservation.duration]})
                            </div>
                            <div className=\"flex items-center gap-2 text-slate-400\">
                              <Users size={14} className=\"text-amber-400\" />
                              {reservation.num_people} pers.
                            </div>
                            <div className=\"flex items-center gap-2 text-slate-400\">
                              <MapPin size={14} className=\"text-amber-400\" />
                              {reservation.client_address.substring(0, 25)}...
                            </div>
                          </div>
                        </div>
                        
                        <div className=\"text-right\">
                          <p className=\"text-2xl font-bold text-amber-400\">{reservation.total_price}€</p>
                          {reservation.status === \"confirmed\" && !reservation.has_review && (
                            <Button
                              size=\"sm\"
                              variant=\"outline\"
                              onClick={() => openReviewModal(reservation)}
                              className=\"mt-2 text-amber-400 border-amber-400/50\"
                              data-testid={`review-btn-${reservation.id}`}
                            >
                              <Star size={14} className=\"mr-1\" />
                              Laisser un avis
                            </Button>
                          )}
                          {reservation.has_review && (
                            <div className=\"mt-2 flex items-center justify-end gap-1\">
                              {renderStars(reservation.review?.rating || 0)}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Completed Escapes Tab *}
          <TabsContent value=\"completed\">
            <div className=\"bg-slate-900/50 rounded-xl border border-slate-800 p-6\">
              <h2 className=\"text-xl font-semibold text-white font-['Playfair_Display'] mb-6\">
                Mes escapes réalisés
              </h2>

              {completedEscapes.length === 0 ? (
                <div className=\"text-center py-12\">
                  <p className=\"text-slate-400 mb-4\">Aucun escape réalisé pour le moment</p>
                  <p className=\"text-slate-500 text-sm\">
                    Vos escapes confirmés apparaîtront ici une fois terminés
                  </p>
                </div>
              ) : (
                <div className=\"grid md:grid-cols-2 gap-4\">
                  {completedEscapes.map((item) => (
                    <div
                      key={item.id}
                      className=\"bg-slate-800/50 rounded-xl overflow-hidden border border-slate-700\"
                      data-testid={`completed-${item.id}`}
                    >
                      {item.escape?.image_url && (
                        <img 
                          src={item.escape.image_url} 
                          alt={item.escape_title}
                          className=\"w-full h-32 object-cover\"
                        />
                      )}
                      <div className=\"p-4\">
                        <div className=\"flex justify-between items-start mb-2\">
                          <div>
                            <h3 className=\"text-white font-medium\">{item.escape_title}</h3>
                            <p className=\"text-slate-400 text-sm\">{item.escape?.theme}</p>
                          </div>
                          <span className=\"px-2 py-1 rounded-full text-xs bg-green-500/20 text-green-400\">
                            Terminé
                          </span>
                        </div>
                        
                        <div className=\"flex items-center gap-4 text-sm text-slate-400 mb-3\">
                          <span className=\"flex items-center gap-1\">
                            <Calendar size={14} />
                            {item.date}
                          </span>
                          <span className=\"flex items-center gap-1\">
                            <Users size={14} />
                            {item.num_people} pers.
                          </span>
                        </div>

                        {item.has_review ? (
                          <div className=\"bg-slate-900/50 rounded-lg p-3\">
                            <div className=\"flex items-center gap-2 mb-2\">
                              {renderStars(item.review.rating)}
                              <span className=\"text-slate-400 text-xs\">Votre avis</span>
                            </div>
                            <p className=\"text-slate-300 text-sm italic\">\"{item.review.comment}\"</p>
                          </div>
                        ) : (
                          <Button
                            size=\"sm\"
                            onClick={() => openReviewModal(item)}
                            className=\"w-full bg-amber-400 text-slate-900 hover:bg-amber-300\"
                            data-testid={`add-review-${item.id}`}
                          >
                            <Star size={14} className=\"mr-2\" />
                            Laisser un avis
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Reviews Tab *}
          <TabsContent value=\"reviews\">
            <div className=\"bg-slate-900/50 rounded-xl border border-slate-800 p-6\">
              <h2 className=\"text-xl font-semibold text-white font-['Playfair_Display'] mb-6\">
                Mes avis
              </h2>

              {myReviews.length === 0 ? (
                <div className=\"text-center py-12\">
                  <p className=\"text-slate-400 mb-4\">Vous n'avez pas encore laissé d'avis</p>
                  <p className=\"text-slate-500 text-sm\">
                    Après un escape confirmé, vous pourrez partager votre expérience
                  </p>
                </div>
              ) : (
                <div className=\"space-y-4\">
                  {myReviews.map((review) => (
                    <div
                      key={review.id}
                      className=\"bg-slate-800/50 rounded-lg p-4 border border-slate-700\"
                    >
                      <div className=\"flex justify-between items-start mb-3\">
                        <div>
                          <h3 className=\"text-white font-medium\">{review.escape_title}</h3>
                          <p className=\"text-slate-500 text-xs\">
                            {new Date(review.created_at).toLocaleDateString(\"fr-FR\")}
                          </p>
                        </div>
                        {renderStars(review.rating)}
                      </div>
                      <p className=\"text-slate-300 italic\">\"{review.comment}\"</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* RGPD Notice *}
        <div className=\"mt-8 p-4 bg-slate-900/30 rounded-lg border border-slate-800\">
          <p className=\"text-slate-500 text-sm\">
            🔒 <strong>Protection de vos données:</strong> Conformément au RGPD, vos données personnelles 
            sont conservées pendant 2 ans à compter de votre dernière commande, puis automatiquement supprimées.{\" \"}
            <Link to=\"/rgpd\" className=\"text-amber-400 hover:underline\">En savoir plus</Link>
          </p>
        </div>
      </div>

      {/* Review Modal *}
      <Dialog open={showReviewModal} onOpenChange={setShowReviewModal}>
        <DialogContent className=\"bg-slate-900 border-slate-800 max-w-md\">
          <DialogHeader>
            <DialogTitle className=\"text-white font-['Playfair_Display']\">
              Laisser un avis
            </DialogTitle>
          </DialogHeader>
          
          {selectedReservation && (
            <div className=\"space-y-6 py-4\">
              <div className=\"text-center\">
                <p className=\"text-slate-400 mb-2\">Votre expérience avec</p>
                <p className=\"text-white text-lg font-medium\">{selectedReservation.escape_title}</p>
              </div>
              
              <div className=\"text-center\">
                <p className=\"text-slate-400 mb-3\">Votre note</p>
                <div className=\"flex justify-center\">
                  {renderStars(reviewRating, true, setReviewRating)}
                </div>
                <p className=\"text-amber-400 mt-2\">
                  {reviewRating === 5 && \"Excellent !\"}
                  {reviewRating === 4 && \"Très bien\"}
                  {reviewRating === 3 && \"Bien\"}
                  {reviewRating === 2 && \"Peut mieux faire\"}
                  {reviewRating === 1 && \"Décevant\"}
                </p>
              </div>
              
              <div>
                <p className=\"text-slate-400 mb-2\">Votre commentaire</p>
                <Textarea
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder=\"Partagez votre expérience...\"
                  className=\"bg-slate-800 border-slate-700 min-h-[120px]\"
                  data-testid=\"review-comment\"
                />
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant=\"outline\" onClick={() => setShowReviewModal(false)}>
              Annuler
            </Button>
            <Button 
              onClick={submitReview}
              disabled={submittingReview}
              className=\"bg-amber-400 text-slate-900 hover:bg-amber-300\"
              data-testid=\"submit-review-btn\"
            >
              {submittingReview ? (
                <Loader2 className=\"w-5 h-5 animate-spin\" />
              ) : (
                <>
                  <Star size={16} className=\"mr-2\" />
                  Publier mon avis
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ClientDashboard;
"
Observation: Overwrite successful: /app/frontend/src/pages/ClientDashboard.jsx*/