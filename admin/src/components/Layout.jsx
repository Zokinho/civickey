import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { can } from '../utils/permissions';
import MunicipalitySwitcher from './MunicipalitySwitcher';

function Layout() {
  const { adminData, municipalityConfig, signOut, isSuperAdmin } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  // Close sidebar when route changes (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  // Apply municipality color theme to CSS variables
  useEffect(() => {
    const root = document.documentElement;
    const colors = municipalityConfig?.colors || {};

    // Set CSS variables with fallbacks
    root.style.setProperty('--primary-color', colors.primary || '#0D5C63');
    root.style.setProperty('--primary-dark', colors.primaryDark || darkenColor(colors.primary || '#0D5C63', 15));
    root.style.setProperty('--primary-light', colors.primaryLight || lightenColor(colors.primary || '#0D5C63', 90));
    root.style.setProperty('--accent-color', colors.accent || '#F4A261');

    return () => {
      // Reset to defaults on unmount
      root.style.setProperty('--primary-color', '#0D5C63');
      root.style.setProperty('--primary-dark', '#0a4a50');
      root.style.setProperty('--primary-light', '#e8f4f5');
      root.style.setProperty('--accent-color', '#F4A261');
    };
  }, [municipalityConfig?.colors]);

  // Helper to darken a hex color
  function darkenColor(hex, percent) {
    const num = parseInt(hex.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.max((num >> 16) - amt, 0);
    const G = Math.max((num >> 8 & 0x00FF) - amt, 0);
    const B = Math.max((num & 0x0000FF) - amt, 0);
    return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
  }

  // Helper to create a light tint of a color
  function lightenColor(hex, percent) {
    const num = parseInt(hex.replace('#', ''), 16);
    const R = (num >> 16);
    const G = (num >> 8 & 0x00FF);
    const B = (num & 0x0000FF);
    // Mix with white
    const newR = Math.round(R + (255 - R) * (percent / 100));
    const newG = Math.round(G + (255 - G) * (percent / 100));
    const newB = Math.round(B + (255 - B) * (percent / 100));
    return '#' + (0x1000000 + newR * 0x10000 + newG * 0x100 + newB).toString(16).slice(1);
  }

  const handleLogout = async () => {
    await signOut();
  };

  return (
    <div className="layout">
      {/* Mobile menu button */}
      <button
        className="mobile-menu-btn"
        onClick={() => setSidebarOpen(!sidebarOpen)}
        aria-label="Toggle menu"
      >
        {sidebarOpen ? '✕' : '☰'}
      </button>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h1>CivicKey</h1>
        </div>
        <MunicipalitySwitcher />
        <nav className="sidebar-nav">
          <NavLink to="/" end className={({ isActive }) => isActive ? 'active' : ''}>
            <span className="icon">📊</span>
            Dashboard
          </NavLink>
          <NavLink to="/announcements" className={({ isActive }) => isActive ? 'active' : ''}>
            <span className="icon">📢</span>
            Announcements
          </NavLink>
          <NavLink to="/events" className={({ isActive }) => isActive ? 'active' : ''}>
            <span className="icon">📅</span>
            Events
          </NavLink>
          <NavLink to="/facilities" className={({ isActive }) => isActive ? 'active' : ''}>
            <span className="icon">🏢</span>
            Facilities
          </NavLink>
          <NavLink to="/schedule" className={({ isActive }) => isActive ? 'active' : ''}>
            <span className="icon">🗓️</span>
            Schedule
          </NavLink>
          <NavLink to="/road-closures" className={({ isActive }) => isActive ? 'active' : ''}>
            <span className="icon">🚧</span>
            Road Closures
          </NavLink>
          {isSuperAdmin() && (
            <>
              <NavLink to="/admins" className={({ isActive }) => isActive ? 'active' : ''}>
                <span className="icon">👥</span>
                Admins
              </NavLink>
              <NavLink to="/municipalities" className={({ isActive }) => isActive ? 'active' : ''}>
                <span className="icon">🏛️</span>
                Municipalities
              </NavLink>
            </>
          )}
        </nav>
        <div className="sidebar-footer">
          <div className="user-info">
            <span className="user-name">{adminData?.name || adminData?.email}</span>
            <span className="user-role">{adminData?.role}</span>
          </div>
          <button onClick={handleLogout} className="logout-btn">
            Logout
          </button>
        </div>
      </aside>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}

export default Layout;
