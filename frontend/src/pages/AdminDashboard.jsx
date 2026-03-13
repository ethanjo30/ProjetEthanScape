
/*Action: file_editor create /app/frontend/src/pages/AdminDashboard.jsx --file-text "import { useState, useEffect } from \"react\";
import { useNavigate } from \"react-router-dom\";
import { useAuth } from \"@/contexts/AuthContext\";
import axios from \"axios\";
import { toast } from \"sonner\";
import { Button } from \"@/components/ui/button\";
import { Input } from \"@/components/ui/input\";
import { Label } from \"@/components/ui/label\";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from \"@/components/ui/select\";
import { 
  LayoutDashboard, 
  Puzzle, 
  Calendar, 
  Users, 
  MessageSquare,
  LogOut, 
  Plus, 
  Edit, 
  Trash2, 
  Loader2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  Shield
} from \"lucide-react\";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user, logout, loading: authLoading } = useAuth();
  
  const [stats, setStats] = useState(null);
  const [escapes, setEscapes] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [clients, setClients] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [showEscapeModal, setShowEscapeModal] = useState(false);
  const [editingEscape, setEditingEscape] = useState(null);
  const [escapeForm, setEscapeForm] = useState({
    title: \"\",
    description: \"\",
    theme: \"\",
    difficulty: 3,
    min_players: 4,
    max_players: 12,
    image_url: \"\"
  });

  useEffect(() => {
    if (!authLoading && (!user || !user.is_admin)) {
      navigate(\"/connexion\");
    } else if (user?.is_admin) {
      fetchAllData();
    }
  }, [user, authLoading, navigate]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [statsRes, escapesRes, reservationsRes, clientsRes, contactsRes] = await Promise.all([
        axios.get(`${API}/admin/stats`),
        axios.get(`${API}/admin/escapes`),
        axios.get(`${API}/admin/reservations`),
        axios.get(`${API}/admin/clients`),
        axios.get(`${API}/admin/contacts`)
      ]);
      
      setStats(statsRes.data);
      setEscapes(escapesRes.data);
      setReservations(reservationsRes.data);
      setClients(clientsRes.data);
      setContacts(contactsRes.data);
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

  // Escape CRUD
  const openEscapeModal = (escape = null) => {
    if (escape) {
      setEditingEscape(escape);
      setEscapeForm({
        title: escape.title,
        description: escape.description,
        theme: escape.theme,
        difficulty: escape.difficulty,
        min_players: escape.min_players,
        max_players: escape.max_players,
        image_url: escape.image_url
      });
    } else {
      setEditingEscape(null);
      setEscapeForm({
        title: \"\",
        description: \"\",
        theme: \"\",
        difficulty: 3,
        min_players: 4,
        max_players: 12,
        image_url: \"\"
      });
    }
    setShowEscapeModal(true);
  };

  const saveEscape = async () => {
    try {
      if (editingEscape) {
        await axios.put(`${API}/admin/escapes/${editingEscape.id}`, escapeForm);
        toast.success(\"Escape modifié avec succès\");
      } else {
        await axios.post(`${API}/admin/escapes`, escapeForm);
        toast.success(\"Escape créé avec succès\");
      }
      setShowEscapeModal(false);
      fetchAllData();
    } catch (error) {
      toast.error(error.response?.data?.detail || \"Erreur lors de la sauvegarde\");
    }
  };

  const deleteEscape = async (escapeId) => {
    if (!confirm(\"Supprimer cet escape ?\")) return;
    
    try {
      await axios.delete(`${API}/admin/escapes/${escapeId}`);
      toast.success(\"Escape supprimé\");
      fetchAllData();
    } catch (error) {
      toast.error(\"Erreur lors de la suppression\");
    }
  };

  const toggleEscapeStatus = async (escape) => {
    try {
      await axios.put(`${API}/admin/escapes/${escape.id}`, { is_active: !escape.is_active });
      toast.success(escape.is_active ? \"Escape désactivé\" : \"Escape activé\");
      fetchAllData();
    } catch (error) {
      toast.error(\"Erreur lors de la mise à jour\");
    }
  };

  // Reservation status
  const updateReservationStatus = async (reservationId, status) => {
    try {
      await axios.put(`${API}/admin/reservations/${reservationId}/status?status=${status}`);
      toast.success(\"Statut mis à jour\");
      fetchAllData();
    } catch (error) {
      toast.error(\"Erreur lors de la mise à jour\");
    }
  };

  // Delete client
  const deleteClient = async (clientId) => {
    if (!confirm(\"Supprimer ce client ?\")) return;
    
    try {
      await axios.delete(`${API}/admin/clients/${clientId}`);
      toast.success(\"Client supprimé\");
      fetchAllData();
    } catch (error) {
      toast.error(\"Erreur lors de la suppression\");
    }
  };

  // RGPD Cleanup
  const cleanupOldClients = async () => {
    if (!confirm(\"Supprimer tous les clients sans commande depuis 2 ans ?\")) return;
    
    try {
      const response = await axios.post(`${API}/admin/cleanup-old-clients`);
      toast.success(response.data.message);
      fetchAllData();
    } catch (error) {
      toast.error(\"Erreur lors du nettoyage\");
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case \"confirmed\":
        return <span className=\"px-2 py-1 rounded-full text-xs bg-green-500/20 text-green-400\">Confirmée</span>;
      case \"cancelled\":
        return <span className=\"px-2 py-1 rounded-full text-xs bg-red-500/20 text-red-400\">Annulée</span>;
      default:
        return <span className=\"px-2 py-1 rounded-full text-xs bg-amber-500/20 text-amber-400\">En attente</span>;
    }
  };

  if (authLoading || loading) {
    return (
      <div className=\"min-h-screen pt-24 flex items-center justify-center\">
        <Loader2 className=\"w-8 h-8 text-amber-400 animate-spin\" />
      </div>
    );
  }

  return (
    <div data-testid=\"admin-dashboard\" className=\"min-h-screen pt-20 pb-16 bg-slate-950\">
      <div className=\"max-w-7xl mx-auto px-4\">
        {/* Header *}
        <div className=\"flex justify-between items-center mb-6 py-4\">
          <div className=\"flex items-center gap-3\">
            <Shield className=\"text-amber-400\" size={28} />
            <h1 className=\"text-2xl font-bold text-white font-['Playfair_Display']\">
              Administration
            </h1>
          </div>
          <div className=\"flex items-center gap-3\">
            <Button onClick={fetchAllData} variant=\"outline\" size=\"sm\">
              <RefreshCw size={16} />
            </Button>
            <Button onClick={handleLogout} variant=\"outline\" size=\"sm\" className=\"flex items-center gap-2\">
              <LogOut size={16} />
              Déconnexion
            </Button>
          </div>
        </div>

        {/* Stats *}
        {stats && (
          <div className=\"grid grid-cols-2 md:grid-cols-4 gap-4 mb-6\">
            <div className=\"bg-slate-900/50 rounded-xl border border-slate-800 p-4\">
              <div className=\"flex items-center gap-2 text-slate-400 text-sm mb-1\">
                <Puzzle size={16} />
                Escapes
              </div>
              <p className=\"text-2xl font-bold text-white\">{stats.escapes.active}/{stats.escapes.total}</p>
            </div>
            <div className=\"bg-slate-900/50 rounded-xl border border-slate-800 p-4\">
              <div className=\"flex items-center gap-2 text-slate-400 text-sm mb-1\">
                <Calendar size={16} />
                Réservations
              </div>
              <p className=\"text-2xl font-bold text-white\">{stats.reservations.total}</p>
              <p className=\"text-amber-400 text-xs\">{stats.reservations.pending} en attente</p>
            </div>
            <div className=\"bg-slate-900/50 rounded-xl border border-slate-800 p-4\">
              <div className=\"flex items-center gap-2 text-slate-400 text-sm mb-1\">
                <Users size={16} />
                Clients
              </div>
              <p className=\"text-2xl font-bold text-white\">{stats.clients}</p>
            </div>
            <div className=\"bg-slate-900/50 rounded-xl border border-slate-800 p-4\">
              <div className=\"flex items-center gap-2 text-slate-400 text-sm mb-1\">
                <MessageSquare size={16} />
                Messages
              </div>
              <p className=\"text-2xl font-bold text-white\">{stats.contacts}</p>
            </div>
          </div>
        )}

        {/* Tabs *}
        <Tabs defaultValue=\"escapes\" className=\"w-full\">
          <TabsList className=\"mb-6\">
            <TabsTrigger value=\"escapes\" className=\"flex items-center gap-2\">
              <Puzzle size={16} />
              Escapes
            </TabsTrigger>
            <TabsTrigger value=\"reservations\" className=\"flex items-center gap-2\">
              <Calendar size={16} />
              Réservations
            </TabsTrigger>
            <TabsTrigger value=\"clients\" className=\"flex items-center gap-2\">
              <Users size={16} />
              Clients
            </TabsTrigger>
            <TabsTrigger value=\"contacts\" className=\"flex items-center gap-2\">
              <MessageSquare size={16} />
              Messages
            </TabsTrigger>
          </TabsList>

          {/* Escapes Tab *}
          <TabsContent value=\"escapes\">
            <div className=\"bg-slate-900/50 rounded-xl border border-slate-800 p-4\">
              <div className=\"flex justify-between items-center mb-4\">
                <h2 className=\"text-lg font-semibold text-white\">Gestion des Escapes</h2>
                <Button 
                  onClick={() => openEscapeModal()} 
                  className=\"bg-amber-400 text-slate-900 hover:bg-amber-300\"
                  data-testid=\"add-escape-btn\"
                >
                  <Plus size={16} className=\"mr-2\" />
                  Ajouter
                </Button>
              </div>
              
              <div className=\"overflow-x-auto\">
                <table className=\"w-full text-sm\">
                  <thead>
                    <tr className=\"border-b border-slate-700\">
                      <th className=\"text-left py-3 px-2 text-slate-400\">Image</th>
                      <th className=\"text-left py-3 px-2 text-slate-400\">Titre</th>
                      <th className=\"text-left py-3 px-2 text-slate-400\">Thème</th>
                      <th className=\"text-left py-3 px-2 text-slate-400\">Difficulté</th>
                      <th className=\"text-left py-3 px-2 text-slate-400\">Joueurs</th>
                      <th className=\"text-left py-3 px-2 text-slate-400\">Statut</th>
                      <th className=\"text-right py-3 px-2 text-slate-400\">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {escapes.map((escape) => (
                      <tr key={escape.id} className=\"border-b border-slate-800\">
                        <td className=\"py-3 px-2\">
                          <img src={escape.image_url} alt=\"\" className=\"w-16 h-10 object-cover rounded\" />
                        </td>
                        <td className=\"py-3 px-2 text-white\">{escape.title}</td>
                        <td className=\"py-3 px-2 text-slate-300\">{escape.theme}</td>
                        <td className=\"py-3 px-2 text-amber-400\">{\"🔒\".repeat(escape.difficulty)}</td>
                        <td className=\"py-3 px-2 text-slate-300\">{escape.min_players}-{escape.max_players}</td>
                        <td className=\"py-3 px-2\">
                          <button
                            onClick={() => toggleEscapeStatus(escape)}
                            className={`px-2 py-1 rounded-full text-xs ${
                              escape.is_active ? \"bg-green-500/20 text-green-400\" : \"bg-red-500/20 text-red-400\"
                            }`}
                          >
                            {escape.is_active ? \"Actif\" : \"Inactif\"}
                          </button>
                        </td>
                        <td className=\"py-3 px-2 text-right\">
                          <Button 
                            variant=\"ghost\" 
                            size=\"sm\" 
                            onClick={() => openEscapeModal(escape)}
                            data-testid={`edit-escape-${escape.id}`}
                          >
                            <Edit size={16} />
                          </Button>
                          <Button 
                            variant=\"ghost\" 
                            size=\"sm\" 
                            onClick={() => deleteEscape(escape.id)}
                            className=\"text-red-400 hover:text-red-300\"
                            data-testid={`delete-escape-${escape.id}`}
                          >
                            <Trash2 size={16} />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>

          {/* Reservations Tab *}
          <TabsContent value=\"reservations\">
            <div className=\"bg-slate-900/50 rounded-xl border border-slate-800 p-4\">
              <h2 className=\"text-lg font-semibold text-white mb-4\">Toutes les Réservations</h2>
              
              <div className=\"overflow-x-auto\">
                <table className=\"w-full text-sm\">
                  <thead>
                    <tr className=\"border-b border-slate-700\">
                      <th className=\"text-left py-3 px-2 text-slate-400\">Date</th>
                      <th className=\"text-left py-3 px-2 text-slate-400\">Client</th>
                      <th className=\"text-left py-3 px-2 text-slate-400\">Escape</th>
                      <th className=\"text-left py-3 px-2 text-slate-400\">Détails</th>
                      <th className=\"text-left py-3 px-2 text-slate-400\">Prix</th>
                      <th className=\"text-left py-3 px-2 text-slate-400\">Statut</th>
                      <th className=\"text-right py-3 px-2 text-slate-400\">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reservations.map((res) => (
                      <tr key={res.id} className=\"border-b border-slate-800\">
                        <td className=\"py-3 px-2 text-white\">{res.date} {res.time_slot}</td>
                        <td className=\"py-3 px-2\">
                          <p className=\"text-white\">{res.client_name}</p>
                          <p className=\"text-slate-500 text-xs\">{res.client_email}</p>
                        </td>
                        <td className=\"py-3 px-2 text-slate-300\">{res.escape_title}</td>
                        <td className=\"py-3 px-2 text-slate-300\">
                          {res.num_people} pers. / {res.duration}min
                        </td>
                        <td className=\"py-3 px-2 text-amber-400 font-semibold\">{res.total_price}€</td>
                        <td className=\"py-3 px-2\">{getStatusBadge(res.status)}</td>
                        <td className=\"py-3 px-2 text-right\">
                          <Select
                            value={res.status}
                            onValueChange={(value) => updateReservationStatus(res.id, value)}
                          >
                            <SelectTrigger className=\"w-28 h-8 text-xs\">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value=\"pending\">En attente</SelectItem>
                              <SelectItem value=\"confirmed\">Confirmée</SelectItem>
                              <SelectItem value=\"cancelled\">Annulée</SelectItem>
                            </SelectContent>
                          </Select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>

          {/* Clients Tab *}
          <TabsContent value=\"clients\">
            <div className=\"bg-slate-900/50 rounded-xl border border-slate-800 p-4\">
              <div className=\"flex justify-between items-center mb-4\">
                <h2 className=\"text-lg font-semibold text-white\">Gestion des Clients</h2>
                <Button 
                  onClick={cleanupOldClients} 
                  variant=\"outline\"
                  size=\"sm\"
                  className=\"text-red-400 border-red-400/50 hover:bg-red-400/10\"
                >
                  🗑️ Nettoyage RGPD (2 ans)
                </Button>
              </div>
              
              <div className=\"overflow-x-auto\">
                <table className=\"w-full text-sm\">
                  <thead>
                    <tr className=\"border-b border-slate-700\">
                      <th className=\"text-left py-3 px-2 text-slate-400\">Nom</th>
                      <th className=\"text-left py-3 px-2 text-slate-400\">Email</th>
                      <th className=\"text-left py-3 px-2 text-slate-400\">Téléphone</th>
                      <th className=\"text-left py-3 px-2 text-slate-400\">Inscrit le</th>
                      <th className=\"text-left py-3 px-2 text-slate-400\">Dernière commande</th>
                      <th className=\"text-right py-3 px-2 text-slate-400\">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clients.map((client) => (
                      <tr key={client.id} className=\"border-b border-slate-800\">
                        <td className=\"py-3 px-2 text-white\">{client.name}</td>
                        <td className=\"py-3 px-2 text-slate-300\">{client.email}</td>
                        <td className=\"py-3 px-2 text-slate-300\">{client.phone || \"-\"}</td>
                        <td className=\"py-3 px-2 text-slate-300\">
                          {new Date(client.created_at).toLocaleDateString(\"fr-FR\")}
                        </td>
                        <td className=\"py-3 px-2 text-slate-300\">
                          {client.last_order_at 
                            ? new Date(client.last_order_at).toLocaleDateString(\"fr-FR\")
                            : \"-\"
                          }
                        </td>
                        <td className=\"py-3 px-2 text-right\">
                          <Button 
                            variant=\"ghost\" 
                            size=\"sm\" 
                            onClick={() => deleteClient(client.id)}
                            className=\"text-red-400 hover:text-red-300\"
                          >
                            <Trash2 size={16} />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>

          {/* Contacts Tab *}
          <TabsContent value=\"contacts\">
            <div className=\"bg-slate-900/50 rounded-xl border border-slate-800 p-4\">
              <h2 className=\"text-lg font-semibold text-white mb-4\">Messages de Contact</h2>
              
              <div className=\"space-y-4\">
                {contacts.map((contact) => (
                  <div key={contact.id} className=\"bg-slate-800/50 rounded-lg p-4 border border-slate-700\">
                    <div className=\"flex justify-between items-start mb-2\">
                      <div>
                        <p className=\"text-white font-medium\">{contact.name}</p>
                        <p className=\"text-slate-400 text-sm\">{contact.email} • {contact.phone || \"Pas de tél.\"}</p>
                      </div>
                      <p className=\"text-slate-500 text-xs\">
                        {new Date(contact.created_at).toLocaleDateString(\"fr-FR\")}
                      </p>
                    </div>
                    <p className=\"text-amber-400 text-sm font-medium mb-2\">{contact.subject}</p>
                    <p className=\"text-slate-300 text-sm\">{contact.message}</p>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Escape Modal *}
      <Dialog open={showEscapeModal} onOpenChange={setShowEscapeModal}>
        <DialogContent className=\"bg-slate-900 border-slate-800 max-w-lg\">
          <DialogHeader>
            <DialogTitle className=\"text-white\">
              {editingEscape ? \"Modifier l'escape\" : \"Nouvel escape\"}
            </DialogTitle>
          </DialogHeader>
          
          <div className=\"space-y-4 py-4\">
            <div>
              <Label className=\"text-white\">Titre *</Label>
              <Input
                value={escapeForm.title}
                onChange={(e) => setEscapeForm({...escapeForm, title: e.target.value})}
                className=\"bg-slate-800 border-slate-700 mt-1\"
                data-testid=\"escape-title-input\"
              />
            </div>
            
            <div>
              <Label className=\"text-white\">Description *</Label>
              <Textarea
                value={escapeForm.description}
                onChange={(e) => setEscapeForm({...escapeForm, description: e.target.value})}
                className=\"bg-slate-800 border-slate-700 mt-1 min-h-[100px]\"
                data-testid=\"escape-description-input\"
              />
            </div>
            
            <div className=\"grid grid-cols-2 gap-4\">
              <div>
                <Label className=\"text-white\">Thème *</Label>
                <Input
                  value={escapeForm.theme}
                  onChange={(e) => setEscapeForm({...escapeForm, theme: e.target.value})}
                  className=\"bg-slate-800 border-slate-700 mt-1\"
                  placeholder=\"Ex: Horreur, Aventure...\"
                  data-testid=\"escape-theme-input\"
                />
              </div>
              <div>
                <Label className=\"text-white\">Difficulté (1-5)</Label>
                <Input
                  type=\"number\"
                  min={1}
                  max={5}
                  value={escapeForm.difficulty}
                  onChange={(e) => setEscapeForm({...escapeForm, difficulty: Number(e.target.value)})}
                  className=\"bg-slate-800 border-slate-700 mt-1\"
                  data-testid=\"escape-difficulty-input\"
                />
              </div>
            </div>
            
            <div className=\"grid grid-cols-2 gap-4\">
              <div>
                <Label className=\"text-white\">Joueurs min</Label>
                <Input
                  type=\"number\"
                  min={1}
                  value={escapeForm.min_players}
                  onChange={(e) => setEscapeForm({...escapeForm, min_players: Number(e.target.value)})}
                  className=\"bg-slate-800 border-slate-700 mt-1\"
                />
              </div>
              <div>
                <Label className=\"text-white\">Joueurs max</Label>
                <Input
                  type=\"number\"
                  min={1}
                  value={escapeForm.max_players}
                  onChange={(e) => setEscapeForm({...escapeForm, max_players: Number(e.target.value)})}
                  className=\"bg-slate-800 border-slate-700 mt-1\"
                />
              </div>
            </div>
            
            <div>
              <Label className=\"text-white\">URL de l'image *</Label>
              <Input
                value={escapeForm.image_url}
                onChange={(e) => setEscapeForm({...escapeForm, image_url: e.target.value})}
                className=\"bg-slate-800 border-slate-700 mt-1\"
                placeholder=\"https://...\"
                data-testid=\"escape-image-input\"
              />
              {escapeForm.image_url && (
                <img src={escapeForm.image_url} alt=\"Preview\" className=\"mt-2 h-24 object-cover rounded\" />
              )}
            </div>
          </div>
          
          <DialogFooter>
            <Button variant=\"outline\" onClick={() => setShowEscapeModal(false)}>
              Annuler
            </Button>
            <Button 
              onClick={saveEscape} 
              className=\"bg-amber-400 text-slate-900 hover:bg-amber-300\"
              data-testid=\"save-escape-btn\"
            >
              {editingEscape ? \"Modifier\" : \"Créer\"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDashboard;
"
Observation: Create successful: /app/frontend/src/pages/AdminDashboard.jsx*/