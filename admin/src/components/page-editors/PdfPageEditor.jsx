function PdfPageEditor({ content, onChange, disabled }) {
  const data = content || {};
  const documents = data.documents || [];

  const updateDescription = (lang, value) => {
    onChange({ ...data, description: { ...(data.description || {}), [lang]: value } });
  };

  const updateDoc = (index, field, value) => {
    const updated = documents.map((d, i) => (i === index ? { ...d, [field]: value } : d));
    onChange({ ...data, documents: updated });
  };

  const updateDocNested = (index, parent, lang, value) => {
    const doc = documents[index];
    const updated = documents.map((d, i) =>
      i === index ? { ...d, [parent]: { ...(doc[parent] || {}), [lang]: value } } : d
    );
    onChange({ ...data, documents: updated });
  };

  const addDocument = () => {
    onChange({
      ...data,
      documents: [...documents, { title: { en: '', fr: '' }, url: '', description: { en: '', fr: '' } }],
    });
  };

  const removeDocument = (index) => {
    onChange({ ...data, documents: documents.filter((_, i) => i !== index) });
  };

  return (
    <div>
      <h4 style={{ marginBottom: '16px', color: '#1a2b3c' }}>Page Description</h4>

      <div className="form-row">
        <div className="form-group">
          <label>Description (English)</label>
          <textarea
            value={data.description?.en || ''}
            onChange={(e) => updateDescription('en', e.target.value)}
            disabled={disabled}
            placeholder="Page description in English"
            rows={3}
          />
        </div>
        <div className="form-group">
          <label>Description (French)</label>
          <textarea
            value={data.description?.fr || ''}
            onChange={(e) => updateDescription('fr', e.target.value)}
            disabled={disabled}
            placeholder="Description de la page en fran\u00e7ais"
            rows={3}
          />
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '24px', marginBottom: '16px' }}>
        <h4 style={{ margin: 0, color: '#1a2b3c' }}>Documents ({documents.length})</h4>
        {!disabled && (
          <button type="button" className="btn btn-primary btn-sm" onClick={addDocument}>+ Add Document</button>
        )}
      </div>

      {documents.map((doc, index) => (
        <div key={index} style={{ border: '1px solid #d1d9e0', borderRadius: '8px', padding: '16px', marginBottom: '12px', background: '#fafbfc' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontWeight: 600, color: '#1a2b3c', fontSize: '0.875rem' }}>Document {index + 1}</span>
            {!disabled && (
              <button type="button" className="btn btn-danger btn-sm" onClick={() => removeDocument(index)}>Remove</button>
            )}
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Title (English)</label>
              <input type="text" value={doc.title?.en || ''} onChange={(e) => updateDocNested(index, 'title', 'en', e.target.value)} disabled={disabled} placeholder="Document title in English" />
            </div>
            <div className="form-group">
              <label>Title (French)</label>
              <input type="text" value={doc.title?.fr || ''} onChange={(e) => updateDocNested(index, 'title', 'fr', e.target.value)} disabled={disabled} placeholder="Titre du document en fran\u00e7ais" />
            </div>
          </div>
          <div className="form-group">
            <label>Document URL</label>
            <input type="url" value={doc.url || ''} onChange={(e) => updateDoc(index, 'url', e.target.value)} disabled={disabled} placeholder="https://example.com/document.pdf" />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Description (English, optional)</label>
              <input type="text" value={doc.description?.en || ''} onChange={(e) => updateDocNested(index, 'description', 'en', e.target.value)} disabled={disabled} placeholder="Brief description" />
            </div>
            <div className="form-group">
              <label>Description (French, optional)</label>
              <input type="text" value={doc.description?.fr || ''} onChange={(e) => updateDocNested(index, 'description', 'fr', e.target.value)} disabled={disabled} placeholder="Br\u00e8ve description" />
            </div>
          </div>
        </div>
      ))}

      {documents.length === 0 && (
        <p style={{ color: '#5a6c7d', fontStyle: 'italic' }}>No documents added yet. Click "Add Document" to get started.</p>
      )}
    </div>
  );
}

export default PdfPageEditor;
