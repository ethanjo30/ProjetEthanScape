import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import EscapeCard from "@/components/EscapeCard";
import { Filter, Search, Loader2 } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const EscapesPage = () => {
  const [escapes, setEscapes] = useState([]);
  const [themes, setThemes] = useState([]);
  const [selectedTheme, setSelectedTheme] = useState("all");
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchThemes();
  }, []);

  useEffect(() => {
    fetchEscapes();
  }, [selectedTheme]);

  const fetchThemes = async () => {
    try {
      const response = await axios.get(`${API}/themes`);
      setThemes(response.data.themes || []);
    } catch (error) {
      console.error("Error fetching themes:", error);
    }
  };

  const fetchEscapes = async () => {
    setLoading(true);
    try {
      const url = selectedTheme === "all" 
        ? `${API}/escapes` 
        : `${API}/escapes?theme=${encodeURIComponent(selectedTheme)}`;
      const response = await axios.get(url);
      setEscapes(response.data);
    } catch (error) {
      console.error("Error fetching escapes:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredEscapes = escapes.filter(escape => 
    escape.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    escape.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div data-testid="escapes-page" className="min-h-screen pt-24 pb-16">
      {/* Header */}
      <section className="py-12 bg-gradient-to-b from-slate-900 to-slate-950">
        <div className="max-w-7xl mx-auto px-6">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 font-['Playfair_Display'] text-center">
            Nos <span className="text-amber-400">Escapes</span>
          </h1>
          <p className="text-slate-400 text-center max-w-2xl mx-auto">
            Explorez nos différents thèmes et trouvez l'aventure qui vous correspond. 
            Chaque escape est personnalisable selon vos envies.
          </p>
        </div>
      </section>

      {/* Filters */}
      <section className="py-8 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Search */}
            <div className="relative w-full md:w-80">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input
                type="text"
                placeholder="Rechercher un escape..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                data-testid="search-input"
                className="w-full pl-12 pr-4 py-3 bg-slate-900/50 border border-slate-800 rounded-full text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition-colors"
              />
            </div>

            {/* Theme Filters */}
            <div className="flex items-center gap-2 flex-wrap justify-center">
              <Filter size={18} className="text-slate-500 hidden md:block" />
              <button
                onClick={() => setSelectedTheme("all")}
                data-testid="filter-all"
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  selectedTheme === "all"
                    ? "bg-amber-400 text-slate-900"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
              >
                Tous
              </button>
              {themes.map((theme) => (
                <button
                  key={theme}
                  onClick={() => setSelectedTheme(theme)}
                  data-testid={`filter-${theme.toLowerCase()}`}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    selectedTheme === theme
                      ? "bg-amber-400 text-slate-900"
                      : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                  }`}
                >
                  {theme}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Escapes Grid */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-6">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
            </div>
          ) : filteredEscapes.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-slate-400 text-lg mb-4">Aucun escape trouvé</p>
              <button
                onClick={() => {
                  setSelectedTheme("all");
                  setSearchQuery("");
                }}
                className="text-amber-400 hover:underline"
              >
                Réinitialiser les filtres
              </button>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredEscapes.map((escape) => (
                <EscapeCard key={escape.id} escape={escape} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="p-8 md:p-12 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4 font-['Playfair_Display']">
              Vous ne trouvez pas votre thème ?
            </h2>
            <p className="text-slate-400 mb-6">
              Contactez-nous pour créer un escape game sur mesure !
            </p>
            <Link
              to="/contact"
              data-testid="contact-custom-theme"
              className="inline-flex items-center gap-2 bg-amber-400 text-slate-900 px-8 py-3 rounded-full font-semibold hover:bg-amber-300 transition-all"
            >
              Nous contacter
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default EscapesPage;