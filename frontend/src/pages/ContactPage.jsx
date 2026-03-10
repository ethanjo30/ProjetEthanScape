import { useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import SpotlightCard from "@/components/SpotlightCard";
import { 
  Phone, 
  Mail, 
  MapPin, 
  Facebook, 
  Instagram, 
  Send, 
  Loader2,
  CheckCircle2 
} from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ContactPage = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: ""
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await axios.post(`${API}/contact`, formData);
      toast.success("Message envoyé avec succès !");
      setSubmitted(true);
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Erreur lors de l'envoi. Veuillez réessayer.");
    } finally {
      setSubmitting(false);
    }
  };

  const contactInfo = [
    {
      icon: <Phone className="w-6 h-6" />,
      label: "Téléphone",
      value: "06 59 55 88 85",
      href: "tel:0659558885"
    },
    {
      icon: <Mail className="w-6 h-6" />,
      label: "Email",
      value: "ethanscape.servicesclients@gmail.com",
      href: "mailto:ethanscape.servicesclients@gmail.com"
    },
    {
      icon: <MapPin className="w-6 h-6" />,
      label: "Zone d'intervention",
      value: "Service à domicile dans toute la France",
      href: null
    }
  ];

  const socialLinks = [
    {
      icon: <Facebook className="w-6 h-6" />,
      label: "Facebook",
      href: "https://www.facebook.com/profile.php?id=61571650601439"
    },
    {
      icon: <Instagram className="w-6 h-6" />,
      label: "Instagram",
      href: "https://www.instagram.com/ethan_scape_officiel/"
    }
  ];

  if (submitted) {
    return (
      <div data-testid="contact-success" className="min-h-screen pt-24 pb-16 flex items-center justify-center">
        <div className="max-w-md mx-auto px-6 text-center">
          <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-green-500" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-4 font-['Playfair_Display']">
            Message envoyé !
          </h1>
          <p className="text-slate-400 mb-8">
            Merci pour votre message. Nous vous répondrons dans les plus brefs délais.
          </p>
          <Button
            onClick={() => {
              setSubmitted(false);
              setFormData({
                name: "",
                email: "",
                phone: "",
                subject: "",
                message: ""
              });
            }}
            className="bg-amber-400 text-slate-900 hover:bg-amber-300 rounded-full px-8"
          >
            Envoyer un autre message
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div data-testid="contact-page" className="min-h-screen pt-24 pb-16">
      {/* Header */}
      <section className="py-12 bg-gradient-to-b from-slate-900 to-slate-950">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 font-['Playfair_Display']">
            Contactez-<span className="text-amber-400">nous</span>
          </h1>
          <p className="text-slate-400 max-w-2xl mx-auto">
            Une question ? Un projet d'escape game sur mesure ? N'hésitez pas à nous contacter !
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid lg:grid-cols-2 gap-12">
          {/* Contact Form */}
          <div>
            <SpotlightCard className="bg-slate-900/50 rounded-xl border border-slate-800 p-8">
              <h2 className="text-2xl font-bold text-white mb-6 font-['Playfair_Display']">
                Envoyez-nous un message
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name" className="text-white mb-2 block">Nom *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      required
                      className="bg-slate-800 border-slate-700"
                      data-testid="contact-name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email" className="text-white mb-2 block">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      required
                      className="bg-slate-800 border-slate-700"
                      data-testid="contact-email"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="phone" className="text-white mb-2 block">Téléphone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="bg-slate-800 border-slate-700"
                    data-testid="contact-phone"
                  />
                </div>

                <div>
                  <Label htmlFor="subject" className="text-white mb-2 block">Sujet *</Label>
                  <Input
                    id="subject"
                    value={formData.subject}
                    onChange={(e) => setFormData({...formData, subject: e.target.value})}
                    required
                    placeholder="Ex: Demande d'information, Devis, Partenariat..."
                    className="bg-slate-800 border-slate-700"
                    data-testid="contact-subject"
                  />
                </div>

                <div>
                  <Label htmlFor="message" className="text-white mb-2 block">Message *</Label>
                  <Textarea
                    id="message"
                    value={formData.message}
                    onChange={(e) => setFormData({...formData, message: e.target.value})}
                    required
                    placeholder="Décrivez votre projet ou posez votre question..."
                    className="bg-slate-800 border-slate-700 min-h-[150px]"
                    data-testid="contact-message"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-amber-400 text-slate-900 hover:bg-amber-300 rounded-full py-6 font-semibold flex items-center justify-center gap-2"
                  data-testid="contact-submit"
                >
                  {submitting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      Envoyer le message
                      <Send size={18} />
                    </>
                  )}
                </Button>
              </form>
            </SpotlightCard>
          </div>

          {/* Contact Info */}
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold text-white mb-6 font-['Playfair_Display']">
                Nos coordonnées
              </h2>
              
              <div className="space-y-4">
                {contactInfo.map((info, index) => (
                  <SpotlightCard 
                    key={index}
                    className="flex items-start gap-4 p-4 rounded-xl bg-slate-900/30 border border-slate-800 hover:border-amber-400/30 transition-all"
                  >
                    <div className="w-12 h-12 rounded-lg bg-amber-400/10 flex items-center justify-center text-amber-400 flex-shrink-0">
                      {info.icon}
                    </div>
                    <div>
                      <p className="text-slate-400 text-sm">{info.label}</p>
                      {info.href ? (
                        <a 
                          href={info.href}
                          data-testid={`contact-info-${info.label.toLowerCase()}`}
                          className="text-white hover:text-amber-400 transition-colors break-all"
                        >
                          {info.value}
                        </a>
                      ) : (
                        <p className="text-white">{info.value}</p>
                      )}
                    </div>
                  </SpotlightCard>
                ))}
              </div>
            </div>

            {/* Social Links */}
            <div>
              <h2 className="text-2xl font-bold text-white mb-6 font-['Playfair_Display']">
                Suivez-nous
              </h2>
              
              <div className="flex gap-4">
                {socialLinks.map((social, index) => (
                  <a
                    key={index}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    data-testid={`social-${social.label.toLowerCase()}`}
                    className="w-14 h-14 rounded-xl bg-slate-900/50 border border-slate-800 flex items-center justify-center text-slate-400 hover:bg-amber-400 hover:border-amber-400 hover:text-slate-900 transition-all"
                  >
                    {social.icon}
                  </a>
                ))}
              </div>
            </div>

            {/* FAQ Teaser */}
            <SpotlightCard className="p-6 rounded-xl bg-gradient-to-br from-amber-400/10 to-transparent border border-amber-400/20">
              <h3 className="text-xl font-semibold text-white mb-3 font-['Playfair_Display']">
                Questions fréquentes
              </h3>
              <ul className="space-y-2 text-slate-300 text-sm">
                <li>• Combien de temps dure l'installation ?</li>
                <li>• Peut-on personnaliser les énigmes ?</li>
                <li>• Proposez-vous des animations pour entreprises ?</li>
              </ul>
              <p className="text-amber-400 text-sm mt-4">
                Contactez-nous pour en savoir plus !
              </p>
            </SpotlightCard>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;