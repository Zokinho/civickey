import { useState } from 'react';

const BUILTIN_PAGES = [
  { id: 'home', labelEn: 'Home', labelFr: 'Accueil' },
  { id: 'collections', labelEn: 'Collections', labelFr: 'Collectes' },
  { id: 'events', labelEn: 'Events', labelFr: 'Activités' },
  { id: 'news', labelEn: 'News', labelFr: 'Avis' },
  { id: 'facilities', labelEn: 'Facilities', labelFr: 'Installations' },
];

const DEFAULT_NAVIGATION = [
  { id: 'default-home', label: { en: 'Home', fr: 'Accueil' }, type: 'link', linkType: 'builtin', builtinPage: 'home' },
  { id: 'default-collections', label: { en: 'Collections', fr: 'Collectes' }, type: 'link', linkType: 'builtin', builtinPage: 'collections' },
  { id: 'default-events', label: { en: 'Events', fr: 'Activités' }, type: 'link', linkType: 'builtin', builtinPage: 'events' },
  { id: 'default-news', label: { en: 'News', fr: 'Avis' }, type: 'link', linkType: 'builtin', builtinPage: 'news' },
  { id: 'default-facilities', label: { en: 'Facilities', fr: 'Installations' }, type: 'link', linkType: 'builtin', builtinPage: 'facilities' },
];

const MAX_TOP_ITEMS = 10;
const MAX_CHILDREN = 15;

function generateId() {
  return 'nav-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7);
}

function validateUrl(url) {
  if (!url) return false;
  try { new URL(url); return true; } catch { return false; }
}

function NavPreview({ items, pages, defaultNav }) {
  const [previewLang, setPreviewLang] = useState('en');
  const [openDropdown, setOpenDropdown] = useState(null);

  const displayItems = items.length > 0 ? items : defaultNav;

  const getLabel = (item) => {
    const label = previewLang === 'fr' ? item.label?.fr : item.label?.en;
    return label || item.label?.en || item.label?.fr || '(untitled)';
  };

  const resolveHref = (item) => {
    if (item.linkType === 'external') return item.externalUrl || '#';
    if (item.linkType === 'page') {
      const page = pages.find((p) => p.slug === item.pageSlug);
      return page ? `/${item.pageSlug}` : '#';
    }
    const bp = BUILTIN_PAGES.find((p) => p.id === item.builtinPage);
    return bp ? `/${bp.id}` : '#';
  };

  return (
    <div style={{ marginBottom: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <span style={{ fontSize: '0.75rem', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Preview</span>
        <div style={{ display: 'flex', gap: '4px' }}>
          <button
            type="button"
            onClick={() => setPreviewLang('en')}
            style={{
              padding: '2px 10px', fontSize: '0.75rem', fontWeight: '600', borderRadius: '4px', border: '1px solid #d1d5db', cursor: 'pointer',
              background: previewLang === 'en' ? '#1f2937' : '#fff',
              color: previewLang === 'en' ? '#fff' : '#374151',
            }}
          >
            EN
          </button>
          <button
            type="button"
            onClick={() => setPreviewLang('fr')}
            style={{
              padding: '2px 10px', fontSize: '0.75rem', fontWeight: '600', borderRadius: '4px', border: '1px solid #d1d5db', cursor: 'pointer',
              background: previewLang === 'fr' ? '#1f2937' : '#fff',
              color: previewLang === 'fr' ? '#fff' : '#374151',
            }}
          >
            FR
          </button>
        </div>
      </div>
      <div
        style={{
          display: 'flex', alignItems: 'center', gap: '2px', padding: '0 16px', height: '48px',
          background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px',
          boxShadow: '0 1px 2px rgba(0,0,0,0.05)', overflow: 'visible', position: 'relative',
        }}
      >
        {displayItems.map((item, index) => {
          const isDropdown = item.type === 'dropdown';
          const label = getLabel(item);

          if (isDropdown) {
            const children = item.children || [];
            return (
              <div
                key={item.id || index}
                style={{ position: 'relative' }}
                onMouseEnter={() => setOpenDropdown(index)}
                onMouseLeave={() => setOpenDropdown(null)}
              >
                <span
                  style={{
                    display: 'flex', alignItems: 'center', gap: '4px',
                    padding: '6px 12px', fontSize: '0.875rem', fontWeight: '500', color: '#374151',
                    borderRadius: '6px', cursor: 'default', whiteSpace: 'nowrap',
                    background: openDropdown === index ? '#f3f4f6' : 'transparent',
                  }}
                >
                  {label}
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 9l-7 7-7-7" /></svg>
                </span>
                {openDropdown === index && children.length > 0 && (
                  <div
                    style={{
                      position: 'absolute', left: 0, top: '100%', marginTop: '4px',
                      minWidth: '180px', background: '#fff', borderRadius: '8px',
                      border: '1px solid #e5e7eb', boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                      zIndex: 50, padding: '4px 0',
                    }}
                  >
                    {children.map((child, ci) => (
                      <span
                        key={child.id || ci}
                        style={{
                          display: 'block', padding: '8px 16px', fontSize: '0.875rem',
                          color: '#374151', cursor: 'default', whiteSpace: 'nowrap',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = '#f9fafb'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                      >
                        {getLabel(child)}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          }

          return (
            <span
              key={item.id || index}
              style={{
                padding: '6px 12px', fontSize: '0.875rem', fontWeight: '500', color: '#374151',
                borderRadius: '6px', cursor: 'default', whiteSpace: 'nowrap',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#f3f4f6'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
            >
              {label}
            </span>
          );
        })}
      </div>
      {items.length === 0 && (
        <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '6px', fontStyle: 'italic' }}>
          Showing default menu. Add items below to customize.
        </p>
      )}
    </div>
  );
}

function NavigationEditor({ navigation, onChange, disabled, pages = [] }) {
  const [errors, setErrors] = useState({});

  const items = navigation || [];

  const updateItem = (index, updates) => {
    const next = [...items];
    next[index] = { ...next[index], ...updates };
    onChange(next);
  };

  const addItem = () => {
    if (items.length >= MAX_TOP_ITEMS) return;
    onChange([
      ...items,
      { id: generateId(), label: { en: '', fr: '' }, type: 'link', linkType: 'builtin', builtinPage: 'home' },
    ]);
  };

  const removeItem = (index) => {
    onChange(items.filter((_, i) => i !== index));
  };

  const moveItem = (index, direction) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= items.length) return;
    const next = [...items];
    [next[index], next[newIndex]] = [next[newIndex], next[index]];
    onChange(next);
  };

  const updateChild = (itemIndex, childIndex, updates) => {
    const next = [...items];
    const children = [...(next[itemIndex].children || [])];
    children[childIndex] = { ...children[childIndex], ...updates };
    next[itemIndex] = { ...next[itemIndex], children };
    onChange(next);
  };

  const addChild = (itemIndex) => {
    const item = items[itemIndex];
    const children = item.children || [];
    if (children.length >= MAX_CHILDREN) return;
    const next = [...items];
    next[itemIndex] = {
      ...item,
      children: [
        ...children,
        { id: generateId(), label: { en: '', fr: '' }, linkType: 'builtin', builtinPage: 'home' },
      ],
    };
    onChange(next);
  };

  const removeChild = (itemIndex, childIndex) => {
    const next = [...items];
    const children = [...(next[itemIndex].children || [])];
    children.splice(childIndex, 1);
    next[itemIndex] = { ...next[itemIndex], children };
    onChange(next);
  };

  const moveChild = (itemIndex, childIndex, direction) => {
    const children = [...(items[itemIndex].children || [])];
    const newIndex = childIndex + direction;
    if (newIndex < 0 || newIndex >= children.length) return;
    [children[childIndex], children[newIndex]] = [children[newIndex], children[childIndex]];
    const next = [...items];
    next[itemIndex] = { ...next[itemIndex], children };
    onChange(next);
  };

  const handleTypeChange = (index, newType) => {
    const item = items[index];
    if (newType === 'dropdown') {
      updateItem(index, { type: 'dropdown', linkType: undefined, builtinPage: undefined, pageSlug: undefined, externalUrl: undefined, children: item.children || [] });
    } else {
      updateItem(index, { type: 'link', linkType: 'builtin', builtinPage: 'home', children: undefined });
    }
  };

  const handleLinkTypeChange = (index, linkType, isChild, parentIndex) => {
    const updates = { linkType, builtinPage: undefined, pageSlug: undefined, externalUrl: undefined };
    if (linkType === 'builtin') updates.builtinPage = 'home';
    if (isChild) {
      updateChild(parentIndex, index, updates);
    } else {
      updateItem(index, updates);
    }
  };

  const autoFillLabels = (index, linkType, value, isChild, parentIndex) => {
    let labelEn = '';
    let labelFr = '';

    if (linkType === 'builtin') {
      const bp = BUILTIN_PAGES.find((p) => p.id === value);
      if (bp) { labelEn = bp.labelEn; labelFr = bp.labelFr; }
    } else if (linkType === 'page') {
      const page = pages.find((p) => p.slug === value);
      if (page) { labelEn = page.title?.en || ''; labelFr = page.title?.fr || ''; }
    }

    if (!labelEn && !labelFr) return;

    if (isChild) {
      const child = items[parentIndex]?.children?.[index];
      if (child && !child.label.en && !child.label.fr) {
        updateChild(parentIndex, index, { label: { en: labelEn, fr: labelFr } });
      }
    } else {
      const item = items[index];
      if (item && !item.label.en && !item.label.fr) {
        updateItem(index, { label: { en: labelEn, fr: labelFr } });
      }
    }
  };

  const handleReset = () => {
    if (window.confirm('Reset navigation to the default 5-link menu?')) {
      onChange(DEFAULT_NAVIGATION.map((item) => ({ ...item, id: generateId() })));
    }
  };

  const validate = () => {
    const newErrors = {};
    items.forEach((item, i) => {
      if (!item.label?.en?.trim() && !item.label?.fr?.trim()) {
        newErrors[`${i}-label`] = 'At least one label is required';
      }
      if (item.type === 'link') {
        if (item.linkType === 'external' && !validateUrl(item.externalUrl)) {
          newErrors[`${i}-url`] = 'Valid URL required';
        }
        if (item.linkType === 'page' && !item.pageSlug) {
          newErrors[`${i}-page`] = 'Select a page';
        }
      }
      if (item.type === 'dropdown') {
        (item.children || []).forEach((child, j) => {
          if (!child.label?.en?.trim() && !child.label?.fr?.trim()) {
            newErrors[`${i}-${j}-label`] = 'At least one label is required';
          }
          if (child.linkType === 'external' && !validateUrl(child.externalUrl)) {
            newErrors[`${i}-${j}-url`] = 'Valid URL required';
          }
          if (child.linkType === 'page' && !child.pageSlug) {
            newErrors[`${i}-${j}-page`] = 'Select a page';
          }
        });
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const publishedPages = pages.filter((p) => p.status === 'published');

  const renderLinkConfig = (linkType, builtinPage, pageSlug, externalUrl, index, isChild, parentIndex) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <label style={{ fontSize: '0.75rem', color: '#6b7280', minWidth: '60px' }}>Link to:</label>
        <select
          value={linkType || 'builtin'}
          onChange={(e) => {
            handleLinkTypeChange(index, e.target.value, isChild, parentIndex);
          }}
          disabled={disabled}
          style={{ flex: 1, padding: '4px 8px', fontSize: '0.875rem' }}
        >
          <option value="builtin">Built-in page</option>
          <option value="page">Custom page</option>
          <option value="external">External URL</option>
        </select>
      </div>

      {linkType === 'builtin' && (
        <select
          value={builtinPage || 'home'}
          onChange={(e) => {
            const val = e.target.value;
            if (isChild) {
              updateChild(parentIndex, index, { builtinPage: val });
            } else {
              updateItem(index, { builtinPage: val });
            }
            autoFillLabels(index, 'builtin', val, isChild, parentIndex);
          }}
          disabled={disabled}
          style={{ padding: '4px 8px', fontSize: '0.875rem' }}
        >
          {BUILTIN_PAGES.map((bp) => (
            <option key={bp.id} value={bp.id}>{bp.labelEn} / {bp.labelFr}</option>
          ))}
        </select>
      )}

      {linkType === 'page' && (
        <>
          <select
            value={pageSlug || ''}
            onChange={(e) => {
              const val = e.target.value;
              if (isChild) {
                updateChild(parentIndex, index, { pageSlug: val });
              } else {
                updateItem(index, { pageSlug: val });
              }
              autoFillLabels(index, 'page', val, isChild, parentIndex);
            }}
            disabled={disabled}
            style={{ padding: '4px 8px', fontSize: '0.875rem' }}
          >
            <option value="">Select a page...</option>
            {publishedPages.map((p) => (
              <option key={p.slug} value={p.slug}>{p.title?.en || p.slug} / {p.title?.fr || p.slug}</option>
            ))}
          </select>
          {errors[isChild ? `${parentIndex}-${index}-page` : `${index}-page`] && (
            <span style={{ color: '#dc2626', fontSize: '0.75rem' }}>
              {errors[isChild ? `${parentIndex}-${index}-page` : `${index}-page`]}
            </span>
          )}
        </>
      )}

      {linkType === 'external' && (
        <>
          <input
            type="url"
            value={externalUrl || ''}
            onChange={(e) => {
              if (isChild) {
                updateChild(parentIndex, index, { externalUrl: e.target.value });
              } else {
                updateItem(index, { externalUrl: e.target.value });
              }
            }}
            placeholder="https://example.com"
            disabled={disabled}
            style={{ padding: '4px 8px', fontSize: '0.875rem' }}
          />
          {errors[isChild ? `${parentIndex}-${index}-url` : `${index}-url`] && (
            <span style={{ color: '#dc2626', fontSize: '0.75rem' }}>
              {errors[isChild ? `${parentIndex}-${index}-url` : `${index}-url`]}
            </span>
          )}
        </>
      )}
    </div>
  );

  const renderChild = (child, childIndex, itemIndex) => (
    <div
      key={child.id}
      style={{
        marginLeft: '24px',
        padding: '12px',
        background: '#f9fafb',
        borderRadius: '6px',
        border: '1px solid #e5e7eb',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <span style={{ fontSize: '0.75rem', fontWeight: '600', color: '#6b7280' }}>
          Sub-item {childIndex + 1}
        </span>
        <div style={{ display: 'flex', gap: '4px' }}>
          <button
            type="button"
            onClick={() => moveChild(itemIndex, childIndex, -1)}
            disabled={disabled || childIndex === 0}
            className="btn btn-secondary btn-sm"
            style={{ padding: '2px 6px', fontSize: '0.75rem' }}
          >
            ↑
          </button>
          <button
            type="button"
            onClick={() => moveChild(itemIndex, childIndex, 1)}
            disabled={disabled || childIndex === (items[itemIndex].children?.length || 0) - 1}
            className="btn btn-secondary btn-sm"
            style={{ padding: '2px 6px', fontSize: '0.75rem' }}
          >
            ↓
          </button>
          <button
            type="button"
            onClick={() => removeChild(itemIndex, childIndex)}
            disabled={disabled}
            className="btn btn-secondary btn-sm"
            style={{ padding: '2px 6px', fontSize: '0.75rem', color: '#dc2626' }}
          >
            ✕
          </button>
        </div>
      </div>

      <div className="form-row" style={{ marginBottom: '8px' }}>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label style={{ fontSize: '0.75rem' }}>Label (EN)</label>
          <input
            type="text"
            value={child.label?.en || ''}
            onChange={(e) => updateChild(itemIndex, childIndex, { label: { ...child.label, en: e.target.value } })}
            disabled={disabled}
            style={{ fontSize: '0.875rem' }}
          />
        </div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label style={{ fontSize: '0.75rem' }}>Label (FR)</label>
          <input
            type="text"
            value={child.label?.fr || ''}
            onChange={(e) => updateChild(itemIndex, childIndex, { label: { ...child.label, fr: e.target.value } })}
            disabled={disabled}
            style={{ fontSize: '0.875rem' }}
          />
        </div>
      </div>
      {errors[`${itemIndex}-${childIndex}-label`] && (
        <span style={{ color: '#dc2626', fontSize: '0.75rem' }}>
          {errors[`${itemIndex}-${childIndex}-label`]}
        </span>
      )}

      {renderLinkConfig(child.linkType, child.builtinPage, child.pageSlug, child.externalUrl, childIndex, true, itemIndex)}
    </div>
  );

  return (
    <div>
      <NavPreview items={items} pages={publishedPages} defaultNav={DEFAULT_NAVIGATION} />

      {items.length === 0 && (
        <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '12px' }}>
          No custom navigation configured. The website uses the default menu (Home, Collections, Events, News, Facilities).
        </p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {items.map((item, index) => (
          <div
            key={item.id}
            style={{
              padding: '16px',
              background: '#fff',
              borderRadius: '8px',
              border: '1px solid #d1d5db',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontWeight: '600', fontSize: '0.875rem' }}>
                Item {index + 1}
              </span>
              <div style={{ display: 'flex', gap: '4px' }}>
                <button
                  type="button"
                  onClick={() => moveItem(index, -1)}
                  disabled={disabled || index === 0}
                  className="btn btn-secondary btn-sm"
                  style={{ padding: '2px 8px' }}
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => moveItem(index, 1)}
                  disabled={disabled || index === items.length - 1}
                  className="btn btn-secondary btn-sm"
                  style={{ padding: '2px 8px' }}
                >
                  ↓
                </button>
                <button
                  type="button"
                  onClick={() => removeItem(index)}
                  disabled={disabled}
                  className="btn btn-secondary btn-sm"
                  style={{ padding: '2px 8px', color: '#dc2626' }}
                >
                  Remove
                </button>
              </div>
            </div>

            <div className="form-row" style={{ marginBottom: '8px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Label (EN)</label>
                <input
                  type="text"
                  value={item.label?.en || ''}
                  onChange={(e) => updateItem(index, { label: { ...item.label, en: e.target.value } })}
                  disabled={disabled}
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Label (FR)</label>
                <input
                  type="text"
                  value={item.label?.fr || ''}
                  onChange={(e) => updateItem(index, { label: { ...item.label, fr: e.target.value } })}
                  disabled={disabled}
                />
              </div>
            </div>
            {errors[`${index}-label`] && (
              <span style={{ color: '#dc2626', fontSize: '0.75rem', display: 'block', marginBottom: '8px' }}>
                {errors[`${index}-label`]}
              </span>
            )}

            <div className="form-group" style={{ marginBottom: '8px' }}>
              <label>Type</label>
              <select
                value={item.type}
                onChange={(e) => handleTypeChange(index, e.target.value)}
                disabled={disabled}
              >
                <option value="link">Link</option>
                <option value="dropdown">Dropdown</option>
              </select>
            </div>

            {item.type === 'link' && renderLinkConfig(item.linkType, item.builtinPage, item.pageSlug, item.externalUrl, index, false, null)}

            {item.type === 'dropdown' && (
              <div style={{ marginTop: '12px' }}>
                <label style={{ fontWeight: '600', fontSize: '0.875rem', display: 'block', marginBottom: '8px' }}>
                  Dropdown Items ({(item.children || []).length}/{MAX_CHILDREN})
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {(item.children || []).map((child, childIndex) =>
                    renderChild(child, childIndex, index)
                  )}
                </div>
                {(item.children || []).length < MAX_CHILDREN && (
                  <button
                    type="button"
                    onClick={() => addChild(index)}
                    disabled={disabled}
                    className="btn btn-secondary btn-sm"
                    style={{ marginTop: '8px' }}
                  >
                    + Add Sub-item
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
        {items.length < MAX_TOP_ITEMS && (
          <button
            type="button"
            onClick={addItem}
            disabled={disabled}
            className="btn btn-secondary"
          >
            + Add Menu Item
          </button>
        )}
        <button
          type="button"
          onClick={handleReset}
          disabled={disabled}
          className="btn btn-secondary"
        >
          Reset to Default
        </button>
      </div>

      {items.length > 0 && (
        <p style={{ color: '#6b7280', fontSize: '0.75rem', marginTop: '8px' }}>
          {items.length}/{MAX_TOP_ITEMS} top-level items
        </p>
      )}
    </div>
  );
}

NavigationEditor.validate = function validateNavigation(navigation) {
  if (!navigation || navigation.length === 0) return true;
  for (const item of navigation) {
    if (!item.label?.en?.trim() && !item.label?.fr?.trim()) return false;
    if (item.type === 'link') {
      if (item.linkType === 'external' && !validateUrl(item.externalUrl)) return false;
      if (item.linkType === 'page' && !item.pageSlug) return false;
    }
    if (item.type === 'dropdown') {
      for (const child of item.children || []) {
        if (!child.label?.en?.trim() && !child.label?.fr?.trim()) return false;
        if (child.linkType === 'external' && !validateUrl(child.externalUrl)) return false;
        if (child.linkType === 'page' && !child.pageSlug) return false;
      }
    }
  }
  return true;
};

export default NavigationEditor;
