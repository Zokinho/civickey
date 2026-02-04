import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import { can } from '../utils/permissions';
import TextPageEditor from '../components/page-editors/TextPageEditor';
import InfoCardPageEditor from '../components/page-editors/InfoCardPageEditor';
import PdfPageEditor from '../components/page-editors/PdfPageEditor';
import CouncilPageEditor from '../components/page-editors/CouncilPageEditor';
import LinksPageEditor from '../components/page-editors/LinksPageEditor';
import ContactPageEditor from '../components/page-editors/ContactPageEditor';

const PAGE_TYPE_LABELS = {
  'text': 'Text Page',
  'info-cards': 'Info Cards',
  'pdf': 'PDF Documents',
  'council': 'Council Members',
  'links': 'Useful Links',
  'contact': 'Contact Page',
};

const EDITORS = {
  'text': TextPageEditor,
  'info-cards': InfoCardPageEditor,
  'pdf': PdfPageEditor,
  'council': CouncilPageEditor,
  'links': LinksPageEditor,
  'contact': ContactPageEditor,
};

function CustomPageEditor() {
  const { pageId } = useParams();
  const navigate = useNavigate();
  const { municipality, adminData } = useAuth();
  const canEdit = can(adminData?.role, 'customPages', 'edit');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(null);
  const [form, setForm] = useState({
    titleEn: '',
    titleFr: '',
    slug: '',
    status: 'draft',
    showInMenu: false,
    menuSection: 'services',
    menuOrder: 0,
  });
  const [content, setContent] = useState({});

  useEffect(() => {
    if (municipality && pageId) loadPage();
  }, [municipality, pageId]);

  const loadPage = async () => {
    try {
      const docSnap = await getDoc(
        doc(db, 'municipalities', municipality, 'pages', pageId)
      );
      if (!docSnap.exists()) {
        alert('Page not found');
        navigate('/custom-pages');
        return;
      }
      const data = docSnap.data();
      setPage({ id: docSnap.id, ...data });
      setForm({
        titleEn: data.title?.en || '',
        titleFr: data.title?.fr || '',
        slug: data.slug || '',
        status: data.status || 'draft',
        showInMenu: data.showInMenu || false,
        menuSection: data.menuSection || 'services',
        menuOrder: data.menuOrder || 0,
      });
      setContent(data.content || {});
    } catch (error) {
      console.log('Error loading page:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    const titleEn = form.titleEn.trim();
    const titleFr = form.titleFr.trim();
    const slug = form.slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-');

    if (!titleEn || !titleFr) {
      alert('Title is required in both English and French');
      return;
    }
    if (!slug) {
      alert('URL slug is required');
      return;
    }

    // Check slug uniqueness
    setSaving(true);
    try {
      const slugQuery = query(
        collection(db, 'municipalities', municipality, 'pages'),
        where('slug', '==', slug)
      );
      const slugSnap = await getDocs(slugQuery);
      const duplicate = slugSnap.docs.find((d) => d.id !== pageId);
      if (duplicate) {
        alert('This URL slug is already used by another page. Please choose a different slug.');
        setSaving(false);
        return;
      }

      await updateDoc(doc(db, 'municipalities', municipality, 'pages', pageId), {
        title: { en: titleEn, fr: titleFr },
        slug,
        status: form.status,
        showInMenu: form.showInMenu,
        menuSection: form.menuSection,
        menuOrder: parseInt(form.menuOrder) || 0,
        content,
        updatedAt: new Date().toISOString(),
      });
      alert('Page saved successfully!');
    } catch (error) {
      alert('Error saving page: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p style={{ color: '#5a6c7d', padding: '20px' }}>Loading...</p>;
  if (!page) return null;

  const TypeEditor = EDITORS[page.type];

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button className="btn btn-secondary btn-sm" onClick={() => navigate('/custom-pages')}>
          &larr; Back
        </button>
        <div>
          <h2>{form.titleEn || 'Untitled Page'}</h2>
          <p>{PAGE_TYPE_LABELS[page.type] || page.type}</p>
        </div>
      </div>

      {/* Common fields */}
      <div className="card">
        <div className="card-header">
          <h3>Page Settings</h3>
        </div>
        <div style={{ padding: '20px' }}>
          <div className="form-row">
            <div className="form-group">
              <label>Title (English) *</label>
              <input
                type="text"
                value={form.titleEn}
                onChange={(e) => setForm({ ...form, titleEn: e.target.value })}
                placeholder="Page title"
                disabled={!canEdit}
              />
            </div>
            <div className="form-group">
              <label>Title (French) *</label>
              <input
                type="text"
                value={form.titleFr}
                onChange={(e) => setForm({ ...form, titleFr: e.target.value })}
                placeholder="Titre de la page"
                disabled={!canEdit}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>URL Slug *</label>
              <input
                type="text"
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                placeholder="e.g., about-us"
                disabled={!canEdit}
              />
              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                Will be accessible at: /{form.slug || 'slug'}
              </span>
            </div>
            <div className="form-group">
              <label>Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                disabled={!canEdit}
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  checked={form.showInMenu}
                  onChange={(e) => setForm({ ...form, showInMenu: e.target.checked })}
                  style={{ width: 'auto' }}
                  disabled={!canEdit}
                />
                Show in navigation menu
              </label>
            </div>
            {form.showInMenu && (
              <>
                <div className="form-group">
                  <label>Menu Section</label>
                  <select
                    value={form.menuSection}
                    onChange={(e) => setForm({ ...form, menuSection: e.target.value })}
                    disabled={!canEdit}
                  >
                    <option value="services">Services</option>
                    <option value="city">City</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Menu Order</label>
                  <input
                    type="number"
                    value={form.menuOrder}
                    onChange={(e) => setForm({ ...form, menuOrder: e.target.value })}
                    min="0"
                    disabled={!canEdit}
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Type-specific editor */}
      <div className="card" style={{ marginTop: '20px' }}>
        <div className="card-header">
          <h3>Page Content</h3>
        </div>
        <div style={{ padding: '20px' }}>
          {TypeEditor ? (
            <TypeEditor content={content} onChange={setContent} disabled={!canEdit} />
          ) : (
            <p style={{ color: '#5a6c7d' }}>Unknown page type: {page.type}</p>
          )}
        </div>
      </div>

      {canEdit && (
        <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <button className="btn btn-secondary" onClick={() => navigate('/custom-pages')}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Page'}
          </button>
        </div>
      )}
    </div>
  );
}

export default CustomPageEditor;
