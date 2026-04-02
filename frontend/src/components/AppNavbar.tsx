import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, LogOut } from 'lucide-react';
import { SquigglyLine } from './DoodleDecorations';
import { useAuth } from '../contexts/AuthContext';

export function AppNavbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const navLinks = user
    ? [
        { name: 'Learn', path: '/learn' },
        { name: 'Topics', path: '/topics' },
        { name: 'Freestyle', path: '/freestyle' },
        { name: 'History', path: '/history' },
      ]
    : [
        { name: 'Learn', path: '/learn' },
        { name: 'Topics', path: '/topics' },
        { name: 'Try Intro', path: '/intro' },
        { name: 'Freestyle', path: '/freestyle' },
      ];
  const authQuery = `?next=${encodeURIComponent(`${location.pathname}${location.search}`)}`;

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <nav className="border-b-2 border-[#1A1A1A] bg-[#FAFAF8] sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20">
          <div className="flex items-center">
            <Link to={user ? '/learn' : '/intro'} className="flex items-center gap-2 group">
              <span className="font-heading font-bold italic text-2xl text-[#1A1A1A] group-hover:text-[#DC2626] transition-colors">
                language coach
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) =>
            <Link
              key={link.name}
              to={link.path}
              className="relative text-lg font-medium text-[#1A1A1A] hover:text-[#DC2626] transition-colors py-2">

                {link.name}
                {isActive(link.path) &&
              <SquigglyLine className="absolute -bottom-1 left-0 w-full h-2 text-[#F59E0B]" />
              }
              </Link>
            )}
            {user ?
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full border-2 border-[#1A1A1A] bg-white flex items-center justify-center hand-drawn-border overflow-hidden font-bold">
                  {user.displayName?.[0] ?? user.email?.[0] ?? '?'}
                </div>
                <button
                onClick={handleLogout}
                className="text-gray-600 hover:text-[#DC2626] transition-colors p-2"
                title="Log out">
                  <LogOut size={20} />
                </button>
              </div> :
            <div className="flex items-center gap-3">
                <Link
                to={`/login${authQuery}`}
                className="font-medium text-[#1A1A1A] hover:text-[#DC2626] transition-colors">
                  Log In
                </Link>
                <Link
                to={`/signup${authQuery}`}
                className="px-4 py-2 border-2 border-[#1A1A1A] hand-drawn-border-pill hand-drawn-shadow-sm font-semibold hover:-translate-y-0.5 transition-transform">
                  Sign Up
                </Link>
              </div>
            }
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-[#1A1A1A] hover:text-[#DC2626] p-2">

              {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMobileMenuOpen &&
      <div className="md:hidden border-t-2 border-[#1A1A1A] bg-white">
          <div className="px-4 pt-2 pb-6 space-y-2">
            {navLinks.map((link) =>
          <Link
            key={link.name}
            to={link.path}
            onClick={() => setIsMobileMenuOpen(false)}
            className={`block px-3 py-4 text-lg font-medium border-b-2 border-dashed border-gray-200 ${isActive(link.path) ? 'text-[#DC2626]' : 'text-[#1A1A1A]'}`}>

                {link.name}
              </Link>
          )}
            {user ?
            <div className="pt-4 flex items-center justify-between px-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full border-2 border-[#1A1A1A] bg-white flex items-center justify-center hand-drawn-border overflow-hidden font-bold">
                    {user.displayName?.[0] ?? user.email?.[0] ?? '?'}
                  </div>
                  <span className="font-medium">{user.displayName ?? user.email}</span>
                </div>
                <button
                onClick={handleLogout}
                className="text-gray-600 hover:text-[#DC2626] transition-colors p-2">
                  <LogOut size={20} />
                </button>
              </div> :
            <div className="pt-4 px-3 grid grid-cols-2 gap-3">
                <Link
                to={`/login${authQuery}`}
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-center px-3 py-3 text-lg font-medium border-2 border-[#1A1A1A] hand-drawn-border-alt">
                  Log In
                </Link>
                <Link
                to={`/signup${authQuery}`}
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-center px-3 py-3 text-lg font-medium border-2 border-[#1A1A1A] bg-[#1A1A1A] text-white hand-drawn-border-alt">
                  Sign Up
                </Link>
              </div>
            }
          </div>
        </div>
      }
    </nav>);

}
