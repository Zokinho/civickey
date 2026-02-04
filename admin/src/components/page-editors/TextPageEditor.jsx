function TextPageEditor({ content, onChange, disabled }) {
  const data = content || {};

  const update = (field, value) => {
    onChange({ ...data, [field]: value });
  };

  const updateNested = (parent, key, value) => {
    onChange({ ...data, [parent]: { ...(data[parent] || {}), [key]: value } });
  };

  return (
    <div>
      <h4 style={{ marginBottom: '16px', color: '#1a2b3c' }}>Page Content</h4>

      <div className="form-row">
        <div className="form-group">
          <label>Body Text (English)</label>
          <textarea
            value={data.body?.en || ''}
            onChange={(e) => updateNested('body', 'en', e.target.value)}
            disabled={disabled}
            placeholder="Enter body text in English"
            rows={6}
          />
        </div>
        <div className="form-group">
          <label>Body Text (French)</label>
          <textarea
            value={data.body?.fr || ''}
            onChange={(e) => updateNested('body', 'fr', e.target.value)}
            disabled={disabled}
            placeholder="Entrez le texte en français"
            rows={6}
          />
        </div>
      </div>

      <div className="form-group">
        <label>Featured Image URL</label>
        <input
          type="text"
          value={data.featuredImage || ''}
          onChange={(e) => update('featuredImage', e.target.value)}
          disabled={disabled}
          placeholder="https://example.com/image.jpg"
        />
        {data.featuredImage && (
          <img
            src={data.featuredImage}
            alt="Preview"
            style={{
              marginTop: '8px',
              maxWidth: '200px',
              maxHeight: '120px',
              objectFit: 'cover',
              borderRadius: '4px',
              border: '1px solid #d1d9e0',
            }}
          />
        )}
      </div>

      <h4 style={{ marginTop: '24px', marginBottom: '16px', color: '#1a2b3c' }}>
        Contact Information
      </h4>

      <div className="form-row">
        <div className="form-group">
          <label>Phone</label>
          <input
            type="tel"
            value={data.contactInfo?.phone || ''}
            onChange={(e) => updateNested('contactInfo', 'phone', e.target.value)}
            disabled={disabled}
            placeholder="e.g., 819-555-0100"
          />
        </div>
        <div className="form-group">
          <label>Email</label>
          <input
            type="email"
            value={data.contactInfo?.email || ''}
            onChange={(e) => updateNested('contactInfo', 'email', e.target.value)}
            disabled={disabled}
            placeholder="e.g., info@municipality.ca"
          />
        </div>
      </div>
    </div>
  );
}

export default TextPageEditor;
