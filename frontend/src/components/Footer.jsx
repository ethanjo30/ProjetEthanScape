
Action: file_editor create /app/frontend/src/components/Footer.jsx --file-text "import { Link } from \"react-router-dom\";
import { Facebook, Instagram, Phone, Mail, MapPin } from \"lucide-react\";

const LOGO_URL = \"https://customer-assets.emergentagent.com/job_b18ee068-afca-4c96-adc4-5e2cfca2adc0/artifacts/fltpid2d_logo%20ethan%20scape.png\";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer data-testid=\"footer\" className=\"bg-slate-950 border-t border-slate-800\">
      <div className=\"max-w-7xl mx-auto px-6 py-16\">
        <div className=\"grid grid-cols-1 md:grid-cols-4 gap-12\">
          {/* Brand */}
          <div className=\"md:col-span-1\">
            <img 
              src={LOGO_URL} 
              alt=\"EthanScape\" 
              className=\"h-16 w-auto invert mb-4\"
            />
            <p className=\"text-slate-400 text-sm leading-relaxed\">
              L'escape game qui vient à vous. Des aventures immersives directement chez vous.
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h4 className=\"font-semibold text-white mb-4\">Navigation</h4>
            <ul className=\"space-y-3\">
              <li>
                <Link 
                  to=\"/\" 
                  data-testid=\"footer-link-accueil\"
                  className=\"text-slate-400 hover:text-amber-400 transition-colors text-sm\"
                >
                  Accueil
                </Link>
              </li>
              <li>
                <Link 
                  to=\"/escapes\" 
                  data-testid=\"footer-link-escapes\"
                  className=\"text-slate-400 hover:text-amber-400 transition-colors text-sm\"
                >
                  Nos Escapes
                </Link>
              </li>
              <li>
                <Link 
                  to=\"/reservation\" 
                  data-testid=\"footer-link-reservation\"
                  className=\"text-slate-400 hover:text-amber-400 transition-colors text-sm\"
                >
                  Réservation
                </Link>
              </li>
              <li>
                <Link 
                  to=\"/contact\" 
                  data-testid=\"footer-link-contact\"
                  className=\"text-slate-400 hover:text-amber-400 transition-colors text-sm\"
                >
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className=\"font-semibold text-white mb-4\">Contact</h4>
            <ul className=\"space-y-3\">
              <li className=\"flex items-center gap-3 text-slate-400 text-sm\">
                <Phone size={16} className=\"text-amber-400\" />
                <a 
                  href=\"tel:0659558885\" 
                  data-testid=\"footer-phone\"
                  className=\"hover:text-amber-400 transition-colors\"
                >
                  06 59 55 88 85
                </a>
              </li>
              <li className=\"flex items-center gap-3 text-slate-400 text-sm\">
                <Mail size={16} className=\"text-amber-400\" />
                <a 
                  href=\"mailto:ethanscape.servicesclients@gmail.com\"
                  data-testid=\"footer-email\"
                  className=\"hover:text-amber-400 transition-colors\"
                >
                  ethanscape.servicesclients@gmail.com
                </a>
              </li>
              <li className=\"flex items-start gap-3 text-slate-400 text-sm\">
                <MapPin size={16} className=\"text-amber-400 mt-0.5\" />
                <span>Service à domicile dans toute la France</span>
              </li>
            </ul>
          </div>

          {/* Social */}
          <div>
            <h4 className=\"font-semibold text-white mb-4\">Suivez-nous</h4>
            <div className=\"flex gap-4\">
              <a
                href=\"https://www.facebook.com/profile.php?id=61571650601439\"
                target=\"_blank\"
                rel=\"noopener noreferrer\"
                data-testid=\"footer-facebook\"
                className=\"w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:bg-amber-400 hover:text-slate-900 transition-all\"
              >
                <Facebook size={20} />
              </a>
              <a
                href=\"https://www.instagram.com/ethan_scape_officiel/\"
                target=\"_blank\"
                rel=\"noopener noreferrer\"
                data-testid=\"footer-instagram\"
                className=\"w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:bg-amber-400 hover:text-slate-900 transition-all\"
              >
                <Instagram size={20} />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className=\"mt-12 pt-8 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4\">
          <p className=\"text-slate-500 text-sm\">
            © {currentYear} EthanScape. Tous droits réservés.
          </p>
          <p className=\"text-slate-600 text-xs\">
            L'aventure commence chez vous
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
"
Observation: Create successful: /app/frontend/src/components/Footer.jsx