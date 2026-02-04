function ContactPageEditor({ content, onChange, disabled }) {
  const data = content || {};
  const departments = data.departments || [];

  const update = (field, value) => {
    onChange({ ...data, [field]: value });
  };

  const updateNested = (parent, lang, value) => {
    onChange({ ...data, [parent]: { ...(data[parent] || {}), [lang]: value } });
  };

  const updateDept = (index, field, value) => {
    const updated = departments.map((d, i) => (i === index ? { ...d, [field]: value } : d));
    onChange({ ...data, departments: updated });
  };

  const updateDeptNested = (index, parent, lang, value) => {
    const dept = departments[index];
    const updated = departments.map((d, i) =>
      i === index ? { ...d, [parent]: { ...(dept[parent] || {}), [lang]: value } } : d
    );
    onChange({ ...data, departments: updated });
  };

  const addDepartment = () => {
    onChange({
      ...data,
      departments: [
        ...departments,
        { name: { en: '', fr: '' }, phone: '', email: '', hours: { en: '', fr: '' } },
      ],
    });
  };

  const removeDepartment = (index) => {
    onChange({ ...data, departments: departments.filter((_, i) => i !== index) });
  };

  return (
    <div>
      <h4 style={{ marginBottom: '16px', color: '#1a2b3c' }}>Main Contact</h4>

      <div className="form-group">
        <label>Address</label>
        <input
          type="text"
          value={data.address || ''}
          onChange={(e) => update('address', e.target.value)}
          disabled={disabled}
          placeholder="e.g., 1200, rue Principale, Ville QC J0A 1A0"
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Phone</label>
          <input type="tel" value={data.phone || ''} onChange={(e) => update('phone', e.target.value)} disabled={disabled} placeholder="e.g., 819-555-0100" />
        </div>
        <div className="form-group">
          <label>Email</label>
          <input type="email" value={data.email || ''} onChange={(e) => update('email', e.target.value)} disabled={disabled} placeholder="e.g., info@municipality.ca" />
        </div>
      </div>

      <h4 style={{ marginTop: '24px', marginBottom: '16px', color: '#1a2b3c' }}>Office Hours</h4>

      <div className="form-row">
        <div className="form-group">
          <label>Hours (English)</label>
          <textarea value={data.hours?.en || ''} onChange={(e) => updateNested('hours', 'en', e.target.value)} disabled={disabled} placeholder="e.g., Monday-Friday: 8:30 AM - 4:30 PM" rows={3} />
        </div>
        <div className="form-group">
          <label>Hours (French)</label>
          <textarea value={data.hours?.fr || ''} onChange={(e) => updateNested('hours', 'fr', e.target.value)} disabled={disabled} placeholder="e.g., Lundi-vendredi : 8 h 30 - 16 h 30" rows={3} />
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '24px', marginBottom: '16px' }}>
        <h4 style={{ margin: 0, color: '#1a2b3c' }}>Departments ({departments.length})</h4>
        {!disabled && (
          <button type="button" className="btn btn-primary btn-sm" onClick={addDepartment}>+ Add Department</button>
        )}
      </div>

      {departments.map((dept, index) => (
        <div key={index} style={{ border: '1px solid #d1d9e0', borderRadius: '8px', padding: '16px', marginBottom: '12px', background: '#fafbfc' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontWeight: 600, color: '#1a2b3c', fontSize: '0.875rem' }}>
              {dept.name?.en || `Department ${index + 1}`}
            </span>
            {!disabled && (
              <button type="button" className="btn btn-danger btn-sm" onClick={() => removeDepartment(index)}>Remove</button>
            )}
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Name (English)</label>
              <input type="text" value={dept.name?.en || ''} onChange={(e) => updateDeptNested(index, 'name', 'en', e.target.value)} disabled={disabled} placeholder="e.g., Public Works" />
            </div>
            <div className="form-group">
              <label>Name (French)</label>
              <input type="text" value={dept.name?.fr || ''} onChange={(e) => updateDeptNested(index, 'name', 'fr', e.target.value)} disabled={disabled} placeholder="e.g., Travaux publics" />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Phone</label>
              <input type="tel" value={dept.phone || ''} onChange={(e) => updateDept(index, 'phone', e.target.value)} disabled={disabled} placeholder="e.g., 819-555-0102" />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input type="email" value={dept.email || ''} onChange={(e) => updateDept(index, 'email', e.target.value)} disabled={disabled} placeholder="e.g., travaux@ville.ca" />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Hours (English, optional)</label>
              <input type="text" value={dept.hours?.en || ''} onChange={(e) => updateDeptNested(index, 'hours', 'en', e.target.value)} disabled={disabled} placeholder="e.g., Mon-Fri: 7 AM - 3 PM" />
            </div>
            <div className="form-group">
              <label>Hours (French, optional)</label>
              <input type="text" value={dept.hours?.fr || ''} onChange={(e) => updateDeptNested(index, 'hours', 'fr', e.target.value)} disabled={disabled} placeholder="e.g., Lun-ven : 7 h - 15 h" />
            </div>
          </div>
        </div>
      ))}

      {departments.length === 0 && (
        <p style={{ color: '#5a6c7d', fontStyle: 'italic' }}>No departments added yet. Click "Add Department" to get started.</p>
      )}
    </div>
  );
}

export default ContactPageEditor;
