import { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import { can } from '../utils/permissions';

const INITIAL_FORM = {
  titleEn: '',
  titleFr: '',
  messageEn: '',
  messageFr: '',
  type: 'info',
  active: true,
  startDate: '',
  endDate: '',
};

function Announcements() {
  const { municipality, adminData } = useAuth();
  const canCreate = can(adminData?.role, 'announcements', 'create');
  const canEdit = can(adminData?.role, 'announcements', 'edit');
  const canDelete = can(adminData?.role, 'announcements', 'delete');
  const [announcements, setAnnouncements] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(INITIAL_FORM);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (municipality) {
      loadAnnouncements();
    }
  }, [municipality]);

  const loadAnnouncements = async () => {
    try {
      const alertsCol = collection(db, 'municipalities', municipality, 'alerts');
      const q = query(alertsCol, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setAnnouncements(data);
    } catch (error) {
      console.log('Error loading announcements:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const announcementData = {
      title: { en: form.titleEn, fr: form.titleFr },
      message: { en: form.messageEn, fr: form.messageFr },
      type: form.type,
      active: form.active,
      startDate: form.startDate || null,
      endDate: form.endDate || null,
      updatedAt: new Date().toISOString(),
    };

    try {
      if (editingId) {
        await updateDoc(doc(db, 'municipalities', municipality, 'alerts', editingId), announcementData);
      } else {
        announcementData.createdAt = new Date().toISOString();
        await addDoc(collection(db, 'municipalities', municipality, 'alerts'), announcementData);
      }

      setShowModal(false);
      setForm(INITIAL_FORM);
      setEditingId(null);
      loadAnnouncements();
    } catch (error) {
      alert('Error saving announcement: ' + error.message);
    }
  };

  const handleEdit = (announcement) => {
    setForm({
      titleEn: announcement.title?.en || '',
      titleFr: announcement.title?.fr || '',
      messageEn: announcement.message?.en || '',
      messageFr: announcement.message?.fr || '',
      type: announcement.type || 'info',
      active: announcement.active ?? true,
      startDate: announcement.startDate || '',
      endDate: announcement.endDate || '',
    });
    setEditingId(announcement.id);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this announcement?')) return;

    try {
      await deleteDoc(doc(db, 'municipalities', municipality, 'alerts', id));
      loadAnnouncements();
    } catch (error) {
      alert('Error deleting announcement: ' + error.message);
    }
  };

  const handleToggleActive = async (announcement) => {
    try {
      await updateDoc(doc(db, 'municipalities', municipality, 'alerts', announcement.id), {
        active: !announcement.active,
        updatedAt: new Date().toISOString(),
      });
      loadAnnouncements();
    } catch (error) {
      alert('Error updating announcement: ' + error.message);
    }
  };

  const openNewModal = () => {
    setForm(INITIAL_FORM);
    setEditingId(null);
    setShowModal(true);
  };

  const typeColors = {
    info: { bg: '#e8f4f5', color: '#0d5c63' },
    warning: { bg: '#fef3e7', color: '#8b5a2b' },
    alert: { bg: '#f8d7da', color: '#721c24' },
    success: { bg: '#d4edda', color: '#155724' },
  };

  return (
    <div>
      <div className="page-header">
        <h2>Announcements</h2>
        <p>Manage messages displayed on the mobile app Home screen</p>
      </div>

      <div className="card">
        <div className="card-header">
          <h3>All Announcements</h3>
          {canCreate && (
            <button className="btn btn-primary" onClick={openNewModal}>
              + New Announcement
            </button>
          )}
        </div>

        {loading ? (
          <p style={{ color: '#5a6c7d' }}>Loading...</p>
        ) : announcements.length === 0 ? (
          <div className="empty-state">
            <div className="icon">📢</div>
            <p>No announcements yet</p>
            {canCreate && (
              <button className="btn btn-primary" onClick={openNewModal}>
                Create your first announcement
              </button>
            )}
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Date Range</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {announcements.map((announcement) => (
                  <tr key={announcement.id}>
                    <td>
                      <strong>{announcement.title?.en || 'Untitled'}</strong>
                      <br />
                      <span style={{ fontSize: '0.875rem', color: '#5a6c7d' }}>
                        {announcement.title?.fr || ''}
                      </span>
                    </td>
                    <td>
                      <span
                        className="badge"
                        style={{
                          backgroundColor: typeColors[announcement.type]?.bg || '#e8e4dc',
                          color: typeColors[announcement.type]?.color || '#1a1a2e'
                        }}
                      >
                        {announcement.type || 'info'}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${announcement.active ? 'badge-active' : 'badge-inactive'}`}>
                        {announcement.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.875rem', color: '#5a6c7d' }}>
                      {announcement.startDate || 'Always'}
                      {announcement.endDate && ` → ${announcement.endDate}`}
                    </td>
                    <td>
                      <div className="actions">
                        {canEdit && (
                          <>
                            <button
                              className="btn btn-secondary btn-sm"
                              onClick={() => handleToggleActive(announcement)}
                            >
                              {announcement.active ? 'Deactivate' : 'Activate'}
                            </button>
                            <button
                              className="btn btn-secondary btn-sm"
                              onClick={() => handleEdit(announcement)}
                            >
                              Edit
                            </button>
                          </>
                        )}
                        {canDelete && (
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => handleDelete(announcement.id)}
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

      {/* Preview Section */}
      <div className="card">
        <div className="card-header">
          <h3>Mobile App Preview</h3>
        </div>
        <p style={{ color: '#5a6c7d', marginBottom: '12px' }}>
          This is how active announcements will appear on the Home screen:
        </p>
        {announcements.filter(a => a.active).slice(0, 1).map(a => (
          <div key={a.id} className="announcement-preview">
            <h4>{a.title?.en}</h4>
            <p>{a.message?.en}</p>
          </div>
        ))}
        {announcements.filter(a => a.active).length === 0 && (
          <p style={{ color: '#5a6c7d', fontStyle: 'italic' }}>No active announcements to preview</p>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingId ? 'Edit Announcement' : 'New Announcement'}</h3>
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
                  <label>Message (English) *</label>
                  <textarea
                    value={form.messageEn}
                    onChange={(e) => setForm({ ...form, messageEn: e.target.value })}
                    required
                    placeholder="Enter the announcement message"
                  />
                </div>

                <div className="form-group">
                  <label>Message (French) *</label>
                  <textarea
                    value={form.messageFr}
                    onChange={(e) => setForm({ ...form, messageFr: e.target.value })}
                    required
                    placeholder="Entrez le message de l'annonce"
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Type</label>
                    <select
                      value={form.type}
                      onChange={(e) => setForm({ ...form, type: e.target.value })}
                    >
                      <option value="info">Info (Blue)</option>
                      <option value="warning">Warning (Orange)</option>
                      <option value="alert">Alert (Red)</option>
                      <option value="success">Success (Green)</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Status</label>
                    <select
                      value={form.active ? 'active' : 'inactive'}
                      onChange={(e) => setForm({ ...form, active: e.target.value === 'active' })}
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Start Date (optional)</label>
                    <input
                      type="date"
                      value={form.startDate}
                      onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>End Date (optional)</label>
                    <input
                      type="date"
                      value={form.endDate}
                      onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingId ? 'Save Changes' : 'Create Announcement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Announcements;
