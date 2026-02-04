import { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import { can } from '../utils/permissions';

const CATEGORIES = [
  { id: 'workshop', label: 'Workshop', labelFr: 'Atelier' },
  { id: 'community', label: 'Community', labelFr: 'Communauté' },
  { id: 'family', label: 'Family', labelFr: 'Famille' },
  { id: 'municipal', label: 'Municipal', labelFr: 'Municipal' },
];

const INITIAL_FORM = {
  titleEn: '',
  titleFr: '',
  descriptionEn: '',
  descriptionFr: '',
  date: '',
  time: '',
  endTime: '',
  endDate: '',
  multiDay: false,
  location: '',
  address: '',
  category: 'community',
  ageGroup: '',
  residents: false,
  maxParticipants: '',
};

function Events() {
  const { municipality, adminData } = useAuth();
  const canCreate = can(adminData?.role, 'events', 'create');
  const canEdit = can(adminData?.role, 'events', 'edit');
  const canDelete = can(adminData?.role, 'events', 'delete');
  const [events, setEvents] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(INITIAL_FORM);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('upcoming');

  useEffect(() => {
    if (municipality) {
      loadEvents();
    }
  }, [municipality]);

  const loadEvents = async () => {
    try {
      const eventsCol = collection(db, 'municipalities', municipality, 'events');
      const q = query(eventsCol, orderBy('date', 'asc'));
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setEvents(data);
    } catch (error) {
      console.log('Error loading events:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    const titleEn = form.titleEn.trim();
    const titleFr = form.titleFr.trim();
    const location = form.location.trim();

    if (!titleEn || !titleFr) {
      alert('Title is required in both English and French');
      return;
    }

    if (!form.date) {
      alert('Date is required');
      return;
    }

    if (!form.time) {
      alert('Start time is required');
      return;
    }

    if (!location) {
      alert('Location is required');
      return;
    }

    let maxParticipants = null;
    if (form.maxParticipants) {
      maxParticipants = parseInt(form.maxParticipants);
      if (isNaN(maxParticipants) || maxParticipants <= 0) {
        alert('Max participants must be a positive number');
        return;
      }
    }

    const eventData = {
      title: { en: titleEn, fr: titleFr },
      description: { en: form.descriptionEn.trim(), fr: form.descriptionFr.trim() },
      date: form.date,
      time: form.time,
      endTime: form.endTime || null,
      multiDay: form.multiDay,
      endDate: form.multiDay ? form.endDate : null,
      location: location,
      address: form.address.trim(),
      category: form.category,
      ageGroup: form.ageGroup.trim() || null,
      residents: form.residents,
      maxParticipants: maxParticipants,
      updatedAt: new Date().toISOString(),
    };

    try {
      if (editingId) {
        await updateDoc(doc(db, 'municipalities', municipality, 'events', editingId), eventData);
      } else {
        eventData.createdAt = new Date().toISOString();
        await addDoc(collection(db, 'municipalities', municipality, 'events'), eventData);
      }

      setShowModal(false);
      setForm(INITIAL_FORM);
      setEditingId(null);
      await loadEvents();
    } catch (error) {
      alert('Error saving event: ' + error.message);
    }
  };

  const handleEdit = (event) => {
    setForm({
      titleEn: event.title?.en || '',
      titleFr: event.title?.fr || '',
      descriptionEn: event.description?.en || '',
      descriptionFr: event.description?.fr || '',
      date: event.date || '',
      time: event.time || '',
      endTime: event.endTime || '',
      endDate: event.endDate || '',
      multiDay: event.multiDay || false,
      location: event.location || '',
      address: event.address || '',
      category: event.category || 'community',
      ageGroup: event.ageGroup || '',
      residents: event.residents || false,
      maxParticipants: event.maxParticipants?.toString() || '',
    });
    setEditingId(event.id);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this event?')) return;

    try {
      await deleteDoc(doc(db, 'municipalities', municipality, 'events', id));
      await loadEvents();
    } catch (error) {
      alert('Error deleting event: ' + error.message);
    }
  };

  const handleDuplicate = (event) => {
    setForm({
      titleEn: event.title?.en || '',
      titleFr: event.title?.fr || '',
      descriptionEn: event.description?.en || '',
      descriptionFr: event.description?.fr || '',
      date: '',
      time: event.time || '',
      endTime: event.endTime || '',
      endDate: '',
      multiDay: event.multiDay || false,
      location: event.location || '',
      address: event.address || '',
      category: event.category || 'community',
      ageGroup: event.ageGroup || '',
      residents: event.residents || false,
      maxParticipants: event.maxParticipants?.toString() || '',
    });
    setEditingId(null);
    setShowModal(true);
  };

  const openNewModal = () => {
    setForm(INITIAL_FORM);
    setEditingId(null);
    setShowModal(true);
  };

  const today = new Date().toISOString().split('T')[0];
  const filteredEvents = events.filter(event => {
    if (filter === 'upcoming') return event.date >= today;
    if (filter === 'past') return event.date < today;
    return true;
  });

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div>
      <div className="page-header">
        <h2>Events</h2>
        <p>Manage community events with bilingual content</p>
      </div>

      <div className="card">
        <div className="card-header">
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              className={`btn ${filter === 'upcoming' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
              onClick={() => setFilter('upcoming')}
            >
              Upcoming
            </button>
            <button
              className={`btn ${filter === 'past' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
              onClick={() => setFilter('past')}
            >
              Past
            </button>
            <button
              className={`btn ${filter === 'all' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
              onClick={() => setFilter('all')}
            >
              All
            </button>
          </div>
          {canCreate && (
            <button className="btn btn-primary" onClick={openNewModal}>
              + New Event
            </button>
          )}
        </div>

        {loading ? (
          <p style={{ color: '#5a6c7d' }}>Loading...</p>
        ) : filteredEvents.length === 0 ? (
          <div className="empty-state">
            <div className="icon">📅</div>
            <p>No {filter === 'all' ? '' : filter} events found</p>
            {canCreate && (
              <button className="btn btn-primary" onClick={openNewModal}>
                Create your first event
              </button>
            )}
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Event</th>
                  <th>Date</th>
                  <th>Category</th>
                  <th>Location</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredEvents.map((event) => (
                  <tr key={event.id}>
                    <td>
                      <strong>{event.title?.en || 'Untitled'}</strong>
                      <br />
                      <span style={{ fontSize: '0.875rem', color: '#5a6c7d' }}>
                        {event.title?.fr || ''}
                      </span>
                    </td>
                    <td>
                      <strong>{formatDate(event.date)}</strong>
                      {event.multiDay && event.endDate && (
                        <span style={{ fontSize: '0.875rem', color: '#5a6c7d' }}>
                          {' → '}{formatDate(event.endDate)}
                        </span>
                      )}
                      <br />
                      <span style={{ fontSize: '0.875rem', color: '#5a6c7d' }}>
                        {event.time}{event.endTime && ` - ${event.endTime}`}
                      </span>
                    </td>
                    <td>
                      <span className={`badge badge-${event.category}`}>
                        {CATEGORIES.find(c => c.id === event.category)?.label || event.category}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.875rem' }}>
                      {event.location}
                      {event.ageGroup && (
                        <span style={{ color: '#5a6c7d' }}> • {event.ageGroup}</span>
                      )}
                    </td>
                    <td>
                      <div className="actions">
                        {canEdit && (
                          <>
                            <button
                              className="btn btn-secondary btn-sm"
                              onClick={() => handleEdit(event)}
                            >
                              Edit
                            </button>
                            <button
                              className="btn btn-secondary btn-sm"
                              onClick={() => handleDuplicate(event)}
                            >
                              Duplicate
                            </button>
                          </>
                        )}
                        {canDelete && (
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => handleDelete(event.id)}
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '700px' }}>
            <div className="modal-header">
              <h3>{editingId ? 'Edit Event' : 'New Event'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label>Title (English) *</label>
                    <input
                      type="text"
                      value={form.titleEn}
                      onChange={(e) => setForm({ ...form, titleEn: e.target.value })}
                      required
                      placeholder="Enter English title"
                    />
                  </div>
                  <div className="form-group">
                    <label>Title (French) *</label>
                    <input
                      type="text"
                      value={form.titleFr}
                      onChange={(e) => setForm({ ...form, titleFr: e.target.value })}
                      required
                      placeholder="Entrez le titre en français"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Description (English) *</label>
                  <textarea
                    value={form.descriptionEn}
                    onChange={(e) => setForm({ ...form, descriptionEn: e.target.value })}
                    required
                    placeholder="Enter event description"
                  />
                </div>

                <div className="form-group">
                  <label>Description (French) *</label>
                  <textarea
                    value={form.descriptionFr}
                    onChange={(e) => setForm({ ...form, descriptionFr: e.target.value })}
                    required
                    placeholder="Entrez la description de l'événement"
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Date *</label>
                    <input
                      type="date"
                      value={form.date}
                      onChange={(e) => setForm({ ...form, date: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>
                      <input
                        type="checkbox"
                        checked={form.multiDay}
                        onChange={(e) => setForm({ ...form, multiDay: e.target.checked })}
                        style={{ width: 'auto', marginRight: '8px' }}
                      />
                      Multi-day event
                    </label>
                    {form.multiDay && (
                      <input
                        type="date"
                        value={form.endDate}
                        onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                        style={{ marginTop: '8px' }}
                        placeholder="End date"
                      />
                    )}
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Start Time *</label>
                    <input
                      type="time"
                      value={form.time}
                      onChange={(e) => setForm({ ...form, time: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>End Time</label>
                    <input
                      type="time"
                      value={form.endTime}
                      onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Location *</label>
                    <input
                      type="text"
                      value={form.location}
                      onChange={(e) => setForm({ ...form, location: e.target.value })}
                      required
                      placeholder="e.g., Centre communautaire"
                    />
                  </div>
                  <div className="form-group">
                    <label>Address</label>
                    <input
                      type="text"
                      value={form.address}
                      onChange={(e) => setForm({ ...form, address: e.target.value })}
                      placeholder="e.g., 1301, rue du Bois"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Category *</label>
                    <select
                      value={form.category}
                      onChange={(e) => setForm({ ...form, category: e.target.value })}
                      required
                    >
                      {CATEGORIES.map(cat => (
                        <option key={cat.id} value={cat.id}>
                          {cat.label} / {cat.labelFr}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Age Group</label>
                    <input
                      type="text"
                      value={form.ageGroup}
                      onChange={(e) => setForm({ ...form, ageGroup: e.target.value })}
                      placeholder="e.g., 18+, 3-8, All ages"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Max Participants</label>
                    <input
                      type="number"
                      value={form.maxParticipants}
                      onChange={(e) => setForm({ ...form, maxParticipants: e.target.value })}
                      placeholder="Leave empty for unlimited"
                    />
                  </div>
                  <div className="form-group">
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '24px' }}>
                      <input
                        type="checkbox"
                        checked={form.residents}
                        onChange={(e) => setForm({ ...form, residents: e.target.checked })}
                        style={{ width: 'auto' }}
                      />
                      Residents only
                    </label>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingId ? 'Save Changes' : 'Create Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Events;
