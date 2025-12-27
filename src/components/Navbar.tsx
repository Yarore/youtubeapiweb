import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Youtube, Settings, LogOut, TrendingUp, Home } from 'lucide-react';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="bg-white shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/dashboard" className="flex items-center gap-2">
            <Youtube className="w-8 h-8 text-red-600" />
            <span className="text-xl font-bold text-gray-800">YouTube Analytics</span>
          </Link>

          <div className="flex items-center gap-4">
            <Link
              to="/dashboard"
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
                isActive('/dashboard')
                  ? 'bg-red-100 text-red-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Home className="w-5 h-5" />
              <span className="hidden md:inline">대시보드</span>
            </Link>

            <Link
              to="/trending"
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
                isActive('/trending')
                  ? 'bg-red-100 text-red-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <TrendingUp className="w-5 h-5" />
              <span className="hidden md:inline">트렌딩</span>
            </Link>

            <Link
              to="/settings"
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
                isActive('/settings')
                  ? 'bg-red-100 text-red-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Settings className="w-5 h-5" />
              <span className="hidden md:inline">설정</span>
            </Link>

            <div className="h-6 w-px bg-gray-300"></div>

            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600 hidden md:inline">{user?.username}</span>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
              >
                <LogOut className="w-5 h-5" />
                <span className="hidden md:inline">로그아웃</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
