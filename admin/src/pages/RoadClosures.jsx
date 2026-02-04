import { useState, useEffect, useRef } from 'react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import { can } from '../utils/permissions';

const INITIAL_FORM = {
  titleEn: '',
  titleFr: '',
  descriptionEn: '',
  descriptionFr: '',
  location: '',
  severity: 'partial',
  status: 'active',
  startDate: '',
  endDate: '',
  imageUrl: '',
};

function RoadClosures() {
  const { municipality, adminData } = useAuth();
  const canCreate = can(adminData?.role, 'announcements', 'create'); // Using same permissions as announcements
  const canEdit = can(adminData?.role, 'announcements', 'edit');
  const canDelete = can(adminData?.role, 'announcements', 'delete');
  const [closures, setClosures] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(INITIAL_FORM);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (municipality) {
      loadClosures();
    }
  }, [municipality]);

  const loadClosures = async () => {
    try {
      const closuresCol = collection(db, 'municipalities', municipality, 'roadClosures');
      const q = query(closuresCol, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setClosures(data);
    } catch (error) {
      console.log('Error loading road closures:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be less than 5MB');
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target.result);
    reader.readAsDataURL(file);

    // Upload to Firebase Storage
    setUploading(true);
    try {
      const fileName = `road-closures/${municipality}/${Date.now()}-${file.name}`;
      const storageRef = ref(storage, fileName);
      await uploadBytes(storageRef, file);
      const downloadUrl = await getDownloadURL(storageRef);
      setForm({ ...form, imageUrl: downloadUrl });
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Error uploading image: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = () => {
    setForm({ ...form, imageUrl: '' });
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
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

    if (!location) {
      alert('Location is required');
      return;
    }

    if (!form.startDate) {
      alert('Start date is required');
      return;
    }

    const validSeverities = ['partial', 'full-closure', 'detour'];
    if (!validSeverities.includes(form.severity)) {
      alert('Invalid severity type selected');
      return;
    }

    const validStatuses = ['active', 'scheduled', 'completed'];
    if (!validStatuses.includes(form.status)) {
      alert('Invalid status selected');
      return;
    }

    const closureData = {
      title: { en: titleEn, fr: titleFr },
      description: { en: form.descriptionEn.trim(), fr: form.descriptionFr.trim() },
      location: location,
      severity: form.severity,
      status: form.status,
      startDate: form.startDate || null,
      endDate: form.endDate || null,
      imageUrl: form.imageUrl || null,
      updatedAt: new Date().toISOString(),
    };

    try {
      if (editingId) {
        await updateDoc(doc(db, 'municipalities', municipality, 'roadClosures', editingId), closureData);
      } else {
        closureData.createdAt = new Date().toISOString();
        closureData.createdBy = adminData?.id || null;
        await addDoc(collection(db, 'municipalities', municipality, 'roadClosures'), closureData);
      }

      setShowModal(false);
      setForm(INITIAL_FORM);
      setEditingId(null);
      setImagePreview(null);
      await loadClosures();
    } catch (error) {
      alert('Error saving road closure: ' + error.message);
    }
  };

  const handleEdit = (closure) => {
    setForm({
      titleEn: closure.title?.en || '',
      titleFr: closure.title?.fr || '',
      descriptionEn: closure.description?.en || '',
      descriptionFr: closure.description?.fr || '',
      location: closure.location || '',
      severity: closure.severity || 'partial',
      status: closure.status || 'active',
      startDate: closure.startDate || '',
      endDate: closure.endDate || '',
      imageUrl: closure.imageUrl || '',
    });
    setImagePreview(closure.imageUrl || null);
    setEditingId(closure.id);
    setShowModal(true);
  };

  const handleDelete = async (id, imageUrl) => {
    if (!confirm('Are you sure you want to delete this road closure?')) return;

    try {
      await deleteDoc(doc(db, 'municipalities', municipality, 'roadClosures', id));

      // Optionally delete the image from storage
      if (imageUrl && imageUrl.includes('firebase')) {
        try {
          const imageRef = ref(storage, imageUrl);
          await deleteObject(imageRef);
        } catch (imgError) {
          console.log('Could not delete image:', imgError.message);
        }
      }

      await loadClosures();
    } catch (error) {
      alert('Error deleting road closure: ' + error.message);
    }
  };

  const handleToggleStatus = async (closure) => {
    const newStatus = closure.status === 'active' ? 'completed' : 'active';
    try {
      await updateDoc(doc(db, 'municipalities', municipality, 'roadClosures', closure.id), {
        status: newStatus,
        updatedAt: new Date().toISOString(),
      });
      await loadClosures();
    } catch (error) {
      alert('Error updating road closure: ' + error.message);
    }
  };

  const openNewModal = () => {
    setForm(INITIAL_FORM);
    setEditingId(null);
    setImagePreview(null);
    setShowModal(true);
  };

  const severityColors = {
    'full-closure': { bg: '#f8d7da', color: '#721c24', label: 'Full Closure' },
    'partial': { bg: '#fef3e7', color: '#8b5a2b', label: 'Partial Closure' },
    'detour': { bg: '#e8f4f5', color: '#0d5c63', label: 'Detour' },
  };

  const statusColors = {
    'active': { bg: '#f8d7da', color: '#721c24' },
    'scheduled': { bg: '#fef3e7', color: '#8b5a2b' },
    'completed': { bg: '#d4edda', color: '#155724' },
  };

  return (
    <div>
      <div className="page-header">
        <h2>Road Closures</h2>
        <p>Manage construction and road closure notices for citizens</p>
      </div>

      <div className="card">
        <div className="card-header">
          <h3>All Road Closures</h3>
          {canCreate && (
            <button className="btn btn-primary" onClick={openNewModal}>
              + New Road Closure
            </button>
          )}
        </div>

        {loading ? (
          <p style={{ color: '#5a6c7d' }}>Loading...</p>
        ) : closures.length === 0 ? (
          <div className="empty-state">
            <div className="icon">🚧</div>
            <p>No road closures reported</p>
            {canCreate && (
              <button className="btn btn-primary" onClick={openNewModal}>
                Report a road closure
              </button>
            )}
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Location</th>
                  <th>Severity</th>
                  <th>Status</th>
                  <th>Dates</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {closures.map((closure) => (
                  <tr key={closure.id}>
                    <td>
                      <strong>{closure.title?.en || 'Untitled'}</strong>
                      {closure.imageUrl && (
                        <span style={{ marginLeft: '8px', fontSize: '0.875rem' }}>📷</span>
                      )}
                      <br />
                      <span style={{ fontSize: '0.875rem', color: '#5a6c7d' }}>
                        {closure.title?.fr || ''}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.875rem', color: '#5a6c7d' }}>
                      {closure.location || '-'}
                    </td>
                    <td>
                      <span
                        className="badge"
                        style={{
                          backgroundColor: severityColors[closure.severity]?.bg || '#e8e4dc',
                          color: severityColors[closure.severity]?.color || '#1a1a2e'
                        }}
                      >
                        {severityColors[closure.severity]?.label || closure.severity}
                      </span>
                    </td>
                    <td>
                      <span
                        className="badge"
                        style={{
                          backgroundColor: statusColors[closure.status]?.bg || '#e8e4dc',
                          color: statusColors[closure.status]?.color || '#1a1a2e'
                        }}
                      >
                        {closure.status || 'active'}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.875rem', color: '#5a6c7d' }}>
                      {closure.startDate || 'Now'}
                      {closure.endDate && ` → ${closure.endDate}`}
                    </td>
                    <td>
                      <div className="actions">
                        {canEdit && (
                          <>
                            <button
                              className="btn btn-secondary btn-sm"
                              onClick={() => handleToggleStatus(closure)}
                            >
                              {closure.status === 'active' ? 'Mark Complete' : 'Reactivate'}
                            </button>
                            <button
                              className="btn btn-secondary btn-sm"
                              onClick={() => handleEdit(closure)}
                            >
                              Edit
                            </button>
                          </>
                        )}
                        {canDelete && (
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => handleDelete(closure.id, closure.imageUrl)}
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

      {/* Info Card */}
      <div className="card">
        <div className="card-header">
          <h3>How to Add Map Images</h3>
        </div>
        <div style={{ color: '#5a6c7d', lineHeight: '1.8' }}>
          <ol style={{ marginLeft: '20px' }}>
            <li>Go to <a href="https://www.openstreetmap.org" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary-color)' }}>OpenStreetMap.org</a> (free to use)</li>
            <li>Navigate to the affected area</li>
            <li>Take a screenshot of the map</li>
            <li>Optionally, annotate it with the closure area highlighted</li>
            <li>Upload the image when creating a road closure</li>
          </ol>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '700px' }}>
            <div className="modal-header">
              <h3>{editingId ? 'Edit Road Closure' : 'New Road Closure'}</h3>
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
                      placeholder="e.g., Main Street Construction"
                    />
                  </div>
                  <div className="form-group">
                    <label>Title (French) *</label>
                    <input
                      type="text"
                      value={form.titleFr}
                      onChange={(e) => setForm({ ...form, titleFr: e.target.value })}
                      required
                      placeholder="ex: Construction rue Principale"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Location / Address</label>
                  <input
                    type="text"
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                    placeholder="e.g., 123 Main St, between Oak and Elm"
                  />
                </div>

                <div className="form-group">
                  <label>Description (English)</label>
                  <textarea
                    value={form.descriptionEn}
                    onChange={(e) => setForm({ ...form, descriptionEn: e.target.value })}
                    placeholder="Details about the closure, alternative routes, etc."
                    rows={3}
                  />
                </div>

                <div className="form-group">
                  <label>Description (French)</label>
                  <textarea
                    value={form.descriptionFr}
                    onChange={(e) => setForm({ ...form, descriptionFr: e.target.value })}
                    placeholder="Détails sur la fermeture, routes alternatives, etc."
                    rows={3}
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Severity</label>
                    <select
                      value={form.severity}
                      onChange={(e) => setForm({ ...form, severity: e.target.value })}
                    >
                      <option value="partial">Partial Closure</option>
                      <option value="full-closure">Full Closure</option>
                      <option value="detour">Detour Only</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Status</label>
                    <select
                      value={form.status}
                      onChange={(e) => setForm({ ...form, status: e.target.value })}
                    >
                      <option value="active">Active</option>
                      <option value="scheduled">Scheduled</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Start Date</label>
                    <input
                      type="date"
                      value={form.startDate}
                      onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>End Date (if known)</label>
                    <input
                      type="date"
                      value={form.endDate}
                      onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Map Image (optional)</label>
                  <div style={{
                    border: '2px dashed #e8e4dc',
                    borderRadius: '8px',
                    padding: '20px',
                    textAlign: 'center',
                    backgroundColor: '#f9f7f4'
                  }}>
                    {(imagePreview || form.imageUrl) ? (
                      <div>
                        <img
                          src={imagePreview || form.imageUrl}
                          alt="Map preview"
                          style={{
                            maxWidth: '100%',
                            maxHeight: '200px',
                            borderRadius: '8px',
                            marginBottom: '12px'
                          }}
                        />
                        <br />
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={handleRemoveImage}
                        >
                          Remove Image
                        </button>
                      </div>
                    ) : (
                      <div>
                        <p style={{ color: '#5a6c7d', marginBottom: '12px' }}>
                          {uploading ? 'Uploading...' : 'Upload a screenshot of the affected area'}
                        </p>
                        <input
                          type="file"
                          ref={fileInputRef}
                          accept="image/*"
                          onChange={handleImageChange}
                          style={{ display: 'none' }}
                        />
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploading}
                        >
                          {uploading ? 'Uploading...' : 'Select Image'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={uploading}>
                  {editingId ? 'Save Changes' : 'Create Road Closure'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default RoadClosures;
