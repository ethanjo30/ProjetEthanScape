
Action: file_editor create /app/frontend/src/components/EscapeCard.jsx --file-text "import { Link } from \"react-router-dom\";
import SpotlightCard from \"@/components/SpotlightCard\";
import { Lock, Users, Clock } from \"lucide-react\";

const EscapeCard = ({ escape }) => {
  const difficultyLocks = Array(5).fill(0).map((_, i) => (
    <Lock 
      key={i} 
      size={14} 
      className={i < escape.difficulty ? \"text-amber-400\" : \"text-slate-600\"} 
      fill={i < escape.difficulty ? \"currentColor\" : \"none\"}
    />
  ));

  return (
    <SpotlightCard className=\"group relative overflow-hidden rounded-xl border border-slate-800 bg-slate-900/50 hover:bg-slate-800/80 transition-all duration-300 hover:border-amber-400/50\">
      <div className=\"aspect-[4/3] overflow-hidden\">
        <img
          src={escape.image_url}
          alt={escape.title}
          className=\"w-full h-full object-cover transition-transform duration-500 group-hover:scale-110\"
        />
        <div className=\"absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/20 to-transparent\" />
      </div>
      
      <div className=\"absolute bottom-0 left-0 right-0 p-6\">
        <span className=\"inline-block px-3 py-1 text-xs font-medium bg-amber-400/20 text-amber-400 rounded-full mb-3\">
          {escape.theme}
        </span>
        
        <h3 className=\"text-xl font-bold text-white mb-2 font-['Playfair_Display']\">
          {escape.title}
        </h3>
        
        <p className=\"text-slate-400 text-sm line-clamp-2 mb-4\">
          {escape.description}
        </p>
        
        <div className=\"flex items-center justify-between mb-4\">
          <div className=\"flex items-center gap-1\" data-testid={`difficulty-${escape.id}`}>
            {difficultyLocks}
          </div>
          
          <div className=\"flex items-center gap-3 text-slate-400 text-xs\">
            <span className=\"flex items-center gap-1\">
              <Users size={14} />
              {escape.min_players}-{escape.max_players}
            </span>
          </div>
        </div>
        
        <Link
          to={`/reservation?escape=${escape.id}`}
          data-testid={`book-escape-${escape.id}`}
          className=\"block w-full text-center bg-amber-400 text-slate-900 py-2.5 rounded-full font-semibold text-sm hover:bg-amber-300 transition-all opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0\"
        >
          Réserver
        </Link>
      </div>
    </SpotlightCard>
  );
};

export default EscapeCard;
"
Observation: Create successful: /app/frontend/src/components/EscapeCard.jsx