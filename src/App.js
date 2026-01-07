/*import { BrowserRouter as Router, Routes, Route, Link, HashRouter } from "react-router-dom";
import Home from './pages/Home';
import CommandPage from './pages/CommandPage';
import Nav from './components/Nav';
import Footer from './components/Footer';
import FAQ from "./pages/FAQ";
import MiniCommandPage from "./pages/MiniCommandPage";
import ScrollToTop from "./components/ScrollToTop";

function App() {
  return (
    <HashRouter>
      <Nav />
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/command/:id" element={<CommandPage />} />
        <Route path="/mini/:id" element={<MiniCommandPage />} />
        <Route path="/faq" element={<FAQ />} />
      </Routes>
      <Footer />
    </HashRouter>
  );
}

export default App;*/



import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import Home from './pages/Home';
import CommandPage from './pages/CommandPage';
import MiniCommandPage from "./pages/MiniCommandPage";
import FAQ from "./pages/FAQ";
import ParticleGen from "./pages/ParticleGen";
import Nav from './components/Nav';
import Footer from './components/Footer';
import ScrollToTop from "./components/ScrollToTop";

function App() {
  return (
    <HelmetProvider>
      <Router basename="/mcCommands">
        <Nav />
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/command/:id" element={<CommandPage />} />
          <Route path="/mini/:id" element={<MiniCommandPage />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/ParticleGen" element={<ParticleGen />} />
        </Routes>
        <Footer />
      </Router>
    </HelmetProvider>
  );
}

export default App;