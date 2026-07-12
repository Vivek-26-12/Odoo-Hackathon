import React, { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Shield, Menu, X, LogOut, User, LayoutDashboard, Home as HomeIcon } from 'lucide-react';

const MainLayout = () => {
  const { user, logoutUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logoutUser();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error.message);
    }
  };

  const isActive = (path) => location.pathname === path;

  const navLinks = [
    { name: 'Home', path: '/', icon: HomeIcon, publicOnly: false },
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, protected: true },
    { name: 'Profile', path: '/profile', icon: User, protected: true },
  ];

  const visibleLinks = navLinks.filter(link => {
    if (link.protected && !user) return false;
    return true;
  });

  return (
    <div className="min-h-screen flex flex-col relative bg-slate-950 text-slate-100">
      {/* Header / Navbar */}
      <nav className="glass-card border-b border-slate-900 sticky top-0 z-50 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center">
              <Link to="/" className="flex items-center gap-2 group">
                <div className="p-1.5 bg-gradient-to-tr from-purple-600 to-indigo-500 rounded-lg group-hover:scale-105 transition-transform duration-200">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold text-lg tracking-wide bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                  OTP Initiate
                </span>
              </Link>
            </div>

            {/* Desktop Navigation Links */}
            <div className="hidden md:flex items-center gap-6">
              {visibleLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive(link.path)
                        ? 'text-purple-400 bg-purple-500/10'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/40'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {link.name}
                  </Link>
                );
              })}
            </div>

            {/* Session Controls */}
            <div className="hidden md:flex items-center gap-4">
              {user ? (
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm font-medium text-slate-200">{user.full_name}</p>
                    <p className="text-xs text-slate-400">{user.email}</p>
                  </div>
                  
                  <Link 
                    to="/profile" 
                    className="p-2 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg border border-slate-700/50 transition-colors"
                    title="View Profile"
                  >
                    <User className="w-4 h-4" />
                  </Link>

                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-rose-950/40 hover:bg-rose-900/50 text-rose-300 hover:text-rose-200 border border-rose-900/30 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    Log Out
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <Link to="/login" className="text-slate-300 hover:text-white text-sm font-medium px-3.5 py-2 transition-colors">
                    Log In
                  </Link>
                  <Link to="/register" className="btn-primary text-sm px-4 py-2">
                    Sign Up
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <div className="flex md:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/50 focus:outline-none"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-900 bg-slate-950/95 backdrop-blur-lg px-2 pt-2 pb-4 space-y-1 shadow-inner">
            {visibleLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-3 rounded-lg text-base font-medium transition-all ${
                    isActive(link.path)
                      ? 'text-purple-400 bg-purple-500/10'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/40'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {link.name}
                </Link>
              );
            })}

            {/* Mobile Auth options */}
            <div className="pt-4 mt-4 border-t border-slate-900 px-3">
              {user ? (
                <div className="space-y-3">
                  <div>
                    <p className="text-base font-medium text-slate-200">{user.full_name}</p>
                    <p className="text-sm text-slate-400">{user.email}</p>
                  </div>
                  
                  <div className="flex gap-2">
                    <Link
                      to="/profile"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-sm border border-slate-700/50"
                    >
                      <User className="w-4 h-4" />
                      View Profile
                    </Link>
                    <button
                      onClick={() => {
                        setMobileMenuOpen(false);
                        handleLogout();
                      }}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-rose-950/40 hover:bg-rose-900/50 text-rose-300 rounded-lg text-sm border border-rose-900/30"
                    >
                      <LogOut className="w-4 h-4" />
                      Log Out
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-2.5">
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full text-center py-2.5 text-slate-300 hover:text-white border border-slate-800 hover:bg-slate-900 rounded-lg text-sm"
                  >
                    Log In
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full text-center py-2.5 btn-primary rounded-lg text-sm"
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Main Body */}
      <main className="flex-grow flex flex-col">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900/80 bg-slate-950/40 py-6 text-center text-xs text-slate-500 mt-auto">
        <p>&copy; 2026 Odoo Hackathon Auth Application. All rights reserved.</p>
        <p className="mt-1">Built with React 19, Tailwind CSS, Express, and Aiven MySQL.</p>
      </footer>
    </div>
  );
};

export default MainLayout;
