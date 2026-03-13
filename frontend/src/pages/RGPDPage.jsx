
/*Action: file_editor create /app/frontend/src/pages/RGPDPage.jsx --file-text "import { Link } from \"react-router-dom\";
import { Shield, Clock, Trash2, Mail, ChevronRight } from \"lucide-react\";

const RGPDPage = () => {
  return (
    <div data-testid=\"rgpd-page\" className=\"min-h-screen pt-24 pb-16\">
      <div className=\"max-w-4xl mx-auto px-6\">
        <div className=\"text-center mb-12\">
          <h1 className=\"text-4xl font-bold text-white font-['Playfair_Display'] mb-4\">
            Politique de <span className=\"text-amber-400\">Confidentialité</span>
          </h1>
          <p className=\"text-slate-400\">
            Conformément au Règlement Général sur la Protection des Données (RGPD)
          </p>
        </div>

        <div className=\"space-y-8\">
          {/* Introduction *}
          <section className=\"bg-slate-900/50 rounded-xl border border-slate-800 p-6\">
            <h2 className=\"text-xl font-semibold text-white mb-4 flex items-center gap-2\">
              <Shield className=\"text-amber-400\" size={24} />
              Protection de vos données
            </h2>
            <p className=\"text-slate-300 leading-relaxed\">
              EthanScape s'engage à protéger la vie privée de ses utilisateurs. Cette politique 
              de confidentialité explique comment nous collectons, utilisons et protégeons vos 
              données personnelles conformément au RGPD (Règlement UE 2016/679).
            </p>
          </section>

          {/* Données collectées *}
          <section className=\"bg-slate-900/50 rounded-xl border border-slate-800 p-6\">
            <h2 className=\"text-xl font-semibold text-white mb-4\">
              1. Données collectées
            </h2>
            <p className=\"text-slate-300 mb-4\">
              Nous collectons uniquement les données nécessaires à la fourniture de nos services :
            </p>
            <ul className=\"space-y-2 text-slate-300\">
              <li className=\"flex items-start gap-2\">
                <ChevronRight size={16} className=\"text-amber-400 mt-1 flex-shrink-0\" />
                <span><strong>Données d'identification :</strong> nom, prénom, adresse email, numéro de téléphone</span>
              </li>
              <li className=\"flex items-start gap-2\">
                <ChevronRight size={16} className=\"text-amber-400 mt-1 flex-shrink-0\" />
                <span><strong>Données de réservation :</strong> adresse de l'événement, date, nombre de participants</span>
              </li>
              <li className=\"flex items-start gap-2\">
                <ChevronRight size={16} className=\"text-amber-400 mt-1 flex-shrink-0\" />
                <span><strong>Données de connexion :</strong> identifiants de compte (si créé)</span>
              </li>
            </ul>
          </section>

          {/* Durée de conservation *}
          <section className=\"bg-amber-400/10 rounded-xl border border-amber-400/30 p-6\">
            <h2 className=\"text-xl font-semibold text-white mb-4 flex items-center gap-2\">
              <Clock className=\"text-amber-400\" size={24} />
              2. Durée de conservation des données
            </h2>
            <div className=\"bg-slate-900/50 rounded-lg p-4 mb-4\">
              <p className=\"text-amber-400 font-semibold text-lg\">
                ⏱️ Vos données sont conservées pendant 2 ans maximum
              </p>
            </div>
            <p className=\"text-slate-300 leading-relaxed\">
              Conformément au RGPD, vos données personnelles sont conservées pendant une durée 
              de <strong className=\"text-white\">2 ans à compter de votre dernière commande</strong>. 
              Passé ce délai, vos données sont <strong className=\"text-white\">automatiquement supprimées</strong> de 
              notre base de données.
            </p>
            <p className=\"text-slate-400 text-sm mt-4\">
              Cette durée nous permet de conserver un historique raisonnable tout en respectant 
              votre droit à l'oubli.
            </p>
          </section>

          {/* Suppression des données *}
          <section className=\"bg-slate-900/50 rounded-xl border border-slate-800 p-6\">
            <h2 className=\"text-xl font-semibold text-white mb-4 flex items-center gap-2\">
              <Trash2 className=\"text-amber-400\" size={24} />
              3. Suppression automatique
            </h2>
            <p className=\"text-slate-300 leading-relaxed mb-4\">
              Notre système effectue régulièrement un nettoyage automatique pour supprimer 
              les comptes clients inactifs depuis plus de 2 ans. Cela inclut :
            </p>
            <ul className=\"space-y-2 text-slate-300\">
              <li className=\"flex items-start gap-2\">
                <span className=\"text-red-400\">•</span>
                <span>Toutes vos informations personnelles (nom, email, téléphone)</span>
              </li>
              <li className=\"flex items-start gap-2\">
                <span className=\"text-red-400\">•</span>
                <span>L'historique de vos réservations</span>
              </li>
              <li className=\"flex items-start gap-2\">
                <span className=\"text-red-400\">•</span>
                <span>Votre compte utilisateur</span>
              </li>
            </ul>
          </section>

          {/* Vos droits *}
          <section className=\"bg-slate-900/50 rounded-xl border border-slate-800 p-6\">
            <h2 className=\"text-xl font-semibold text-white mb-4\">
              4. Vos droits
            </h2>
            <p className=\"text-slate-300 mb-4\">
              Conformément au RGPD, vous disposez des droits suivants :
            </p>
            <div className=\"grid md:grid-cols-2 gap-4\">
              <div className=\"bg-slate-800/50 rounded-lg p-4\">
                <h3 className=\"text-white font-medium mb-2\">Droit d'accès</h3>
                <p className=\"text-slate-400 text-sm\">Obtenir une copie de vos données personnelles</p>
              </div>
              <div className=\"bg-slate-800/50 rounded-lg p-4\">
                <h3 className=\"text-white font-medium mb-2\">Droit de rectification</h3>
                <p className=\"text-slate-400 text-sm\">Corriger vos données inexactes ou incomplètes</p>
              </div>
              <div className=\"bg-slate-800/50 rounded-lg p-4\">
                <h3 className=\"text-white font-medium mb-2\">Droit à l'effacement</h3>
                <p className=\"text-slate-400 text-sm\">Demander la suppression de vos données</p>
              </div>
              <div className=\"bg-slate-800/50 rounded-lg p-4\">
                <h3 className=\"text-white font-medium mb-2\">Droit à la portabilité</h3>
                <p className=\"text-slate-400 text-sm\">Récupérer vos données dans un format lisible</p>
              </div>
            </div>
          </section>

          {/* Contact *}
          <section className=\"bg-slate-900/50 rounded-xl border border-slate-800 p-6\">
            <h2 className=\"text-xl font-semibold text-white mb-4 flex items-center gap-2\">
              <Mail className=\"text-amber-400\" size={24} />
              5. Exercer vos droits
            </h2>
            <p className=\"text-slate-300 mb-4\">
              Pour exercer vos droits ou pour toute question concernant vos données personnelles, 
              contactez-nous :
            </p>
            <div className=\"bg-slate-800/50 rounded-lg p-4\">
              <p className=\"text-white\">
                📧 <a href=\"mailto:ethanscape.servicesclients@gmail.com\" className=\"text-amber-400 hover:underline\">
                  ethanscape.servicesclients@gmail.com
                </a>
              </p>
              <p className=\"text-white mt-2\">
                📞 <a href=\"tel:0659558885\" className=\"text-amber-400 hover:underline\">
                  06 59 55 88 85
                </a>
              </p>
            </div>
            <p className=\"text-slate-400 text-sm mt-4\">
              Nous nous engageons à répondre à votre demande dans un délai de 30 jours.
            </p>
          </section>

          {/* Mise à jour *}
          <section className=\"text-center text-slate-500 text-sm\">
            <p>Dernière mise à jour : Mars 2026</p>
            <p className=\"mt-2\">
              <Link to=\"/\" className=\"text-amber-400 hover:underline\">
                Retour à l'accueil
              </Link>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default RGPDPage;
"
Observation: Create successful: /app/frontend/src/pages/RGPDPage.jsx*/