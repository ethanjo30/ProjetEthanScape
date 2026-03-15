import { Link } from "react-router-dom";
import SpotlightCard from "./SpotlightCard";
import { Lock, Users, Clock } from "lucide-react";

const EscapeCard = ({ escape }) => {
  if (!escape) return null;

  const difficultyLocks = Array(5).fill(0).map((_, i) => (
    <Lock 
      key={i} 
      size={14} 
      className={i < escape.difficulty ? "text-amber-400" : "text-slate-600"} 
      fill={i < escape.difficulty ? "currentColor" : "none"}
    />
  ));

  return (
    <SpotlightCard className="group relative overflow-hidden rounded-xl border border-slate-800 bg-slate-900/50 transition-all duration-300 hover:border-amber-400/50 h-[400px]">
  {/* 1. L'IMAGE (Prend toute la place) */}
  <div className="absolute inset-0">
    <img
      src={escape.image_url} // Vérifie bien que c'est image_url et pas image
      alt={escape.title}
      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
    />
  </div>

  {/* 2. LE FILTRE SOMBRE UNIQUE (Dégradé du bas vers le haut) */}
  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/80 to-transparent opacity-90" />

  {/* 3. LE CONTENU TEXTUEL (Positionné en bas) */}
  <div className="absolute inset-0 p-6 flex flex-col justify-end z-10">
    <div className="mb-2">
       <span className="text-amber-400 text-[10px] font-bold uppercase tracking-widest bg-amber-400/10 px-2 py-1 rounded">
         {escape.category || "Escape"}
       </span>
    </div>
    
    <h3 className="text-2xl font-bold text-white mb-2 font-display">
      {escape.title}
    </h3>
    
    <p className="text-slate-300 text-sm line-clamp-2 mb-4">
      {escape.description}
    </p>

    <div className="flex items-center justify-between pt-4 border-t border-white/10">
      <span className="text-white/70 text-xs flex items-center gap-2">
        <Users size={14} className="text-amber-400" />
        {escape.players || "4-12"} joueurs
      </span>
      <span className="text-amber-400 text-xs font-bold">Voir plus →</span>
    </div>
    <Link
          to={`/reservation?escape=${escape.id}`}
          data-testid={`book-escape-${escape.id}`}
          className="block w-full text-center bg-amber-400 text-slate-900 py-2.5 rounded-full font-semibold text-sm hover:bg-amber-300 transition-all opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0"
        >
          Réserver
        </Link>
  </div>
</SpotlightCard>
  );
};

export default EscapeCard;