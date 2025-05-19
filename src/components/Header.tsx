import React from 'react';
import { Link } from 'react-router-dom';
import { Music, LogOut } from 'lucide-react';
import useAuth from '../hooks/useAuth';

const Header: React.FC = () => {
  const { isAuthenticated, logout } = useAuth();
  
  return (
    <header className="sticky top-0 z-10 bg-dark-300 shadow-md">
      <div className="container mx-auto py-4 px-4 md:px-6 flex justify-between items-center">
        <Link to="/" className="flex items-center space-x-2">
          <Music className="h-8 w-8 text-spotify" />
          <h1 className="text-xl font-bold">PlaylistAI</h1>
        </Link>
        
        <div className="flex items-center space-x-4">
          {isAuthenticated && (
            <button 
              onClick={logout}
              className="flex items-center space-x-1 text-sm text-light-100 hover:text-spotify transition-colors"
            >
              <LogOut size={16} />
              <span>Logout</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;