import { BrowserRouter as Router, Routes, Route, Link, HashRouter } from "react-router-dom";
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

export default App;