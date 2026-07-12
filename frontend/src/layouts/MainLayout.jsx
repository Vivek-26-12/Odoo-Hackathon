import React, { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { 
  Shield, 
  LayoutDashboard, 
  Building2, 
  Boxes, 
  Users, 
  Calendar, 
  Wrench, 
  ClipboardCheck, 
  BarChart3, 
  History, 
  User, 
  LogOut, 
  Menu, 
  X, 
  Bell, 
  Check,
  ArrowLeftRight
} from 'lucide-react';
import api from '../services/api.js';

const MainLayout = () => {
  const { user, logoutUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch notifications if user is logged in
  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const response = await api.get('/notifications');
      if (response.data.success) {
        setNotifications(response.data.notifications);
        const unread = response.data.notifications.filter(n => !n.is_read).length;
        setUnreadCount(unread);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error.message);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Poll every 30 seconds for new alerts (overdues, approvals)
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const markAllRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      fetchNotifications();
    } catch (error) {
      console.error('Error marking all as read:', error.message);
    }
  };

  const handleNotificationClick = async (notif) => {
    if (notif.is_read) return;
    try {
      await api.patch(`/notifications/${notif.id}/read`);
      fetchNotifications();
    } catch (error) {
      console.error('Error marking notification read:', error.message);
    }
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error.message);
    }
  };

  const isActive = (path) => location.pathname === path;

  // Sidebar navigation mapping
  const navigationItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, requiredRoles: ['admin', 'asset_manager', 'dept_head', 'employee'] },
    { name: 'Organization Setup', path: '/org-setup', icon: Building2, requiredRoles: ['admin'] },
    { name: 'Assets Directory', path: '/assets', icon: Boxes, requiredRoles: ['admin', 'asset_manager', 'dept_head', 'employee'] },
    { name: 'Allocations & Transfers', path: '/allocations', icon: ArrowLeftRight, requiredRoles: ['admin', 'asset_manager', 'dept_head', 'employee'] },
    { name: 'Resource Bookings', path: '/bookings', icon: Calendar, requiredRoles: ['admin', 'asset_manager', 'dept_head', 'employee'] },
    { name: 'Maintenance Requests', path: '/maintenance', icon: Wrench, requiredRoles: ['admin', 'asset_manager', 'dept_head', 'employee'] },
    { name: 'Asset Audits', path: '/audits', icon: ClipboardCheck, requiredRoles: ['admin', 'asset_manager', 'dept_head', 'employee'] },
    { name: 'Reports & Analytics', path: '/reports', icon: BarChart3, requiredRoles: ['admin', 'asset_manager', 'dept_head'] },
    { name: 'Activity Audit Logs', path: '/logs', icon: History, requiredRoles: ['admin', 'asset_manager', 'dept_head'] }
  ];

  const filteredNavItems = navigationItems.filter(item => {
    if (!user) return false;
    return item.requiredRoles.includes(user.role);
  });

  return (
    <div className="min-h-screen flex bg-slate-950 text-slate-100 font-sans">
      
      {/* 1. DESKTOP SIDEBAR */}
      {user && (
        <aside className="hidden lg:flex lg:flex-col lg:w-72 lg:fixed lg:inset-y-0 border-r border-slate-900 bg-slate-950/70 backdrop-blur-xl z-30">
          {/* Sidebar Header / Logo */}
          <div className="flex items-center h-16 px-6 border-b border-slate-900">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="p-1.5 bg-gradient-to-tr from-purple-600 to-indigo-500 rounded-lg group-hover:scale-105 transition-transform duration-200 shadow-lg shadow-purple-500/20">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <span className="font-extrabold text-xl tracking-wide bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                AssetFlow
              </span>
            </Link>
          </div>

          {/* Sidebar Menu Items */}
          <div className="flex-1 flex flex-col overflow-y-auto px-4 py-6 space-y-1.5">
            {filteredNavItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                    active
                      ? 'text-white bg-gradient-to-r from-purple-500/20 to-indigo-500/10 border-l-4 border-purple-500 shadow-inner'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${active ? 'text-purple-400' : 'text-slate-400 group-hover:text-slate-300'}`} />
                  {item.name}
                </Link>
              );
            })}
          </div>

          {/* Sidebar Footer / User Profile Summary */}
          <div className="p-4 border-t border-slate-900 bg-slate-950/40">
            <div className="flex items-center gap-3 px-2 py-1">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
                {user.full_name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-200 truncate">{user.full_name}</p>
                <p className="text-xs text-slate-400 capitalize truncate">{user.role.replace('_', ' ')}</p>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 hover:bg-rose-950/30 text-slate-400 hover:text-rose-400 rounded-lg transition-colors cursor-pointer"
                title="Log Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </aside>
      )}

      {/* 2. MAIN CONTENT AREA (Offset on Desktop) */}
      <div className={`flex flex-col flex-1 ${user ? 'lg:pl-72' : ''}`}>
        
        {/* Top Navbar Header */}
        <header className="h-16 border-b border-slate-900 bg-slate-950/60 backdrop-blur-md sticky top-0 z-40 flex items-center justify-between px-4 sm:px-6 lg:px-8">
          
          {/* Mobile Hamburguer menu + Logo */}
          <div className="flex items-center gap-4">
            {user && (
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-900 focus:outline-none"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            )}

            {!user && (
              <Link to="/" className="flex items-center gap-2">
                <div className="p-1 bg-gradient-to-tr from-purple-600 to-indigo-500 rounded-lg">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold text-lg text-white">AssetFlow</span>
              </Link>
            )}

            <div className="hidden lg:block text-sm font-semibold text-slate-400 capitalize">
              {location.pathname === '/' ? 'Home' : location.pathname.substring(1).replace('-', ' ')}
            </div>
          </div>

          {/* User Options & Notifications */}
          <div className="flex items-center gap-4">
            {user ? (
              <>
                {/* NOTIFICATIONS DROPDOWN */}
                <div className="relative">
                  <button
                    onClick={() => setNotificationsOpen(!notificationsOpen)}
                    className="p-2 bg-slate-900/60 hover:bg-slate-900 border border-slate-800 rounded-xl text-slate-300 hover:text-white transition-all cursor-pointer relative"
                    title="Alerts"
                  >
                    <Bell className="w-4.5 h-4.5" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-purple-600 rounded-full text-[10px] font-bold flex items-center justify-center text-white ring-2 ring-slate-950">
                        {unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Dropdown Box */}
                  {notificationsOpen && (
                    <div className="absolute right-0 mt-3 w-80 sm:w-96 glass-card rounded-2xl shadow-2xl border border-slate-800/80 overflow-hidden z-50">
                      <div className="px-4 py-3 border-b border-slate-900 flex justify-between items-center bg-slate-950/40">
                        <span className="font-bold text-sm text-slate-200">Alert Notifications</span>
                        {unreadCount > 0 && (
                          <button
                            onClick={markAllRead}
                            className="text-xs text-purple-400 hover:text-purple-300 font-semibold cursor-pointer"
                          >
                            Mark all read
                          </button>
                        )}
                      </div>
                      <div className="max-h-72 overflow-y-auto divide-y divide-slate-900/60">
                        {notifications.length === 0 ? (
                          <div className="px-4 py-6 text-center text-slate-500 text-sm">
                            No notifications at this time.
                          </div>
                        ) : (
                          notifications.map((n) => (
                            <div
                              key={n.id}
                              onClick={() => handleNotificationClick(n)}
                              className={`px-4 py-3 text-left transition-colors cursor-pointer ${
                                n.is_read ? 'bg-transparent text-slate-400' : 'bg-purple-950/10 text-slate-200 hover:bg-purple-950/20'
                              }`}
                            >
                              <div className="flex justify-between items-start gap-2">
                                <span className="font-bold text-xs capitalize text-purple-400">{n.type.replace('_', ' ')}</span>
                                <span className="text-[10px] text-slate-500">{new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                              </div>
                              <p className="font-semibold text-xs mt-1">{n.title}</p>
                              <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{n.message}</p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Profile Link (Avatar) */}
                <Link
                  to="/profile"
                  className="flex items-center gap-2.5 p-1 px-2 hover:bg-slate-900 rounded-xl transition-all"
                >
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center font-bold text-indigo-400 text-xs">
                    {user.full_name.charAt(0).toUpperCase()}
                  </div>
                  <span className="hidden sm:inline text-xs font-bold text-slate-300">{user.full_name}</span>
                </Link>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <Link to="/login" className="text-slate-300 hover:text-white text-sm font-semibold px-3 py-2 transition-colors">
                  Log In
                </Link>
                <Link to="/register" className="btn-primary text-xs px-4 py-2">
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </header>

        {/* 3. MOBILE MENU SIDE DRAWER */}
        {mobileMenuOpen && user && (
          <div className="fixed inset-0 z-50 lg:hidden">
            {/* Backdrop */}
            <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
            
            {/* Slide Drawer Content */}
            <div className="fixed inset-y-0 left-0 w-72 bg-slate-950 border-r border-slate-900 p-6 flex flex-col justify-between shadow-2xl z-50 animate-slide-in">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-purple-500" />
                    <span className="font-bold text-lg text-white">AssetFlow</span>
                  </div>
                  <button onClick={() => setMobileMenuOpen(false)} className="p-1 hover:bg-slate-900 rounded-lg">
                    <X className="w-5 h-5 text-slate-400" />
                  </button>
                </div>

                <div className="space-y-1">
                  {filteredNavItems.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.path);
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                          active
                            ? 'text-white bg-purple-500/20 border-l-4 border-purple-500'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        {item.name}
                      </Link>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-900 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-600 flex items-center justify-center font-bold text-sm text-white">
                  {user.full_name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-200 truncate">{user.full_name}</p>
                  <p className="text-xs text-slate-400 capitalize truncate">{user.role}</p>
                </div>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleLogout();
                  }}
                  className="p-2 hover:bg-rose-950/30 text-rose-400 rounded-lg"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main Body Content Outlet */}
        <main className="flex-1 overflow-x-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Outlet />
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-slate-900/40 bg-slate-950/20 py-6 text-center text-xs text-slate-500 mt-auto">
          <p>&copy; 2026 AssetFlow Enterprise Asset & Resource Management. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
};

export default MainLayout;
