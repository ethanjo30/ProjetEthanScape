/*Maintenant, créons les pages frontend pour l'authentification et l'admin :
Action: file_editor create /app/frontend/src/contexts/AuthContext.jsx --file-text "import { createContext, useContext, useState, useEffect } from \"react\";
import axios from \"axios\";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem(\"ethanscape_token\"));

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common[\"Authorization\"] = `Bearer ${token}`;
      fetchUser();
    } else {
      setLoading(false);
    }
  }, [token]);

  const fetchUser = async () => {
    try {
      const response = await axios.get(`${API}/auth/me`);
      setUser(response.data);
    } catch (error) {
      console.error(\"Auth error:\", error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const response = await axios.post(`${API}/auth/login`, { email, password });
    const { token: newToken, user: userData } = response.data;
    
    localStorage.setItem(\"ethanscape_token\", newToken);
    axios.defaults.headers.common[\"Authorization\"] = `Bearer ${newToken}`;
    setToken(newToken);
    setUser(userData);
    
    return userData;
  };

  const register = async (data) => {
    const response = await axios.post(`${API}/auth/register`, data);
    const { token: newToken, user: userData } = response.data;
    
    localStorage.setItem(\"ethanscape_token\", newToken);
    axios.defaults.headers.common[\"Authorization\"] = `Bearer ${newToken}`;
    setToken(newToken);
    setUser(userData);
    
    return userData;
  };

  const logout = () => {
    localStorage.removeItem(\"ethanscape_token\");
    delete axios.defaults.headers.common[\"Authorization\"];
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
    throw new Error(\"useAuth must be used within an AuthProvider\");
  }
  return context;
};
"
Observation: Create successful: /app/frontend/src/contexts/AuthContext.jsx*/