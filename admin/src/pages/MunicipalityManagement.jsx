import { useState, useEffect } from 'react';
import {
  collection,
  getDocs,
  doc,
  setDoc,
  updateDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import { can } from '../utils/permissions';
import './MunicipalityManagement.css';

const DEFAULT_COLORS = {
  primary: '#0D5C63',
  secondary: '#E07A5F',
  background: '#F5F0E8'
};

const DEFAULT_FORM = {
  name: '',
  nameEn: '',
  nameFr: '',
  province: 'Quebec',
  logo: '',
  active: true,
  colors: { ...DEFAULT_COLORS },
  contact: {
    website: '',
    phone: '',
    email: ''
  }
};

export default function MunicipalityManagement() {
  const { adminData, isSuperAdmin } = useAuth();
  const [municipalities, setMunicipalities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(DEFAULT_FORM);

  const canManage = can(adminData?.role, 'municipalities', 'create');

  useEffect(() => {
    if (isSuperAdmin()) {
      loadMunicipalities();
    }
  }, []);

  const loadMunicipalities = async () => {
    try {
      setLoading(true);
      setError(null);

      const snapshot = await getDocs(collection(db, 'municipalities'));
      const list = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Sort alphabetically by name
      list.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      setMunicipalities(list);
    } catch (err) {
      console.error('Error loading municipalities:', err);
      setError('Failed to load municipalities');
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setForm(DEFAULT_FORM);
    setEditingId(null);
    setShowModal(true);
  };

  const openEditModal = (municipality) => {
    setForm({
      name: municipality.name || '',
      nameEn: municipality.nameEn || municipality.name || '',
      nameFr: municipality.nameFr || municipality.name || '',
      province: municipality.province || 'Quebec',
      logo: municipality.logo || '',
      active: municipality.active !== false,
      colors: {
        primary: municipality.colors?.primary || DEFAULT_COLORS.primary,
        secondary: municipality.colors?.secondary || DEFAULT_COLORS.secondary,
        background: municipality.colors?.background || DEFAULT_COLORS.background
      },
      contact: {
        website: municipality.contact?.website || '',
        phone: municipality.contact?.phone || '',
        email: municipality.contact?.email || ''
      }
    });
    setEditingId(municipality.id);
    setShowModal(true);
  };

  const generateSlug = (name) => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove accents
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const municipalityData = {
        name: form.name,
        nameEn: form.nameEn || form.name,
        nameFr: form.nameFr || form.name,
        province: form.province,
        logo: form.logo || null,
        active: form.active,
        colors: form.colors,
        contact: form.contact,
        updatedAt: serverTimestamp(),
        updatedBy: adminData.id
      };

      if (editingId) {
        // Update existing municipality
        await updateDoc(doc(db, 'municipalities', editingId), municipalityData);
      } else {
        // Create new municipality
        const slug = generateSlug(form.name);

        // Check if slug already exists
        const existingMunicipalities = municipalities.map(m => m.id);
        if (existingMunicipalities.includes(slug)) {
          setError('A municipality with this name already exists');
          setSaving(false);
          return;
        }

        municipalityData.createdAt = serverTimestamp();
        municipalityData.createdBy = adminData.id;

        // Create the municipality document
        await setDoc(doc(db, 'municipalities', slug), municipalityData);

        // Create a placeholder zone so admins don't get locked out
        await setDoc(doc(db, 'municipalities', slug, 'zones', 'default'), {
          name: 'Default Zone',
          nameEn: 'Default Zone',
          nameFr: 'Zone par défaut',
          description: {
            en: 'Default collection zone',
            fr: 'Zone de collecte par défaut'
          },
          createdAt: serverTimestamp()
        });

        // Create empty schedule document
        await setDoc(doc(db, 'municipalities', slug, 'data', 'schedule'), {
          collectionTypes: [],
          zones: [{
            id: 'default',
            nameEn: 'Default Zone',
            nameFr: 'Zone par défaut',
            descriptionEn: '',
            descriptionFr: ''
          }],
          schedules: {},
          guidelines: {
            timing: { en: '', fr: '' },
            position: { en: [], fr: [] }
          },
          createdAt: serverTimestamp()
        });
      }

      setShowModal(false);
      setForm(DEFAULT_FORM);
      setEditingId(null);
      await loadMunicipalities();
    } catch (err) {
      console.error('Error saving municipality:', err);
      setError('Failed to save municipality');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (municipality) => {
    try {
      await updateDoc(doc(db, 'municipalities', municipality.id), {
        active: !municipality.active,
        updatedAt: serverTimestamp(),
        updatedBy: adminData.id
      });
      await loadMunicipalities();
    } catch (err) {
      console.error('Error toggling municipality status:', err);
      setError('Failed to update municipality status');
    }
  };

  const updateColor = (colorKey, value) => {
    setForm(prev => ({
      ...prev,
      colors: {
        ...prev.colors,
        [colorKey]: value
      }
    }));
  };

  const updateContact = (field, value) => {
    setForm(prev => ({
      ...prev,
      contact: {
        ...prev.contact,
        [field]: value
      }
    }));
  };

  if (!isSuperAdmin()) {
    return (
      <div className="municipality-management">
        <div className="access-denied">
          <h2>Access Denied</h2>
          <p>You do not have permission to view this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="municipality-management">
      <div className="page-header">
        <div>
          <h1>Municipality Management</h1>
          <p className="subtitle">Create and manage municipalities (tenants)</p>
        </div>
        {canManage && (
          <button className="btn btn-primary" onClick={openCreateModal}>
            + Add Municipality
          </button>
        )}
      </div>

      {error && (
        <div className="error-banner">
          {error}
          <button onClick={() => setError(null)}>Dismiss</button>
        </div>
      )}

      {/* Municipalities List */}
      <div className="municipalities-section">
        <h3>All Municipalities ({municipalities.length})</h3>

        {loading ? (
          <div className="loading">Loading municipalities...</div>
        ) : municipalities.length === 0 ? (
          <div className="empty-state">
            <p>No municipalities found</p>
            {canManage && (
              <button className="btn btn-primary" onClick={openCreateModal}>
                Create your first municipality
              </button>
            )}
          </div>
        ) : (
          <div className="municipalities-grid">
            {municipalities.map(municipality => (
              <div
                key={municipality.id}
                className={`municipality-card ${municipality.active === false ? 'inactive' : ''}`}
              >
                <div
                  className="card-header"
                  style={{ backgroundColor: municipality.colors?.primary || DEFAULT_COLORS.primary }}
                >
                  {municipality.logo ? (
                    <img src={municipality.logo} alt={municipality.name} className="municipality-logo" />
                  ) : (
                    <div className="logo-placeholder">
                      {municipality.name?.charAt(0) || '?'}
                    </div>
                  )}
                  <div className="header-info">
                    <h4>{municipality.name}</h4>
                    <span className="province">{municipality.province}</span>
                  </div>
                </div>

                <div className="card-body">
                  <div className="info-row">
                    <span className="label">ID:</span>
                    <code>{municipality.id}</code>
                  </div>
                  <div className="info-row">
                    <span className="label">Status:</span>
                    <span className={`status-badge ${municipality.active !== false ? 'active' : 'inactive'}`}>
                      {municipality.active !== false ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="color-preview">
                    <div
                      className="color-swatch"
                      style={{ backgroundColor: municipality.colors?.primary || DEFAULT_COLORS.primary }}
                      title="Primary"
                    />
                    <div
                      className="color-swatch"
                      style={{ backgroundColor: municipality.colors?.secondary || DEFAULT_COLORS.secondary }}
                      title="Secondary"
                    />
                    <div
                      className="color-swatch"
                      style={{ backgroundColor: municipality.colors?.background || DEFAULT_COLORS.background }}
                      title="Background"
                    />
                  </div>
                </div>

                <div className="card-actions">
                  <button
                    className="btn btn-sm btn-secondary"
                    onClick={() => openEditModal(municipality)}
                  >
                    Edit
                  </button>
                  <button
                    className={`btn btn-sm ${municipality.active !== false ? 'btn-warning' : 'btn-success'}`}
                    onClick={() => handleToggleActive(municipality)}
                  >
                    {municipality.active !== false ? 'Deactivate' : 'Activate'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal modal-large" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingId ? 'Edit Municipality' : 'Create Municipality'}</h2>
              <button className="close-btn" onClick={() => setShowModal(false)}>
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {/* Basic Info */}
                <div className="form-section">
                  <h3>Basic Information</h3>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Display Name *</label>
                      <input
                        type="text"
                        value={form.name}
                        onChange={e => setForm({ ...form, name: e.target.value })}
                        placeholder="e.g., Saint-Lazare"
                        required
                      />
                      {!editingId && form.name && (
                        <small className="help-text">
                          ID will be: <code>{generateSlug(form.name)}</code>
                        </small>
                      )}
                    </div>
                    <div className="form-group">
                      <label>Province *</label>
                      <select
                        value={form.province}
                        onChange={e => setForm({ ...form, province: e.target.value })}
                        required
                      >
                        <option value="Quebec">Quebec</option>
                        <option value="Ontario">Ontario</option>
                        <option value="British Columbia">British Columbia</option>
                        <option value="Alberta">Alberta</option>
                        <option value="Manitoba">Manitoba</option>
                        <option value="Saskatchewan">Saskatchewan</option>
                        <option value="Nova Scotia">Nova Scotia</option>
                        <option value="New Brunswick">New Brunswick</option>
                        <option value="Newfoundland and Labrador">Newfoundland and Labrador</option>
                        <option value="Prince Edward Island">Prince Edward Island</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Name (English)</label>
                      <input
                        type="text"
                        value={form.nameEn}
                        onChange={e => setForm({ ...form, nameEn: e.target.value })}
                        placeholder="e.g., Saint-Lazare"
                      />
                    </div>
                    <div className="form-group">
                      <label>Name (French)</label>
                      <input
                        type="text"
                        value={form.nameFr}
                        onChange={e => setForm({ ...form, nameFr: e.target.value })}
                        placeholder="e.g., Saint-Lazare"
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Logo URL</label>
                    <input
                      type="url"
                      value={form.logo}
                      onChange={e => setForm({ ...form, logo: e.target.value })}
                      placeholder="https://example.com/logo.png"
                    />
                  </div>

                  <div className="form-group">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={form.active}
                        onChange={e => setForm({ ...form, active: e.target.checked })}
                      />
                      Active (visible in mobile app)
                    </label>
                  </div>
                </div>

                {/* Color Theme */}
                <div className="form-section">
                  <h3>Color Theme</h3>
                  <p className="section-description">
                    Customize the app appearance for this municipality
                  </p>
                  <div className="color-inputs">
                    <div className="color-input-group">
                      <label>Primary Color</label>
                      <div className="color-input-row">
                        <input
                          type="color"
                          value={form.colors.primary}
                          onChange={e => updateColor('primary', e.target.value)}
                        />
                        <input
                          type="text"
                          value={form.colors.primary}
                          onChange={e => updateColor('primary', e.target.value)}
                          placeholder="#0D5C63"
                        />
                      </div>
                      <small>Headers, buttons, accents</small>
                    </div>
                    <div className="color-input-group">
                      <label>Secondary Color</label>
                      <div className="color-input-row">
                        <input
                          type="color"
                          value={form.colors.secondary}
                          onChange={e => updateColor('secondary', e.target.value)}
                        />
                        <input
                          type="text"
                          value={form.colors.secondary}
                          onChange={e => updateColor('secondary', e.target.value)}
                          placeholder="#E07A5F"
                        />
                      </div>
                      <small>Highlights, alerts</small>
                    </div>
                    <div className="color-input-group">
                      <label>Background Color</label>
                      <div className="color-input-row">
                        <input
                          type="color"
                          value={form.colors.background}
                          onChange={e => updateColor('background', e.target.value)}
                        />
                        <input
                          type="text"
                          value={form.colors.background}
                          onChange={e => updateColor('background', e.target.value)}
                          placeholder="#F5F0E8"
                        />
                      </div>
                      <small>App background</small>
                    </div>
                  </div>

                  {/* Theme Preview */}
                  <div className="theme-preview" style={{ backgroundColor: form.colors.background }}>
                    <div className="preview-header" style={{ backgroundColor: form.colors.primary }}>
                      <span>Header Preview</span>
                    </div>
                    <div className="preview-content">
                      <button
                        className="preview-button"
                        style={{ backgroundColor: form.colors.primary }}
                      >
                        Primary Button
                      </button>
                      <button
                        className="preview-button"
                        style={{ backgroundColor: form.colors.secondary }}
                      >
                        Secondary Button
                      </button>
                    </div>
                  </div>
                </div>

                {/* Contact Info */}
                <div className="form-section">
                  <h3>Contact Information</h3>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Website</label>
                      <input
                        type="url"
                        value={form.contact.website}
                        onChange={e => updateContact('website', e.target.value)}
                        placeholder="https://www.ville-example.qc.ca"
                      />
                    </div>
                    <div className="form-group">
                      <label>Phone</label>
                      <input
                        type="tel"
                        value={form.contact.phone}
                        onChange={e => updateContact('phone', e.target.value)}
                        placeholder="450-555-1234"
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Email</label>
                    <input
                      type="email"
                      value={form.contact.email}
                      onChange={e => updateContact('email', e.target.value)}
                      placeholder="info@ville-example.qc.ca"
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowModal(false)}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={saving}
                >
                  {saving ? 'Saving...' : (editingId ? 'Save Changes' : 'Create Municipality')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
