import "./index.css";
import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "./components/ui/sonner.jsx";
import { AuthProvider } from "./contexts/AuthContext";

// Pages
import HomePage from "./pages/HomePage";
import EscapesPage from "./pages/EscapesPage";
import BookingPage from "./pages/BookingPage";
import ContactPage from "./pages/ContactPage";
import RGPDPage from "./pages/RGPDPage";

// Components
import Navbar from "./components/Navbar.jsx";
import Footer from "./components/Footer.jsx";

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