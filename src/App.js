import { BrowserRouter as Router, Routes, Route, Link, HashRouter } from "react-router-dom";
import Home from './pages/Home';
import CommandPage from './pages/CommandPage';
import Nav from './components/Nav';
import Footer from './components/Footer';

function App() {
  return (
    <HashRouter>
      <Nav />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/command/:id" element={<CommandPage />} />
      </Routes>
      <Footer />
    </HashRouter>
  );
}

export default App;