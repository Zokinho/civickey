function CouncilPageEditor({ content, onChange, disabled }) {
  const data = content || {};
  const members = data.members || [];

  const updateMember = (index, field, value) => {
    const updated = members.map((m, i) => (i === index ? { ...m, [field]: value } : m));
    onChange({ ...data, members: updated });
  };

  const updateMemberNested = (index, parent, lang, value) => {
    const member = members[index];
    const updated = members.map((m, i) =>
      i === index ? { ...m, [parent]: { ...(member[parent] || {}), [lang]: value } } : m
    );
    onChange({ ...data, members: updated });
  };

  const addMember = () => {
    onChange({
      ...data,
      members: [...members, { name: '', role: { en: '', fr: '' }, photoUrl: '', email: '', phone: '' }],
    });
  };

  const removeMember = (index) => {
    onChange({ ...data, members: members.filter((_, i) => i !== index) });
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h4 style={{ margin: 0, color: '#1a2b3c' }}>Council Members ({members.length})</h4>
        {!disabled && (
          <button type="button" className="btn btn-primary btn-sm" onClick={addMember}>+ Add Member</button>
        )}
      </div>

      {members.map((member, index) => (
        <div key={index} style={{ border: '1px solid #d1d9e0', borderRadius: '8px', padding: '16px', marginBottom: '12px', background: '#fafbfc' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontWeight: 600, color: '#1a2b3c', fontSize: '0.875rem' }}>
              {member.name || `Member ${index + 1}`}
            </span>
            {!disabled && (
              <button type="button" className="btn btn-danger btn-sm" onClick={() => removeMember(index)}>Remove</button>
            )}
          </div>
          <div className="form-group">
            <label>Full Name</label>
            <input type="text" value={member.name || ''} onChange={(e) => updateMember(index, 'name', e.target.value)} disabled={disabled} placeholder="e.g., Jean Tremblay" />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Role (English)</label>
              <input type="text" value={member.role?.en || ''} onChange={(e) => updateMemberNested(index, 'role', 'en', e.target.value)} disabled={disabled} placeholder="e.g., Mayor" />
            </div>
            <div className="form-group">
              <label>Role (French)</label>
              <input type="text" value={member.role?.fr || ''} onChange={(e) => updateMemberNested(index, 'role', 'fr', e.target.value)} disabled={disabled} placeholder="e.g., Maire" />
            </div>
          </div>
          <div className="form-group">
            <label>Photo URL</label>
            <input type="url" value={member.photoUrl || ''} onChange={(e) => updateMember(index, 'photoUrl', e.target.value)} disabled={disabled} placeholder="https://example.com/photo.jpg" />
            {member.photoUrl && (
              <img
                src={member.photoUrl}
                alt={member.name || 'Member photo'}
                style={{ marginTop: '8px', width: '64px', height: '64px', objectFit: 'cover', borderRadius: '50%', border: '1px solid #d1d9e0' }}
              />
            )}
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Email</label>
              <input type="email" value={member.email || ''} onChange={(e) => updateMember(index, 'email', e.target.value)} disabled={disabled} placeholder="e.g., jtremblay@ville.ca" />
            </div>
            <div className="form-group">
              <label>Phone</label>
              <input type="tel" value={member.phone || ''} onChange={(e) => updateMember(index, 'phone', e.target.value)} disabled={disabled} placeholder="e.g., 819-555-0101" />
            </div>
          </div>
        </div>
      ))}

      {members.length === 0 && (
        <p style={{ color: '#5a6c7d', fontStyle: 'italic' }}>No council members added yet. Click "Add Member" to get started.</p>
      )}
    </div>
  );
}

export default CouncilPageEditor;
