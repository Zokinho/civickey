import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import './MunicipalitySwitcher.css';

export default function MunicipalitySwitcher() {
  const {
    municipality,
    municipalityConfig,
    municipalitiesList,
    loadMunicipalities,
    switchMunicipality,
    isSuperAdmin
  } = useAuth();

  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  // Load municipalities list on mount
  useEffect(() => {
    if (isSuperAdmin()) {
      loadMunicipalities();
    }
  }, [isSuperAdmin, loadMunicipalities]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSwitch = async (municipalityId) => {
    if (municipalityId === municipality) {
      setIsOpen(false);
      return;
    }

    setLoading(true);
    await switchMunicipality(municipalityId);
    setLoading(false);
    setIsOpen(false);
  };

  if (!isSuperAdmin()) {
    // Regular admins just see their municipality name
    return (
      <div className="municipality-display">
        <div
          className="municipality-color-dot"
          style={{ backgroundColor: municipalityConfig?.colors?.primary || '#0D5C63' }}
        />
        <span className="municipality-name">
          {municipalityConfig?.name || municipality || 'Loading...'}
        </span>
      </div>
    );
  }

  const currentMunicipality = municipalitiesList.find(m => m.id === municipality);

  return (
    <div className="municipality-switcher" ref={dropdownRef}>
      <button
        className="switcher-button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={loading}
      >
        <div
          className="municipality-color-dot"
          style={{ backgroundColor: municipalityConfig?.colors?.primary || '#0D5C63' }}
        />
        <span className="municipality-name">
          {loading ? 'Switching...' : (municipalityConfig?.name || municipality || 'Select Municipality')}
        </span>
        <span className={`dropdown-arrow ${isOpen ? 'open' : ''}`}>▼</span>
      </button>

      {isOpen && (
        <div className="switcher-dropdown">
          <div className="dropdown-header">Switch Municipality</div>
          <div className="dropdown-list">
            {municipalitiesList.map((m) => (
              <button
                key={m.id}
                className={`dropdown-item ${m.id === municipality ? 'active' : ''} ${m.active === false ? 'inactive' : ''}`}
                onClick={() => handleSwitch(m.id)}
              >
                <div
                  className="municipality-color-dot"
                  style={{ backgroundColor: m.colors?.primary || '#0D5C63' }}
                />
                <div className="item-info">
                  <span className="item-name">{m.name}</span>
                  {m.active === false && <span className="inactive-badge">Inactive</span>}
                </div>
                {m.id === municipality && <span className="check-mark">✓</span>}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
