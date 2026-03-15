import "./index.css";
import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "./components/ui/sonner.jsx";

// Pages
import HomePage from "./pages/HomePage";
import EscapesPage from "./pages/EscapesPage";
import BookingPage from "./pages/BookingPage";
import ContactPage from "./pages/ContactPage";

// Components
import Navbar from "./components/Navbar.jsx";
import Footer from "./components/Footer.jsx";

function App() {
  return (
    <div className="App min-h-screen bg-[#020617]">
      <div className="noise-overlay" />
      <BrowserRouter>
        <Navbar />
        <main>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/escapes" element={<EscapesPage />} />
            <Route path="/reservation" element={<BookingPage />} />
            <Route path="/contact" element={<ContactPage />} />
          </Routes>
        </main>
        <Footer />
        <Toaster position="top-right" richColors />
      </BrowserRouter>
    </div>
  );
}

export default App;


/* version 2 

Maintenant mettons à jour App.js et la Navbar avec les nouvelles routes :
Action: file_editor create /app/frontend/src/App.js --file-text "import "./index.css";
import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "./components/ui/sonner";
import { AuthProvider } from "./contexts/AuthContext";

// Pages
import HomePage from "./pages/HomePage";
import EscapesPage from "./pages/EscapesPage";
import BookingPage from "./pages/BookingPage";
import ContactPage from "./pages/ContactPage";
import LoginPage from "./pages/LoginPage";
import ClientDashboard from "./pages/ClientDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import RGPDPage from "./pages/RGPDPage";

// Components
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

function App() {
  return (
    <AuthProvider>
      <div className="App min-h-screen bg-[#020617]">
        <div className="noise-overlay" />
        <BrowserRouter>
          <Navbar />
          <main>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/escapes" element={<EscapesPage />} />
              <Route path="/reservation" element={<BookingPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/connexion" element={<LoginPage />} />
              <Route path="/mon-compte" element={<ClientDashboard />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/rgpd" element={<RGPDPage />} />
            </Routes>
          </main>
          <Footer />
          <Toaster position="top-right" richColors />
        </BrowserRouter>
      </div>
    </AuthProvider>
  );
}

export default App;
"
Observation: Overwrite successful: /app/frontend/src/App.js */