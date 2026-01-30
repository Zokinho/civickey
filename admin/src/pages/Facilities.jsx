import { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import { can } from '../utils/permissions';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const FACILITY_ICONS = [
  { icon: '🏛️', label: 'City Hall' },
  { icon: '📚', label: 'Library' },
  { icon: '🏊', label: 'Pool/Aquatic' },
  { icon: '🏃', label: 'Recreation' },
  { icon: '⛸️', label: 'Arena/Rink' },
  { icon: '🏢', label: 'Office' },
  { icon: '🚒', label: 'Fire Station' },
  { icon: '👮', label: 'Police' },
  { icon: '🗑️', label: 'Ecocentre' },
  { icon: '🌳', label: 'Parks' },
  { icon: '🎭', label: 'Cultural Center' },
  { icon: '🏥', label: 'Health Services' },
];

const DEFAULT_HOURS = {
  0: { closed: true, open: '', close: '' },
  1: { closed: false, open: '08:30', close: '16:30' },
  2: { closed: false, open: '08:30', close: '16:30' },
  3: { closed: false, open: '08:30', close: '16:30' },
  4: { closed: false, open: '08:30', close: '16:30' },
  5: { closed: false, open: '08:30', close: '16:30' },
  6: { closed: true, open: '', close: '' },
};

const INITIAL_FORM = {
  nameEn: '',
  nameFr: '',
  descriptionEn: '',
  descriptionFr: '',
  icon: '🏛️',
  address: '',
  phone: '',
  website: '',
  hours: { ...DEFAULT_HOURS },
};

function Facilities() {
  const { municipality, adminData } = useAuth();
  const canCreate = can(adminData?.role, 'facilities', 'create');
  const canEdit = can(adminData?.role, 'facilities', 'edit');
  const canDelete = can(adminData?.role, 'facilities', 'delete');
  const [facilities, setFacilities] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(INITIAL_FORM);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (municipality) {
      loadFacilities();
    }
  }, [municipality]);

  const loadFacilities = async () => {
    try {
      const facilitiesCol = collection(db, 'municipalities', municipality, 'facilities');
      const q = query(facilitiesCol, orderBy('name.en', 'asc'));
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setFacilities(data);
    } catch (error) {
      console.log('Error loading facilities:', error.message);
      // If orderBy fails (no index), try without ordering
      try {
        const facilitiesCol = collection(db, 'municipalities', municipality, 'facilities');
        const querySnapshot = await getDocs(facilitiesCol);
        const data = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setFacilities(data);
      } catch (e) {
        console.log('Error loading facilities (fallback):', e.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Clean up hours data
    const cleanHours = {};
    for (let i = 0; i < 7; i++) {
      const dayHours = form.hours[i];
      if (dayHours.closed) {
        cleanHours[i] = { closed: true };
      } else {
        cleanHours[i] = {
          closed: false,
          open: dayHours.open || '09:00',
          close: dayHours.close || '17:00'
        };
      }
    }

    const facilityData = {
      name: { en: form.nameEn, fr: form.nameFr },
      description: { en: form.descriptionEn, fr: form.descriptionFr },
      icon: form.icon,
      address: form.address || null,
      phone: form.phone || null,
      website: form.website || null,
      hours: cleanHours,
      updatedAt: new Date().toISOString(),
    };

    try {
      if (editingId) {
        await updateDoc(doc(db, 'municipalities', municipality, 'facilities', editingId), facilityData);
      } else {
        facilityData.createdAt = new Date().toISOString();
        await addDoc(collection(db, 'municipalities', municipality, 'facilities'), facilityData);
      }

      setShowModal(false);
      setForm(INITIAL_FORM);
      setEditingId(null);
      loadFacilities();
    } catch (error) {
      alert('Error saving facility: ' + error.message);
    }
  };

  const handleEdit = (facility) => {
    // Convert hours from Firestore format to form format
    const hours = { ...DEFAULT_HOURS };
    if (facility.hours) {
      for (let i = 0; i < 7; i++) {
        if (facility.hours[i]) {
          hours[i] = {
            closed: facility.hours[i].closed || false,
            open: facility.hours[i].open || '',
            close: facility.hours[i].close || ''
          };
        }
      }
    }

    setForm({
      nameEn: facility.name?.en || '',
      nameFr: facility.name?.fr || '',
      descriptionEn: facility.description?.en || '',
      descriptionFr: facility.description?.fr || '',
      icon: facility.icon || '🏛️',
      address: facility.address || '',
      phone: facility.phone || '',
      website: facility.website || '',
      hours: hours,
    });
    setEditingId(facility.id);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this facility?')) return;

    try {
      await deleteDoc(doc(db, 'municipalities', municipality, 'facilities', id));
      loadFacilities();
    } catch (error) {
      alert('Error deleting facility: ' + error.message);
    }
  };

  const handleDuplicate = (facility) => {
    const hours = { ...DEFAULT_HOURS };
    if (facility.hours) {
      for (let i = 0; i < 7; i++) {
        if (facility.hours[i]) {
          hours[i] = {
            closed: facility.hours[i].closed || false,
            open: facility.hours[i].open || '',
            close: facility.hours[i].close || ''
          };
        }
      }
    }

    setForm({
      nameEn: facility.name?.en + ' (Copy)' || '',
      nameFr: facility.name?.fr + ' (Copie)' || '',
      descriptionEn: facility.description?.en || '',
      descriptionFr: facility.description?.fr || '',
      icon: facility.icon || '🏛️',
      address: facility.address || '',
      phone: facility.phone || '',
      website: facility.website || '',
      hours: hours,
    });
    setEditingId(null);
    setShowModal(true);
  };

  const openNewModal = () => {
    setForm(INITIAL_FORM);
    setEditingId(null);
    setShowModal(true);
  };

  const updateDayHours = (dayIndex, field, value) => {
    setForm(prev => ({
      ...prev,
      hours: {
        ...prev.hours,
        [dayIndex]: {
          ...prev.hours[dayIndex],
          [field]: field === 'closed' ? value : value
        }
      }
    }));
  };

  const formatTime = (time) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const h = parseInt(hours);
    const suffix = h >= 12 ? 'PM' : 'AM';
    const hour12 = h > 12 ? h - 12 : h === 0 ? 12 : h;
    return `${hour12}:${minutes} ${suffix}`;
  };

  const getTodayStatus = (facility) => {
    const today = new Date().getDay();
    const todayHours = facility.hours?.[today];
    if (!todayHours || todayHours.closed) {
      return { status: 'Closed', color: '#e74c3c' };
    }
    return {
      status: `${formatTime(todayHours.open)} - ${formatTime(todayHours.close)}`,
      color: '#27ae60'
    };
  };

  return (
    <div>
      <div className="page-header">
        <h2>Facilities</h2>
        <p>Manage municipal facility hours and contact information</p>
      </div>

      <div className="card">
        <div className="card-header">
          <span style={{ color: '#5a6c7d' }}>{facilities.length} facilities</span>
          {canCreate && (
            <button className="btn btn-primary" onClick={openNewModal}>
              + New Facility
            </button>
          )}
        </div>

        {loading ? (
          <p style={{ color: '#5a6c7d' }}>Loading...</p>
        ) : facilities.length === 0 ? (
          <div className="empty-state">
            <div className="icon">🏛️</div>
            <p>No facilities added yet</p>
            {canCreate && (
              <button className="btn btn-primary" onClick={openNewModal}>
                Add your first facility
              </button>
            )}
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Facility</th>
                  <th>Today's Hours</th>
                  <th>Contact</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {facilities.map((facility) => {
                  const todayStatus = getTodayStatus(facility);
                  return (
                    <tr key={facility.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ fontSize: '1.5rem' }}>{facility.icon || '🏛️'}</span>
                          <div>
                            <strong>{facility.name?.en || 'Untitled'}</strong>
                            <br />
                            <span style={{ fontSize: '0.875rem', color: '#5a6c7d' }}>
                              {facility.name?.fr || ''}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span style={{ color: todayStatus.color, fontWeight: '500' }}>
                          {todayStatus.status}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.875rem', color: '#5a6c7d' }}>
                        {facility.phone && <div>📞 {facility.phone}</div>}
                        {facility.address && <div>📍 {facility.address.substring(0, 30)}...</div>}
                      </td>
                      <td>
                        <div className="actions">
                          {canEdit && (
                            <>
                              <button
                                className="btn btn-secondary btn-sm"
                                onClick={() => handleEdit(facility)}
                              >
                                Edit
                              </button>
                              <button
                                className="btn btn-secondary btn-sm"
                                onClick={() => handleDuplicate(facility)}
                              >
                                Duplicate
                              </button>
                            </>
                          )}
                          {canDelete && (
                            <button
                              className="btn btn-danger btn-sm"
                              onClick={() => handleDelete(facility.id)}
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '800px' }}>
            <div className="modal-header">
              <h3>{editingId ? 'Edit Facility' : 'New Facility'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                {/* Icon Selection */}
                <div className="form-group">
                  <label>Icon</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {FACILITY_ICONS.map(({ icon, label }) => (
                      <button
                        key={icon}
                        type="button"
                        onClick={() => setForm({ ...form, icon })}
                        style={{
                          padding: '8px 12px',
                          fontSize: '1.5rem',
                          border: form.icon === icon ? '2px solid var(--primary-color)' : '2px solid #e0e0e0',
                          borderRadius: '8px',
                          background: form.icon === icon ? 'var(--primary-light)' : 'white',
                          cursor: 'pointer',
                        }}
                        title={label}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Name (English) *</label>
                    <input
                      type="text"
                      value={form.nameEn}
                      onChange={(e) => setForm({ ...form, nameEn: e.target.value })}
                      required
                      placeholder="e.g., City Hall"
                    />
                  </div>
                  <div className="form-group">
                    <label>Name (French) *</label>
                    <input
                      type="text"
                      value={form.nameFr}
                      onChange={(e) => setForm({ ...form, nameFr: e.target.value })}
                      required
                      placeholder="e.g., Hôtel de ville"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Description (English)</label>
                    <input
                      type="text"
                      value={form.descriptionEn}
                      onChange={(e) => setForm({ ...form, descriptionEn: e.target.value })}
                      placeholder="Brief description"
                    />
                  </div>
                  <div className="form-group">
                    <label>Description (French)</label>
                    <input
                      type="text"
                      value={form.descriptionFr}
                      onChange={(e) => setForm({ ...form, descriptionFr: e.target.value })}
                      placeholder="Brève description"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Address</label>
                  <input
                    type="text"
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                    placeholder="e.g., 1960 Chemin Sainte-Angélique, Saint-Lazare, QC"
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Phone</label>
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      placeholder="e.g., 450-424-8000"
                    />
                  </div>
                  <div className="form-group">
                    <label>Website</label>
                    <input
                      type="url"
                      value={form.website}
                      onChange={(e) => setForm({ ...form, website: e.target.value })}
                      placeholder="e.g., https://ville.saint-lazare.qc.ca"
                    />
                  </div>
                </div>

                {/* Hours Section */}
                <div className="form-group" style={{ marginTop: '20px' }}>
                  <label style={{ marginBottom: '12px', display: 'block' }}>Operating Hours</label>
                  <div style={{
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                    overflow: 'hidden'
                  }}>
                    {DAYS.map((day, index) => (
                      <div
                        key={day}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          padding: '12px 16px',
                          borderBottom: index < 6 ? '1px solid #e0e0e0' : 'none',
                          backgroundColor: index % 2 === 0 ? '#fafafa' : 'white',
                        }}
                      >
                        <span style={{ width: '100px', fontWeight: '500' }}>{day}</span>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={form.hours[index]?.closed || false}
                            onChange={(e) => updateDayHours(index, 'closed', e.target.checked)}
                            style={{ width: 'auto' }}
                          />
                          Closed
                        </label>
                        {!form.hours[index]?.closed && (
                          <>
                            <input
                              type="time"
                              value={form.hours[index]?.open || ''}
                              onChange={(e) => updateDayHours(index, 'open', e.target.value)}
                              style={{ width: '130px' }}
                            />
                            <span>to</span>
                            <input
                              type="time"
                              value={form.hours[index]?.close || ''}
                              onChange={(e) => updateDayHours(index, 'close', e.target.value)}
                              style={{ width: '130px' }}
                            />
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingId ? 'Save Changes' : 'Create Facility'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Facilities;
