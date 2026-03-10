import { useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { ArrowRight, Home, Users, Puzzle, Star, ChevronRight } from "lucide-react";
import SpotlightCard from "@/components/SpotlightCard";

/*const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;*/
const BACKEND_URL = "http://127.0.0.1:8000"; 

// On crée l'URL de l'API en ajoutant /api
const API = `${BACKEND_URL}/api`;

const LOGO_URL = "https://customer-assets.emergentagent.com/job_b18ee068-afca-4c96-adc4-5e2cfca2adc0/artifacts/fltpid2d_logo%20ethan%20scape.png";

const HomePage = () => {
  // Seed database on first load
  useEffect(() => {
    const seedDB = async () => {
      try {
        await axios.post(`${API}/seed`);
      } catch (e) {
        console.log("DB already seeded or error:", e);
      }
    };
    seedDB();
  }, []);

  const features = [
    {
      icon: <Home className="w-8 h-8" />,
      title: "Chez Vous",
      description: "Nous venons installer l'escape game directement chez vous, où vous voulez."
    },
    {
      icon: <Puzzle className="w-8 h-8" />,
      title: "Thèmes Personnalisables",
      description: "Choisissez parmi nos thèmes ou personnalisez votre aventure unique."
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: "4 à 39 Joueurs",
      description: "Des petits groupes aux grands événements, nous nous adaptons à vous."
    }
  ];

  const steps = [
    { num: "01", title: "Choisissez", desc: "Sélectionnez votre thème et durée" },
    { num: "02", title: "Réservez", desc: "On vient chez vous à la date souhaitée" },
    { num: "03", title: "Jouez", desc: "Vivez une aventure inoubliable" }
  ];

  return (
    <div data-testid="home-page" className="min-h-screen">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-500/20 rounded-full blur-3xl" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
          </div>
        </div>

        {/* Maze pattern overlay */}
        <div className="absolute inset-0 opacity-5">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <pattern id="maze" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M0 10h10M10 0v10M10 10h10M20 10v10" stroke="white" strokeWidth="0.5" fill="none" />
            </pattern>
            <rect width="100%" height="100%" fill="url(#maze)" />
          </svg>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 text-center">
          <img 
            src={LOGO_URL} 
            alt="EthanScape" 
            className="h-32 md:h-40 w-auto mx-auto mb-8 invert animate-fade-in-up"
          />
          
          <h1 
            className="text-4xl sm:text-5xl lg:text-7xl font-bold text-white mb-6 font-['Playfair_Display'] animate-fade-in-up stagger-1"
            style={{ opacity: 0, animationFillMode: 'forwards' }}
          >
            L'Escape Game qui vient <br />
            <span className="text-amber-400">à vous</span>
          </h1>
          
          <p 
            className="text-base md:text-lg text-slate-400 max-w-2xl mx-auto mb-10 animate-fade-in-up stagger-2"
            style={{ opacity: 0, animationFillMode: 'forwards' }}
          >
            Des aventures immersives et personnalisables, installées directement chez vous. 
            Anniversaires, team building ou entre amis - vivez l'évasion à domicile.
          </p>
          
          <div 
            className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up stagger-3"
            style={{ opacity: 0, animationFillMode: 'forwards' }}
          >
            <Link
              to="/reservation"
              data-testid="hero-cta-reserver"
              className="inline-flex items-center justify-center gap-2 bg-amber-400 text-slate-900 px-8 py-4 rounded-full font-semibold text-lg hover:bg-amber-300 transition-all animate-pulse-glow"
            >
              Réserver une mission
              <ArrowRight size={20} />
            </Link>
            <Link
              to="/escapes"
              data-testid="hero-cta-decouvrir"
              className="inline-flex items-center justify-center gap-2 bg-transparent border border-slate-700 text-white px-8 py-4 rounded-full font-semibold hover:border-slate-500 hover:bg-slate-800/50 transition-all"
            >
              Découvrir nos thèmes
            </Link>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <ChevronRight size={24} className="text-slate-500 rotate-90" />
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-slate-950">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4 font-['Playfair_Display']">
              Pourquoi <span className="text-amber-400">EthanScape</span> ?
            </h2>
            <p className="text-slate-400 max-w-xl mx-auto">
              Une expérience unique qui s'adapte à vos envies
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <SpotlightCard 
                key={index}
                className="p-8 rounded-2xl bg-slate-900/30 border border-slate-800 hover:border-amber-400/30 transition-all"
              >
                <div className="w-16 h-16 rounded-xl bg-amber-400/10 flex items-center justify-center text-amber-400 mb-6">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-white mb-3 font-['Playfair_Display']">
                  {feature.title}
                </h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  {feature.description}
                </p>
              </SpotlightCard>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4 font-['Playfair_Display']">
              Comment ça <span className="text-amber-400">marche</span> ?
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <div key={index} className="relative text-center">
                <span className="text-7xl font-bold text-amber-400/10 font-['Playfair_Display']">
                  {step.num}
                </span>
                <div className="-mt-10">
                  <h3 className="text-2xl font-semibold text-white mb-2 font-['Playfair_Display']">
                    {step.title}
                  </h3>
                  <p className="text-slate-400">{step.desc}</p>
                </div>
                {index < 2 && (
                  <div className="hidden md:block absolute top-1/3 right-0 translate-x-1/2">
                    <ArrowRight size={24} className="text-slate-700" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section className="py-24 bg-slate-950">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4 font-['Playfair_Display']">
              Nos <span className="text-amber-400">Tarifs</span>
            </h2>
            <p className="text-slate-400 max-w-xl mx-auto">
              Prix par personne - plus vous êtes nombreux, moins c'est cher !
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full max-w-4xl mx-auto text-center">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="py-4 px-4 text-slate-400 font-medium">Groupe</th>
                  <th className="py-4 px-4 text-slate-400 font-medium">30 min</th>
                  <th className="py-4 px-4 text-slate-400 font-medium">1 heure</th>
                  <th className="py-4 px-4 text-slate-400 font-medium">1h30</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-slate-800/50">
                  <td className="py-4 px-4 text-white font-medium">4-9 pers.</td>
                  <td className="py-4 px-4 text-amber-400 font-semibold">22€</td>
                  <td className="py-4 px-4 text-amber-400 font-semibold">25€</td>
                  <td className="py-4 px-4 text-amber-400 font-semibold">28€</td>
                </tr>
                <tr className="border-b border-slate-800/50">
                  <td className="py-4 px-4 text-white font-medium">10-19 pers.</td>
                  <td className="py-4 px-4 text-amber-400 font-semibold">19€</td>
                  <td className="py-4 px-4 text-amber-400 font-semibold">22€</td>
                  <td className="py-4 px-4 text-amber-400 font-semibold">25€</td>
                </tr>
                <tr className="border-b border-slate-800/50">
                  <td className="py-4 px-4 text-white font-medium">20-29 pers.</td>
                  <td className="py-4 px-4 text-amber-400 font-semibold">16€</td>
                  <td className="py-4 px-4 text-amber-400 font-semibold">19€</td>
                  <td className="py-4 px-4 text-amber-400 font-semibold">22€</td>
                </tr>
                <tr>
                  <td className="py-4 px-4 text-white font-medium">30-39 pers.</td>
                  <td className="py-4 px-4 text-amber-400 font-semibold">13€</td>
                  <td className="py-4 px-4 text-amber-400 font-semibold">16€</td>
                  <td className="py-4 px-4 text-amber-400 font-semibold">19€</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="text-center mt-12">
            <Link
              to="/reservation"
              data-testid="pricing-cta"
              className="inline-flex items-center gap-2 bg-amber-400 text-slate-900 px-8 py-4 rounded-full font-semibold hover:bg-amber-300 transition-all"
            >
              Calculer mon devis
              <ArrowRight size={20} />
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4 font-['Playfair_Display']">
              Ils ont <span className="text-amber-400">joué</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { name: "Marie L.", text: "Une expérience incroyable pour l'anniversaire de mon fils ! Toute l'équipe était au top.", rating: 5 },
              { name: "Thomas D.", text: "Parfait pour notre team building. Le thème enquête était vraiment immersif.", rating: 5 },
              { name: "Sophie M.", text: "Je recommande à 100% ! C'est tellement pratique de ne pas avoir à se déplacer.", rating: 5 }
            ].map((testimonial, index) => (
              <SpotlightCard 
                key={index}
                className="p-6 rounded-xl bg-slate-900/50 border border-slate-800"
              >
                <div className="flex gap-1 mb-4">
                  {Array(testimonial.rating).fill(0).map((_, i) => (
                    <Star key={i} size={16} className="text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-slate-300 mb-4 italic">"{testimonial.text}"</p>
                <p className="text-white font-medium">{testimonial.name}</p>
              </SpotlightCard>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-b from-slate-950 to-slate-900">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 font-['Playfair_Display']">
            Prêt pour l'<span className="text-amber-400">aventure</span> ?
          </h2>
          <p className="text-slate-400 mb-10">
            Réservez dès maintenant et vivez une expérience unique chez vous.
          </p>
          <Link
            to="/reservation"
            data-testid="final-cta"
            className="inline-flex items-center gap-2 bg-amber-400 text-slate-900 px-10 py-5 rounded-full font-semibold text-lg hover:bg-amber-300 transition-all animate-pulse-glow"
          >
            Réserver mon escape
            <ArrowRight size={24} />
          </Link>
        </div>
      </section>
    </div>
  );
};

export default HomePage;

/*import { useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { ArrowRight } from "lucide-react";

const API = "http://127.0.0.1:8000/api";

const HomePage = () => {
  useEffect(() => {
    const seedDB = async () => {
      try {
        await axios.get(`${API}/seed`);
      } catch (e) {
        console.log("DB prête");
      }
    };
    seedDB();
  }, []);

  return (
    <div className="min-h-screen bg-[#020617] text-white flex flex-col items-center justify-center px-6 text-center">
      {/* Effet de lumière en fond *}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
        <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] bg-amber-400/5 blur-[120px] rounded-full" />
      </div>

      <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
        L'Aventure <span className="text-amber-400 italic">Ethan Scape</span>
        <br /> S'invite Chez Vous
      </h1>
      
      <p className="max-w-2xl text-slate-400 text-lg md:text-xl mb-10">
        Transformez votre espace en un terrain de jeu immersif. 
        Nous apportons les énigmes, vous apportez l'équipe.
      </p>

      <div className="flex flex-col sm:flex-row gap-4">
        <Link 
          to="/reservation" 
          className="px-8 py-4 bg-amber-400 text-slate-900 rounded-full font-bold text-lg hover:scale-105 transition-transform flex items-center gap-2"
        >
          Réserver une mission <ArrowRight size={20} />
        </Link>
        <Link 
          to="/contact" 
          className="px-8 py-4 bg-slate-900 border border-slate-700 rounded-full font-bold text-lg hover:bg-slate-800 transition-all"
        >
          Nous contacter
        </Link>
      </div>
    </div>
  );
};

export default HomePage;*/
