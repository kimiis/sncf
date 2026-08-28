import './App.css';
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext";

import Home from "./pages/Home.jsx";
import Index from "./pages/Index.jsx";
import NavBar from "./components/NavBar.jsx";
import Footer from "./components/Footer.jsx";
import Profil from "./pages/Profil.jsx";
import SearchResult from "./pages/SearchResult.jsx";
import FAQ from "./pages/FAQ.jsx";
import MentionsLegales from "./pages/MentionsLegales.jsx";

import PrivateRoute from "./components/PrivateRoute";
import './index.css';
import "./styles/variable.css";

import UnauthorizedPage from "./pages/UnauthorizedPage";
import Inspiration from "./pages/Inspiration";

function AppWrapper() {
  return (
      <ThemeProvider>
        <Router>
          <App />
        </Router>
      </ThemeProvider>
  );
}

function App() {
  const location = useLocation();
  const isSplash = location.pathname === "/" || location.pathname === "/login";

  return (
      <>
        {!isSplash && <NavBar />}
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/index" element={<Index />} />
          <Route path="/search" element={<SearchResult />} />
          <Route path="/inspiration" element={<Inspiration />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/mentions-legales" element={<MentionsLegales />} />

          <Route element={<PrivateRoute />}>
            <Route path="/profil" element={<Profil />} />
          </Route>

          <Route path="/unauthorized" element={<UnauthorizedPage />} />
        </Routes>
        {!isSplash && <Footer />}
      </>
  );
}

export default AppWrapper;
