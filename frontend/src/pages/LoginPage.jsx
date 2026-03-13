
/*Action: file_editor create /app/frontend/src/pages/LoginPage.jsx --file-text "import { useState } from \"react\";
import { useNavigate, Link } from \"react-router-dom\";
import { useAuth } from \"@/contexts/AuthContext\";
import { toast } from \"sonner\";
import { Button } from \"@/components/ui/button\";
import { Input } from \"@/components/ui/input\";
import { Label } from \"@/components/ui/label\";
import { Tabs, TabsContent, TabsList, TabsTrigger } from \"@/components/ui/tabs\";
import { Eye, EyeOff, Loader2, User, Shield } from \"lucide-react\";

const LoginPage = () => {
  const navigate = useNavigate();
  const { login, register } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const [loginData, setLoginData] = useState({ email: \"\", password: \"\" });
  const [registerData, setRegisterData] = useState({ 
    email: \"\", 
    password: \"\", 
    name: \"\", 
    phone: \"\" 
  });

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const user = await login(loginData.email, loginData.password);
      toast.success(`Bienvenue ${user.name} !`);
      
      if (user.is_admin) {
        navigate(\"/admin\");
      } else {
        navigate(\"/mon-compte\");
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || \"Erreur de connexion\");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const user = await register(registerData);
      toast.success(`Bienvenue ${user.name} ! Votre compte a été créé.`);
      navigate(\"/mon-compte\");
    } catch (error) {
      toast.error(error.response?.data?.detail || \"Erreur lors de l'inscription\");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div data-testid=\"login-page\" className=\"min-h-screen pt-24 pb-16 flex items-center justify-center\">
      <div className=\"max-w-md w-full mx-4\">
        <div className=\"text-center mb-8\">
          <h1 className=\"text-3xl font-bold text-white font-['Playfair_Display']\">
            Mon <span className=\"text-amber-400\">Compte</span>
          </h1>
          <p className=\"text-slate-400 mt-2\">
            Connectez-vous ou créez un compte pour accéder à vos réservations
          </p>
        </div>

        <div className=\"bg-slate-900/50 rounded-xl border border-slate-800 p-6\">
          <Tabs defaultValue=\"login\" className=\"w-full\">
            <TabsList className=\"grid w-full grid-cols-2 mb-6\">
              <TabsTrigger value=\"login\" className=\"flex items-center gap-2\">
                <User size={16} />
                Connexion
              </TabsTrigger>
              <TabsTrigger value=\"register\" className=\"flex items-center gap-2\">
                <Shield size={16} />
                Inscription
              </TabsTrigger>
            </TabsList>

            <TabsContent value=\"login\">
              <form onSubmit={handleLogin} className=\"space-y-4\">
                <div>
                  <Label htmlFor=\"login-email\" className=\"text-white\">Email</Label>
                  <Input
                    id=\"login-email\"
                    type=\"email\"
                    value={loginData.email}
                    onChange={(e) => setLoginData({...loginData, email: e.target.value})}
                    required
                    className=\"bg-slate-800 border-slate-700 mt-1\"
                    placeholder=\"votre@email.com\"
                    data-testid=\"login-email\"
                  />
                </div>

                <div>
                  <Label htmlFor=\"login-password\" className=\"text-white\">Mot de passe</Label>
                  <div className=\"relative mt-1\">
                    <Input
                      id=\"login-password\"
                      type={showPassword ? \"text\" : \"password\"}
                      value={loginData.password}
                      onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                      required
                      className=\"bg-slate-800 border-slate-700 pr-10\"
                      data-testid=\"login-password\"
                    />
                    <button
                      type=\"button\"
                      onClick={() => setShowPassword(!showPassword)}
                      className=\"absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white\"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <Button
                  type=\"submit\"
                  disabled={isLoading}
                  className=\"w-full bg-amber-400 text-slate-900 hover:bg-amber-300\"
                  data-testid=\"login-submit\"
                >
                  {isLoading ? <Loader2 className=\"w-5 h-5 animate-spin\" /> : \"Se connecter\"}
                </Button>
              </form>

              <div className=\"mt-6 pt-6 border-t border-slate-800\">
                <p className=\"text-slate-500 text-sm text-center\">
                  Administrateur ? Connectez-vous avec vos identifiants admin.
                </p>
              </div>
            </TabsContent>

            <TabsContent value=\"register\">
              <form onSubmit={handleRegister} className=\"space-y-4\">
                <div>
                  <Label htmlFor=\"register-name\" className=\"text-white\">Nom complet *</Label>
                  <Input
                    id=\"register-name\"
                    type=\"text\"
                    value={registerData.name}
                    onChange={(e) => setRegisterData({...registerData, name: e.target.value})}
                    required
                    className=\"bg-slate-800 border-slate-700 mt-1\"
                    placeholder=\"Jean Dupont\"
                    data-testid=\"register-name\"
                  />
                </div>

                <div>
                  <Label htmlFor=\"register-email\" className=\"text-white\">Email *</Label>
                  <Input
                    id=\"register-email\"
                    type=\"email\"
                    value={registerData.email}
                    onChange={(e) => setRegisterData({...registerData, email: e.target.value})}
                    required
                    className=\"bg-slate-800 border-slate-700 mt-1\"
                    placeholder=\"votre@email.com\"
                    data-testid=\"register-email\"
                  />
                </div>

                <div>
                  <Label htmlFor=\"register-phone\" className=\"text-white\">Téléphone</Label>
                  <Input
                    id=\"register-phone\"
                    type=\"tel\"
                    value={registerData.phone}
                    onChange={(e) => setRegisterData({...registerData, phone: e.target.value})}
                    className=\"bg-slate-800 border-slate-700 mt-1\"
                    placeholder=\"06 XX XX XX XX\"
                    data-testid=\"register-phone\"
                  />
                </div>

                <div>
                  <Label htmlFor=\"register-password\" className=\"text-white\">Mot de passe *</Label>
                  <div className=\"relative mt-1\">
                    <Input
                      id=\"register-password\"
                      type={showPassword ? \"text\" : \"password\"}
                      value={registerData.password}
                      onChange={(e) => setRegisterData({...registerData, password: e.target.value})}
                      required
                      minLength={6}
                      className=\"bg-slate-800 border-slate-700 pr-10\"
                      data-testid=\"register-password\"
                    />
                    <button
                      type=\"button\"
                      onClick={() => setShowPassword(!showPassword)}
                      className=\"absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white\"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  <p className=\"text-slate-500 text-xs mt-1\">Minimum 6 caractères</p>
                </div>

                <Button
                  type=\"submit\"
                  disabled={isLoading}
                  className=\"w-full bg-amber-400 text-slate-900 hover:bg-amber-300\"
                  data-testid=\"register-submit\"
                >
                  {isLoading ? <Loader2 className=\"w-5 h-5 animate-spin\" /> : \"Créer mon compte\"}
                </Button>
              </form>

              <p className=\"text-slate-500 text-xs text-center mt-4\">
                En créant un compte, vous acceptez notre{\" \"}
                <Link to=\"/rgpd\" className=\"text-amber-400 hover:underline\">
                  politique de confidentialité
                </Link>
              </p>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
"
Observation: Create successful: /app/frontend/src/pages/LoginPage.jsx*/