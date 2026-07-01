import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

const BACKEND_URL = import.meta.env.VITE_API_URL || "https://projetethanscape.onrender.com";
const API = `${BACKEND_URL}/api`;

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem("ethanscape_token"));

  useEffect(() => {
  const initAuth = async () => {
    try {
      const token = localStorage.getItem("ethanscape_token");
      if (token) {
        // Fixer le header pour toutes les futures requêtes axios
        axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
        // ATTENDRE que fetchUser récupère les infos (role, email, etc.)
        await fetchUser(); 
      } else {
        setLoading(false);
      }
    } catch (error) {
      console.error("Erreur lors de l'initialisation de l'auth:", error);
      localStorage.removeItem("ethanscape_token"); // Optionnel: nettoie si le token est corrompu
      setLoading(false);
    }
  };

  initAuth(); // 👈 Cette ligne lance réellement la vérification au démarrage
}, []);


  const fetchUser = async () => {
    try {
      const response = await axios.get(`${API}/auth/me`);
      setUser(response.data);
    } catch (error) {
      console.error("Auth error:", error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
  try {
    const response = await axios.post(`${API}/login`, { 
      username: email, // On envoie l'email sous le nom 'username'
      password: password 
    });

    const { access_token, user: userData } = response.data;
    
    localStorage.setItem("ethanscape_token", access_token);
    axios.defaults.headers.common["Authorization"] = `Bearer ${access_token}`;
    
    setToken(access_token);
    setUser(userData);
    return userData;
  } catch (error) {
    console.error("Erreur détaillée :", error.response?.data);
    throw error;
  }
};

  const register = async (data) => {
    const response = await axios.post(`${API}/auth/register`, data);
    const { token: newToken, user: userData } = response.data;
    
    localStorage.setItem("ethanscape_token", newToken);
    axios.defaults.headers.common["Authorization"] = `Bearer ${newToken}`;
    setToken(newToken);
    setUser(userData);
    
    return userData;
  };

  const logout = () => {
    localStorage.removeItem("ethanscape_token");
    delete axios.defaults.headers.common["Authorization"];
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, token }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};