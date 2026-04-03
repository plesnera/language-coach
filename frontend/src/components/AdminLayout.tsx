import React, { useState } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import {
  LayoutGrid,
  BookOpen,
  MessageSquare,
  FileText,
  Users,
  Menu,
  X,
  ArrowLeft,
} from 'lucide-react';
import { SquigglyLine } from './DoodleDecorations';

interface NavLink {
  name: string;
  path: string;
  exact: boolean;
  icon: React.ReactNode;
}

export function AdminLayout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  const navLinks: NavLink[] = [
    {
      name: 'Main',
      path: '/admin',
      exact: true,
      icon: <LayoutGrid size={20} />,
    },
    {
      name: 'Courses',
      path: '/admin/courses',
      exact: false,
      icon: <BookOpen size={20} />,
    },
    {
      name: 'Topics',
      path: '/admin/topics',
      exact: false,
      icon: <MessageSquare size={20} />,
    },
    {
      name: 'Prompts',
      path: '/admin/prompts',
      exact: false,
      icon: <FileText size={20} />,
    },
    {
      name: 'Users',
      path: '/admin/users',
      exact: false,
      icon: <Users size={20} />,
    },
  ];

  const isActive = (path: string, exact = false) => (
    exact ? location.pathname === path : location.pathname.startsWith(path)
  );

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b-2 border-[#1A1A1A]">
        <Link to="/admin" className="flex items-center gap-2 group">
          <span className="font-heading font-bold italic text-2xl text-[#1A1A1A] group-hover:text-[#DC2626] transition-colors">
            language coach
          </span>
        </Link>
        <div className="mt-2 inline-block bg-[#DC2626] text-white text-xs font-bold px-2 py-1 hand-drawn-border-pill border-2 border-[#1A1A1A]">
          ADMIN
        </div>
      </div>

      <div className="flex-1 py-6 px-4 space-y-2 overflow-y-auto">
        {navLinks.map((link) => {
          const active = isActive(link.path, link.exact);
          return (
            <Link
              key={link.name}
              to={link.path}
              onClick={() => setIsMobileMenuOpen(false)}
              className={`
                flex items-center gap-3 px-4 py-3 text-lg font-medium transition-colors relative
                ${active ? 'text-[#1A1A1A] bg-[#F59E0B]/20 hand-drawn-border-alt border-2 border-[#1A1A1A]' : 'text-gray-600 hover:text-[#1A1A1A] hover:bg-gray-100 hand-drawn-border-alt border-2 border-transparent'}
              `}
            >
              {link.icon}
              {link.name}
              {active && (
                <SquigglyLine className="absolute -bottom-1 left-4 right-4 h-2 text-[#F59E0B]" />
              )}
            </Link>
          );
        })}
      </div>

      <div className="p-6 border-t-2 border-[#1A1A1A]">
        <Link
          to="/learn"
          className="flex items-center gap-2 text-gray-600 hover:text-[#DC2626] font-medium transition-colors"
        >
          <ArrowLeft size={20} />
          Back to App
        </Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FAFAF8] flex flex-col md:flex-row font-sans text-[#1A1A1A]">
      {/* Mobile Header */}
      <div className="md:hidden border-b-2 border-[#1A1A1A] bg-white p-4 flex justify-between items-center sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <span className="font-heading font-bold italic text-xl">
            language coach
          </span>
          <span className="bg-[#DC2626] text-white text-[10px] font-bold px-1.5 py-0.5 hand-drawn-border-pill border border-[#1A1A1A]">
            ADMIN
          </span>
        </div>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-1"
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-30 bg-white pt-16 border-r-2 border-[#1A1A1A]">
          <SidebarContent />
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden md:block w-64 border-r-2 border-[#1A1A1A] bg-white sticky top-0 h-screen shrink-0">
        <SidebarContent />
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 sm:p-8 overflow-x-hidden">
        <div className="max-w-5xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

export default AdminLayout;
