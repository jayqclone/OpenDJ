import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Header from './components/Header';
import Home from './pages/Home';
import Callback from './pages/Callback';

function App() {
  return (
    <Router>
      <div className="min-h-screen flex flex-col bg-dark-400">
        <Header />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/callback" element={<Callback />} />
          </Routes>
        </main>
        <footer className="bg-dark-300 py-4 text-center text-light-300 text-sm">
          <div className="container mx-auto px-4">
            <p>© {new Date().getFullYear()} PlaylistAI - Create the perfect playlist with AI</p>
          </div>
        </footer>
      </div>
    </Router>
  );
}

export default App;