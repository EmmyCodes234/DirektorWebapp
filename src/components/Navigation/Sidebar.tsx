import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Home, 
  Trophy, 
  Plus, 
  Settings, 
  User, 
  HelpCircle, 
  ChevronLeft, 
  ChevronRight,
  LogOut
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { get, set } from 'idb-keyval';

interface SidebarProps {
  onSignOut?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onSignOut }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Check if sidebar state is stored
    get('sidebar-collapsed').then((value) => {
      if (value !== undefined) {
        setCollapsed(value);
      }
    });

    // Check if mobile
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) {
        setCollapsed(true);
        setIsOpen(false);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const toggleCollapse = () => {
    const newState = !collapsed;
    setCollapsed(newState);
    set('sidebar-collapsed', newState);
  };

  const toggleMobileSidebar = () => {
    setIsOpen(!isOpen);
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      if (onSignOut) {
        onSignOut();
      }
      navigate('/');
    } catch (err) {
      console.error('Error signing out:', err);
      navigate('/');
    }
  };

  const isActive = (path: string) => {
    return location.pathname.startsWith(path);
  };

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: Home },
    { path: '/tournaments', label: 'My Tournaments', icon: Trophy },
    { path: '/new-tournament', label: 'Create New', icon: Plus },
    { path: '/settings', label: 'Settings', icon: Settings },
    { path: '/profile', label: 'Profile', icon: User },
    { path: '/help', label: 'Help', icon: HelpCircle },
  ];

  // Mobile sidebar
  if (isMobile) {
    return (
      <>
        {/* Mobile Toggle Button */}
        <button
          onClick={toggleMobileSidebar}
          className="fixed top-4 left-4 z-40 p-2 bg-gray-800/80 backdrop-blur-sm rounded-lg text-gray-300 hover:text-white border border-gray-700/50"
        >
          {isOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
        </button>

        {/* Mobile Sidebar */}
        <div
          className={`fixed inset-0 z-30 transition-all duration-300 ${
            isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          }`}
        >
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />

          {/* Sidebar Content */}
          <div className={`absolute top-0 left-0 h-full w-64 bg-gray-900/95 backdrop-blur-lg border-r border-gray-800/50 transform transition-transform duration-300 ${
            isOpen ? 'translate-x-0' : '-translate-x-full'
          }`}>
            <div className="p-4 border-b border-gray-800/50">
              <h2 className="text-xl font-bold text-white font-orbitron">DIREKTOR</h2>
              <p className="text-sm text-gray-400 font-jetbrains">Tournament Manager</p>
            </div>

            <nav className="p-4 space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.path}
                    onClick={() => {
                      navigate(item.path);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                      isActive(item.path)
                        ? 'bg-blue-600/20 text-blue-400 border border-blue-500/50'
                        : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                    }`}
                  >
                    <Icon size={20} />
                    <span className="font-jetbrains">{item.label}</span>
                  </button>
                );
              })}
            </nav>

            <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-800/50">
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-3 px-4 py-3 bg-red-600/20 text-red-400 hover:bg-red-600/30 hover:text-white rounded-lg border border-red-500/50 transition-all duration-200"
              >
                <LogOut size={20} />
                <span className="font-jetbrains">Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Desktop sidebar
  return (
    <div
      className={`h-screen bg-gray-900/95 backdrop-blur-lg border-r border-gray-800/50 transition-all duration-300 ${
        collapsed ? 'w-20' : 'w-64'
      } flex flex-col`}
    >
      <div className={`p-4 border-b border-gray-800/50 ${collapsed ? 'items-center' : ''}`}>
        {collapsed ? (
          <div className="flex justify-center">
            <span className="text-2xl font-bold text-white font-orbitron">D</span>
          </div>
        ) : (
          <>
            <h2 className="text-xl font-bold text-white font-orbitron">DIREKTOR</h2>
            <p className="text-sm text-gray-400 font-jetbrains">Tournament Manager</p>
          </>
        )}
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                isActive(item.path)
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-500/50'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
              } ${collapsed ? 'justify-center' : ''}`}
              title={collapsed ? item.label : undefined}
            >
              <Icon size={20} />
              {!collapsed && <span className="font-jetbrains">{item.label}</span>}
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-800/50">
        <button
          onClick={toggleCollapse}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-800/50 text-gray-400 hover:text-white rounded-lg transition-all duration-200"
        >
          {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          {!collapsed && <span className="font-jetbrains text-sm">Collapse</span>}
        </button>

        <button
          onClick={handleSignOut}
          className={`w-full mt-4 flex items-center gap-3 px-4 py-3 bg-red-600/20 text-red-400 hover:bg-red-600/30 hover:text-white rounded-lg border border-red-500/50 transition-all duration-200 ${
            collapsed ? 'justify-center' : ''
          }`}
          title={collapsed ? 'Sign Out' : undefined}
        >
          <LogOut size={20} />
          {!collapsed && <span className="font-jetbrains">Sign Out</span>}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;