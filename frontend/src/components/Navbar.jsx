
Action: file_editor create /app/frontend/src/components/Navbar.jsx --file-text "import { useState, useEffect } from \"react\";
import { Link, useLocation } from \"react-router-dom\";
import { Menu, X } from \"lucide-react\";

const LOGO_URL = \"https://customer-assets.emergentagent.com/job_b18ee068-afca-4c96-adc4-5e2cfca2adc0/artifacts/fltpid2d_logo%20ethan%20scape.png\";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener(\"scroll\", handleScroll);
    return () => window.removeEventListener(\"scroll\", handleScroll);
  }, []);

  const navLinks = [
    { path: \"/\", label: \"Accueil\" },
    { path: \"/escapes\", label: \"Nos Escapes\" },
    { path: \"/reservation\", label: \"Réserver\" },
    { path: \"/contact\", label: \"Contact\" },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <nav
      data-testid=\"navbar\"
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? \"glass py-3\" : \"bg-transparent py-5\"
      }`}
    >
      <div className=\"max-w-7xl mx-auto px-6 flex items-center justify-between\">
        {/* Logo */}
        <Link to=\"/\" className=\"flex items-center gap-3\" data-testid=\"navbar-logo\">
          <img 
            src={LOGO_URL} 
            alt=\"EthanScape\" 
            className=\"h-12 w-auto invert\"
          />
        </Link>

        {/* Desktop Navigation */}
        <div className=\"hidden md:flex items-center gap-8\">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              data-testid={`nav-link-${link.label.toLowerCase().replace(/\s+/g, '-')}`}
              className={`text-sm font-medium transition-all duration-300 hover:text-amber-400 ${
                isActive(link.path) 
                  ? \"text-amber-400\" 
                  : \"text-slate-300\"
              }`}
            >
              {link.label}
            </Link>
          ))}
          <Link
            to=\"/reservation\"
            data-testid=\"cta-reserver\"
            className=\"bg-amber-400 text-slate-900 px-6 py-2.5 rounded-full font-semibold text-sm hover:bg-amber-300 transition-all shadow-[0_0_20px_rgba(251,191,36,0.3)] hover:shadow-[0_0_30px_rgba(251,191,36,0.5)]\"
          >
            Réserver maintenant
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className=\"md:hidden text-white p-2\"
          data-testid=\"mobile-menu-btn\"
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Navigation */}
      <div
        className={`md:hidden glass absolute top-full left-0 right-0 overflow-hidden transition-all duration-300 ${
          isOpen ? \"max-h-96 py-6\" : \"max-h-0\"
        }`}
      >
        <div className=\"flex flex-col items-center gap-6 px-6\">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              onClick={() => setIsOpen(false)}
              data-testid={`mobile-nav-${link.label.toLowerCase().replace(/\s+/g, '-')}`}
              className={`text-lg font-medium transition-colors ${
                isActive(link.path) ? \"text-amber-400\" : \"text-white\"
              }`}
            >
              {link.label}
            </Link>
          ))}
          <Link
            to=\"/reservation\"
            onClick={() => setIsOpen(false)}
            data-testid=\"mobile-cta-reserver\"
            className=\"bg-amber-400 text-slate-900 px-8 py-3 rounded-full font-semibold hover:bg-amber-300 transition-all\"
          >
            Réserver maintenant
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
"
Observation: Create successful: /app/frontend/src/components/Navbar.jsx