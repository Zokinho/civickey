import { useState, useEffect } from 'react';
import { doc, updateDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import { can } from '../utils/permissions';
import NavigationEditor from '../components/NavigationEditor';

const BASE_DOMAIN = 'civickey.ca';

function WebsiteSettings() {
  const { municipality, municipalityConfig, adminData } = useAuth();
  const canEdit = can(adminData?.role, 'websiteSettings', 'edit');
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    enabled: false,
    heroTaglineEn: '',
    heroTaglineFr: '',
    heroImage: '',
    heroImagePosition: '50% 50%',
    address: '',
    phone: '',
    email: '',
    facebook: '',
    twitter: '',
    instagram: '',
    youtube: '',
    customDomain: '',
  });
  const [navigation, setNavigation] = useState([]);
  const [pages, setPages] = useState([]);
  const [domainStatus, setDomainStatus] = useState(null);
  const [verifying, setVerifying] = useState(false);
  const [savedDomain, setSavedDomain] = useState('');

  useEffect(() => {
    if (municipalityConfig?.website) {
      const w = municipalityConfig.website;
      setForm({
        enabled: w.enabled || false,
        heroTaglineEn: w.heroTagline?.en || '',
        heroTaglineFr: w.heroTagline?.fr || '',
        heroImage: w.heroImage || '',
        heroImagePosition: w.heroImagePosition || '50% 50%',
        address: w.footer?.address || '',
        phone: w.footer?.phone || '',
        email: w.footer?.email || '',
        facebook: w.footer?.facebook || '',
        twitter: w.footer?.twitter || '',
        instagram: w.footer?.instagram || '',
        youtube: w.footer?.youtube || '',
        customDomain: w.customDomain || '',
      });
      setNavigation(w.navigation || []);
      setDomainStatus(w.domainVerified ? 'verified' : null);
      setSavedDomain(w.customDomain || '');
    }
  }, [municipalityConfig]);

  useEffect(() => {
    if (!municipality) return;
    const loadPages = async () => {
      try {
        const pagesCol = collection(db, 'municipalities', municipality, 'pages');
        const q = query(pagesCol, where('status', '==', 'published'));
        const snapshot = await getDocs(q);
        setPages(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch (error) {
        console.log('Error loading pages for nav editor:', error.message);
      }
    };
    loadPages();
  }, [municipality]);

  const validateUrl = (url) => {
    if (!url) return true;
    try { new URL(url); return true; } catch { return false; }
  };

  const validateEmail = (email) => {
    if (!email) return true;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const syncVercelDomain = async (oldDomain, newDomain) => {
    const apiUrl = import.meta.env.VITE_DOMAINS_API_URL;
    const apiSecret = import.meta.env.VITE_DOMAINS_API_SECRET;
    if (!apiUrl || !apiSecret) return;

    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiSecret}`,
    };

    if (oldDomain && oldDomain !== newDomain) {
      try {
        await fetch(`${apiUrl}/api/domains`, { method: 'POST', headers, body: JSON.stringify({ domain: oldDomain, action: 'remove' }) });
      } catch (err) {
        console.error('Failed to remove old domain from Vercel:', err);
      }
    }

    if (newDomain) {
      try {
        const resp = await fetch(`${apiUrl}/api/domains`, { method: 'POST', headers, body: JSON.stringify({ domain: newDomain, action: 'add' }) });
        const data = await resp.json();
        if (!resp.ok) {
          console.error('Failed to add domain to Vercel:', data.error);
        }
      } catch (err) {
        console.error('Failed to add domain to Vercel:', err);
      }
    }
  };

  const handleSave = async () => {
    if (!canEdit) return;

    const email = form.email.trim();
    if (email && !validateEmail(email)) {
      alert('Please enter a valid email address.');
      return;
    }

    const urlFields = { facebook: form.facebook, twitter: form.twitter, instagram: form.instagram, youtube: form.youtube };
    for (const [name, value] of Object.entries(urlFields)) {
      if (value.trim() && !validateUrl(value.trim())) {
        alert(`Please enter a valid URL for ${name}.`);
        return;
      }
    }

    if (!NavigationEditor.validate(navigation)) {
      alert('Please fix navigation menu errors before saving.');
      return;
    }

    setLoading(true);

    // Firestore rejects undefined values — strip them from navigation objects
    const cleanNav = navigation.map((item) => {
      const clean = Object.fromEntries(
        Object.entries(item).filter(([, v]) => v !== undefined)
      );
      if (clean.children) {
        clean.children = clean.children.map((child) =>
          Object.fromEntries(Object.entries(child).filter(([, v]) => v !== undefined))
        );
      }
      return clean;
    });

    try {
      const websiteData = {
        website: {
          enabled: form.enabled,
          subdomain: municipality,
          heroTagline: { en: form.heroTaglineEn.trim(), fr: form.heroTaglineFr.trim() },
          heroImage: form.heroImage,
          heroImagePosition: form.heroImagePosition,
          navigation: cleanNav.length > 0 ? cleanNav : [],
          footer: {
            address: form.address.trim(),
            phone: form.phone.trim(),
            email,
            facebook: form.facebook.trim(),
            twitter: form.twitter.trim(),
            instagram: form.instagram.trim(),
            youtube: form.youtube.trim(),
          },
          customDomain: form.customDomain.trim(),
          domainVerified: domainStatus === 'verified',
        },
      };

      await updateDoc(doc(db, 'municipalities', municipality), websiteData);

      const newDomain = form.customDomain.trim();
      if (newDomain !== savedDomain) {
        await syncVercelDomain(savedDomain, newDomain);
        setSavedDomain(newDomain);
      }

      alert('Website settings saved successfully!');
    } catch (error) {
      alert('Error saving settings: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const [uploading, setUploading] = useState(false);

  const handleHeroImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const MAX_SIZE = 5 * 1024 * 1024; // 5MB
    if (file.size > MAX_SIZE) {
      alert('Image must be smaller than 5MB.');
      e.target.value = '';
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const storageRef = ref(storage, `municipalities/${municipality}/hero.${ext}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      setForm((prev) => ({ ...prev, heroImage: url }));
    } catch (error) {
      alert('Error uploading image: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleVerifyDomain = async () => {
    const domain = form.customDomain.trim();
    if (!domain) return;

    setVerifying(true);
    try {
      const resp = await fetch(
        `https://dns.google/resolve?name=${encodeURIComponent(domain)}&type=CNAME`
      );
      const data = await resp.json();
      const answers = data.Answer || [];
      const hasCname = answers.some(
        (a) => a.type === 5 && a.data?.includes('cname.vercel-dns.com')
      );
      setDomainStatus(hasCname ? 'verified' : 'failed');
    } catch {
      setDomainStatus('error');
    } finally {
      setVerifying(false);
    }
  };

  const subdomainUrl = `https://${municipality}.${BASE_DOMAIN}`;

  return (
    <div>
      <div className="page-header">
        <h2>Website Settings</h2>
        <p>Configure your municipality&apos;s public website</p>
      </div>

      <div className="card">
        <div className="card-header">
          <h3>General</h3>
        </div>
        <div style={{ padding: '20px' }}>
          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="checkbox"
                checked={form.enabled}
                onChange={(e) => setForm({ ...form, enabled: e.target.checked })}
                style={{ width: 'auto' }}
                disabled={!canEdit}
              />
              Website enabled
            </label>
          </div>

          {form.enabled && (
            <div className="form-group">
              <label>Website URL</label>
              <div style={{ padding: '8px 12px', background: '#f0f4f8', borderRadius: '6px', fontSize: '0.875rem' }}>
                <a href={subdomainUrl} target="_blank" rel="noopener noreferrer">
                  {subdomainUrl}
                </a>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="card" style={{ marginTop: '20px' }}>
        <div className="card-header">
          <h3>Hero Section</h3>
        </div>
        <div style={{ padding: '20px' }}>
          <div className="form-row">
            <div className="form-group">
              <label>Tagline (English)</label>
              <input
                type="text"
                value={form.heroTaglineEn}
                onChange={(e) => setForm({ ...form, heroTaglineEn: e.target.value })}
                placeholder="Welcome to our municipality"
                disabled={!canEdit}
              />
            </div>
            <div className="form-group">
              <label>Tagline (French)</label>
              <input
                type="text"
                value={form.heroTaglineFr}
                onChange={(e) => setForm({ ...form, heroTaglineFr: e.target.value })}
                placeholder="Bienvenue dans notre municipalit&eacute;"
                disabled={!canEdit}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Hero Image</label>
            <p style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '8px' }}>
              Recommended: 1920 × 600px (landscape). The image is shown as a background overlay.
            </p>
            {form.heroImage && (
              <div style={{ marginBottom: '12px' }}>
                <p style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '6px' }}>
                  Click on the image to set the focal point — this area stays visible when cropped.
                </p>
                <div
                  style={{ position: 'relative', display: 'inline-block', cursor: canEdit ? 'crosshair' : 'default', borderRadius: '6px', overflow: 'hidden' }}
                  onClick={(e) => {
                    if (!canEdit) return;
                    const rect = e.currentTarget.getBoundingClientRect();
                    const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
                    const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);
                    setForm({ ...form, heroImagePosition: `${x}% ${y}%` });
                  }}
                >
                  <img
                    src={form.heroImage}
                    alt="Hero"
                    style={{ maxWidth: '400px', maxHeight: '250px', display: 'block', borderRadius: '6px' }}
                  />
                  {(() => {
                    const pos = form.heroImagePosition || '50% 50%';
                    const match = pos.match(/(\d+)%\s+(\d+)%/);
                    const fx = match ? match[1] : '50';
                    const fy = match ? match[2] : '50';
                    return (
                      <div style={{
                        position: 'absolute',
                        left: `${fx}%`,
                        top: `${fy}%`,
                        transform: 'translate(-50%, -50%)',
                        width: '20px',
                        height: '20px',
                        border: '2px solid white',
                        borderRadius: '50%',
                        boxShadow: '0 0 0 1px rgba(0,0,0,0.4), 0 0 4px rgba(0,0,0,0.3)',
                        pointerEvents: 'none',
                      }}>
                        <div style={{
                          position: 'absolute',
                          top: '50%', left: '50%',
                          transform: 'translate(-50%, -50%)',
                          width: '4px', height: '4px',
                          background: 'white',
                          borderRadius: '50%',
                        }} />
                      </div>
                    );
                  })()}
                </div>
                <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '4px' }}>
                  Focal point: {form.heroImagePosition || '50% 50%'}
                </p>
              </div>
            )}
            {canEdit && (
              <>
                <input type="file" accept="image/*" onChange={handleHeroImageUpload} disabled={uploading} />
                {uploading && <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>Uploading...</span>}
              </>
            )}
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: '20px' }}>
        <div className="card-header">
          <h3>Navigation Menu</h3>
        </div>
        <div style={{ padding: '20px' }}>
          <NavigationEditor
            navigation={navigation}
            onChange={setNavigation}
            disabled={!canEdit}
            pages={pages}
          />
        </div>
      </div>

      <div className="card" style={{ marginTop: '20px' }}>
        <div className="card-header">
          <h3>Footer Information</h3>
        </div>
        <div style={{ padding: '20px' }}>
          <div className="form-group">
            <label>Address</label>
            <input
              type="text"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              placeholder="1234 Main Street, City, QC"
              disabled={!canEdit}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Phone</label>
              <input
                type="text"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="450-555-1234"
                disabled={!canEdit}
              />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="info@municipality.ca"
                disabled={!canEdit}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Facebook URL</label>
              <input
                type="url"
                value={form.facebook}
                onChange={(e) => setForm({ ...form, facebook: e.target.value })}
                disabled={!canEdit}
              />
            </div>
            <div className="form-group">
              <label>Instagram URL</label>
              <input
                type="url"
                value={form.instagram}
                onChange={(e) => setForm({ ...form, instagram: e.target.value })}
                disabled={!canEdit}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Twitter URL</label>
              <input
                type="url"
                value={form.twitter}
                onChange={(e) => setForm({ ...form, twitter: e.target.value })}
                disabled={!canEdit}
              />
            </div>
            <div className="form-group">
              <label>YouTube URL</label>
              <input
                type="url"
                value={form.youtube}
                onChange={(e) => setForm({ ...form, youtube: e.target.value })}
                disabled={!canEdit}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: '20px' }}>
        <div className="card-header">
          <h3>Custom Domain</h3>
        </div>
        <div style={{ padding: '20px' }}>
          <div className="form-group">
            <label>Custom Domain</label>
            <input
              type="text"
              value={form.customDomain}
              onChange={(e) => setForm({ ...form, customDomain: e.target.value })}
              placeholder="www.ville-example.ca"
              disabled={!canEdit}
            />
          </div>

          {form.customDomain && (
            <div style={{ padding: '12px', background: '#f0f4f8', borderRadius: '6px', marginBottom: '16px', fontSize: '0.875rem' }}>
              <p style={{ fontWeight: '600', marginBottom: '8px' }}>DNS Configuration Required:</p>
              <p>Add a CNAME record pointing <strong>{form.customDomain}</strong> to <strong>cname.vercel-dns.com</strong></p>
              <div style={{ marginTop: '12px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={handleVerifyDomain}
                  disabled={verifying || !canEdit}
                >
                  {verifying ? 'Verifying...' : 'Verify DNS'}
                </button>
                {domainStatus === 'verified' && (
                  <span style={{ color: '#16a34a', fontWeight: '600' }}>Verified</span>
                )}
                {domainStatus === 'failed' && (
                  <span style={{ color: '#dc2626' }}>DNS not configured yet</span>
                )}
                {domainStatus === 'error' && (
                  <span style={{ color: '#dc2626' }}>Verification error</span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {canEdit && (
        <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn btn-primary" onClick={handleSave} disabled={loading || uploading}>
            {uploading ? 'Uploading...' : loading ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      )}
    </div>
  );
}

export default WebsiteSettings;
