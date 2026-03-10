
/*import \"@/App.css\";
import { BrowserRouter, Routes, Route } from \"react-router-dom\";
import { Toaster } from \"@/components/ui/sonner\";

// Pages
import HomePage from \"@/pages/HomePage\";
import EscapesPage from \"@/pages/EscapesPage\";
import BookingPage from \"@/pages/BookingPage\";
import ContactPage from \"@/pages/ContactPage\";

// Components
import Navbar from \"@/components/Navbar\";
import Footer from \"@/components/Footer\";

function App() {
  return (
    <div className=\"App min-h-screen bg-[#020617]\">
      <div className=\"noise-overlay\" />
      <BrowserRouter>
        <Navbar />
        <main>
          <Routes>
            <Route path=\"/\" element={<HomePage />} />
            <Route path=\"/escapes\" element={<EscapesPage />} />
            <Route path=\"/reservation\" element={<BookingPage />} />
            <Route path=\"/contact\" element={<ContactPage />} />
          </Routes>
        </main>
        <Footer />
        <Toaster position=\"top-right\" richColors />
      </BrowserRouter>
    </div>
  );
}

export default App;
"
Observation: Overwrite successful: /app/frontend/src/App.js*/

import "./index.css";
import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";

// Pages
import HomePage from "./pages/HomePage";
import BookingPage from "./pages/BookingPage";

// Components
import Navbar from "./components/Navbar";

function App() {
  return (
    <div className="App min-h-screen bg-[#020617]">
      <BrowserRouter>
        <Navbar />
        <main>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/reservation" element={<BookingPage />} />
          </Routes>
        </main>
      </BrowserRouter>
    </div>
  );
}

export default App;