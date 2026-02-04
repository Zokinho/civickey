function LinksPageEditor({ content, onChange, disabled }) {
  const data = content || {};
  const categories = data.categories || [];

  const updateCatNested = (catIdx, parent, lang, value) => {
    const cat = categories[catIdx];
    const updated = categories.map((c, i) =>
      i === catIdx ? { ...c, [parent]: { ...(cat[parent] || {}), [lang]: value } } : c
    );
    onChange({ ...data, categories: updated });
  };

  const addCategory = () => {
    onChange({ ...data, categories: [...categories, { title: { en: '', fr: '' }, links: [] }] });
  };

  const removeCategory = (index) => {
    onChange({ ...data, categories: categories.filter((_, i) => i !== index) });
  };

  const addLink = (catIdx) => {
    const updated = categories.map((c, i) =>
      i === catIdx ? { ...c, links: [...(c.links || []), { title: { en: '', fr: '' }, url: '', icon: '' }] } : c
    );
    onChange({ ...data, categories: updated });
  };

  const removeLink = (catIdx, linkIdx) => {
    const updated = categories.map((c, i) =>
      i === catIdx ? { ...c, links: (c.links || []).filter((_, li) => li !== linkIdx) } : c
    );
    onChange({ ...data, categories: updated });
  };

  const updateLink = (catIdx, linkIdx, field, value) => {
    const updated = categories.map((c, ci) =>
      ci === catIdx
        ? { ...c, links: (c.links || []).map((l, li) => (li === linkIdx ? { ...l, [field]: value } : l)) }
        : c
    );
    onChange({ ...data, categories: updated });
  };

  const updateLinkNested = (catIdx, linkIdx, parent, lang, value) => {
    const updated = categories.map((c, ci) =>
      ci === catIdx
        ? {
            ...c,
            links: (c.links || []).map((l, li) =>
              li === linkIdx ? { ...l, [parent]: { ...(l[parent] || {}), [lang]: value } } : l
            ),
          }
        : c
    );
    onChange({ ...data, categories: updated });
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h4 style={{ margin: 0, color: '#1a2b3c' }}>Link Categories ({categories.length})</h4>
        {!disabled && (
          <button type="button" className="btn btn-primary btn-sm" onClick={addCategory}>+ Add Category</button>
        )}
      </div>

      {categories.map((cat, catIdx) => (
        <div key={catIdx} style={{ border: '1px solid #d1d9e0', borderRadius: '8px', padding: '16px', marginBottom: '16px', background: '#fafbfc' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontWeight: 600, color: '#1a2b3c', fontSize: '0.875rem' }}>Category {catIdx + 1}</span>
            {!disabled && (
              <button type="button" className="btn btn-danger btn-sm" onClick={() => removeCategory(catIdx)}>Remove</button>
            )}
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Category Title (English)</label>
              <input type="text" value={cat.title?.en || ''} onChange={(e) => updateCatNested(catIdx, 'title', 'en', e.target.value)} disabled={disabled} placeholder="e.g., Government Services" />
            </div>
            <div className="form-group">
              <label>Category Title (French)</label>
              <input type="text" value={cat.title?.fr || ''} onChange={(e) => updateCatNested(catIdx, 'title', 'fr', e.target.value)} disabled={disabled} placeholder="e.g., Services gouvernementaux" />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '12px 0 8px' }}>
            <span style={{ fontSize: '0.875rem', color: '#5a6c7d' }}>Links ({(cat.links || []).length})</span>
            {!disabled && (
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => addLink(catIdx)}>+ Add Link</button>
            )}
          </div>

          {(cat.links || []).map((link, linkIdx) => (
            <div key={linkIdx} style={{ border: '1px solid #e8ecf0', borderRadius: '6px', padding: '12px', marginBottom: '8px', background: '#fff' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.8rem', color: '#5a6c7d' }}>Link {linkIdx + 1}</span>
                {!disabled && (
                  <button type="button" className="btn btn-danger btn-sm" onClick={() => removeLink(catIdx, linkIdx)}>Remove</button>
                )}
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Link Title (English)</label>
                  <input type="text" value={link.title?.en || ''} onChange={(e) => updateLinkNested(catIdx, linkIdx, 'title', 'en', e.target.value)} disabled={disabled} placeholder="Link title" />
                </div>
                <div className="form-group">
                  <label>Link Title (French)</label>
                  <input type="text" value={link.title?.fr || ''} onChange={(e) => updateLinkNested(catIdx, linkIdx, 'title', 'fr', e.target.value)} disabled={disabled} placeholder="Titre du lien" />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>URL</label>
                  <input type="url" value={link.url || ''} onChange={(e) => updateLink(catIdx, linkIdx, 'url', e.target.value)} disabled={disabled} placeholder="https://example.com" />
                </div>
                <div className="form-group">
                  <label>Icon (optional)</label>
                  <input type="text" value={link.icon || ''} onChange={(e) => updateLink(catIdx, linkIdx, 'icon', e.target.value)} disabled={disabled} placeholder="e.g., external-link" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ))}

      {categories.length === 0 && (
        <p style={{ color: '#5a6c7d', fontStyle: 'italic' }}>No link categories added yet. Click "Add Category" to get started.</p>
      )}
    </div>
  );
}

export default LinksPageEditor;
