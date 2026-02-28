import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { SquigglyLine } from './DoodleDecorations';
export function AppNavbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navLinks = [
  {
    name: 'Learn',
    path: '/learn'
  },
  {
    name: 'Topics',
    path: '/topics'
  },
  {
    name: 'Freestyle',
    path: '/freestyle'
  }];

  const isActive = (path: string) => location.pathname === path;
  return (
    <nav className="border-b-2 border-[#1A1A1A] bg-[#FAFAF8] sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20">
          <div className="flex items-center">
            <Link to="/learn" className="flex items-center gap-2 group">
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
            <div className="w-10 h-10 rounded-full border-2 border-[#1A1A1A] bg-white flex items-center justify-center hand-drawn-border overflow-hidden">
              <img
                src="https://api.dicebear.com/7.x/notionists/svg?seed=Felix&backgroundColor=transparent"
                alt="User avatar"
                className="w-full h-full object-cover" />

            </div>
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
            <div className="pt-4 flex items-center gap-3 px-3">
              <div className="w-10 h-10 rounded-full border-2 border-[#1A1A1A] bg-white flex items-center justify-center hand-drawn-border overflow-hidden">
                <img
                src="https://api.dicebear.com/7.x/notionists/svg?seed=Felix&backgroundColor=transparent"
                alt="User avatar"
                className="w-full h-full object-cover" />

              </div>
              <span className="font-medium">My Profile</span>
            </div>
          </div>
        </div>
      }
    </nav>);

}