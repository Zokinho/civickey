import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, addDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import { can } from '../utils/permissions';

const PAGE_TYPES = [
  { id: 'text', label: 'Text Page' },
  { id: 'info-cards', label: 'Info Cards' },
  { id: 'pdf', label: 'PDF Documents' },
  { id: 'council', label: 'Council Members' },
  { id: 'links', label: 'Useful Links' },
  { id: 'contact', label: 'Contact Page' },
];

const MENU_SECTIONS = {
  services: 'Services',
  city: 'City',
};

function CustomPages() {
  const { municipality, adminData } = useAuth();
  const navigate = useNavigate();
  const canCreate = can(adminData?.role, 'customPages', 'create');
  const canDelete = can(adminData?.role, 'customPages', 'delete');
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNewModal, setShowNewModal] = useState(false);
  const [newPageType, setNewPageType] = useState('text');

  useEffect(() => {
    if (municipality) loadPages();
  }, [municipality]);

  const loadPages = async () => {
    try {
      const pagesCol = collection(db, 'municipalities', municipality, 'pages');
      const q = query(pagesCol, orderBy('menuOrder', 'asc'));
      const snapshot = await getDocs(q);
      setPages(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (error) {
      console.log('Error loading pages:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePage = async () => {
    try {
      const pageData = {
        title: { en: '', fr: '' },
        slug: '',
        type: newPageType,
        status: 'draft',
        showInMenu: false,
        menuSection: 'services',
        menuOrder: pages.length,
        content: {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const docRef = await addDoc(
        collection(db, 'municipalities', municipality, 'pages'),
        pageData
      );
      setShowNewModal(false);
      navigate(`/custom-pages/${docRef.id}`);
    } catch (error) {
      alert('Error creating page: ' + error.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this page?')) return;
    try {
      await deleteDoc(doc(db, 'municipalities', municipality, 'pages', id));
      await loadPages();
    } catch (error) {
      alert('Error deleting page: ' + error.message);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h2>Custom Pages</h2>
        <p>Manage website pages for your municipality</p>
      </div>

      <div className="card">
        <div className="card-header">
          <span>{pages.length} page{pages.length !== 1 ? 's' : ''}</span>
          {canCreate && (
            <button className="btn btn-primary" onClick={() => setShowNewModal(true)}>
              + New Page
            </button>
          )}
        </div>

        {loading ? (
          <p style={{ color: '#5a6c7d', padding: '20px' }}>Loading...</p>
        ) : pages.length === 0 ? (
          <div className="empty-state">
            <div className="icon">📄</div>
            <p>No custom pages yet</p>
            {canCreate && (
              <button className="btn btn-primary" onClick={() => setShowNewModal(true)}>
                Create your first page
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
                  <th>Menu Section</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pages.map((page) => (
                  <tr key={page.id}>
                    <td>
                      <strong>{page.title?.en || 'Untitled'}</strong>
                      <br />
                      <span style={{ fontSize: '0.875rem', color: '#5a6c7d' }}>
                        {page.title?.fr || ''}
                      </span>
                      {page.slug && (
                        <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block' }}>
                          /{page.slug}
                        </span>
                      )}
                    </td>
                    <td>
                      <span className="badge">
                        {PAGE_TYPES.find(t => t.id === page.type)?.label || page.type}
                      </span>
                    </td>
                    <td>
                      {page.showInMenu
                        ? MENU_SECTIONS[page.menuSection] || page.menuSection
                        : 'Hidden'}
                    </td>
                    <td>
                      <span
                        className={`badge ${page.status === 'published' ? 'badge-community' : 'badge-workshop'}`}
                      >
                        {page.status}
                      </span>
                    </td>
                    <td>
                      <div className="actions">
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => navigate(`/custom-pages/${page.id}`)}
                        >
                          Edit
                        </button>
                        {canDelete && (
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => handleDelete(page.id)}
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

      {/* New Page Modal */}
      {showNewModal && (
        <div className="modal-overlay" onClick={() => setShowNewModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3>New Custom Page</h3>
              <button className="modal-close" onClick={() => setShowNewModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Page Type</label>
                <select
                  value={newPageType}
                  onChange={(e) => setNewPageType(e.target.value)}
                >
                  {PAGE_TYPES.map(type => (
                    <option key={type.id} value={type.id}>{type.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowNewModal(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleCreatePage}>
                Create Page
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CustomPages;
