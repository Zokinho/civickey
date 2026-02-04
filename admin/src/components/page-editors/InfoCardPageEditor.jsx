function InfoCardPageEditor({ content, onChange, disabled }) {
  const data = content || {};
  const cards = data.cards || [];

  const updateIntro = (lang, value) => {
    onChange({ ...data, intro: { ...(data.intro || {}), [lang]: value } });
  };

  const updateCard = (index, field, value) => {
    const updated = cards.map((c, i) => (i === index ? { ...c, [field]: value } : c));
    onChange({ ...data, cards: updated });
  };

  const updateCardNested = (index, parent, lang, value) => {
    const card = cards[index];
    const updated = cards.map((c, i) =>
      i === index ? { ...c, [parent]: { ...(card[parent] || {}), [lang]: value } } : c
    );
    onChange({ ...data, cards: updated });
  };

  const addCard = () => {
    onChange({ ...data, cards: [...cards, { title: { en: '', fr: '' }, description: { en: '', fr: '' }, icon: '' }] });
  };

  const removeCard = (index) => {
    onChange({ ...data, cards: cards.filter((_, i) => i !== index) });
  };

  const moveCard = (index, direction) => {
    const target = index + direction;
    if (target < 0 || target >= cards.length) return;
    const updated = [...cards];
    [updated[index], updated[target]] = [updated[target], updated[index]];
    onChange({ ...data, cards: updated });
  };

  return (
    <div>
      <h4 style={{ marginBottom: '16px', color: '#1a2b3c' }}>Introduction</h4>

      <div className="form-row">
        <div className="form-group">
          <label>Intro Text (English)</label>
          <textarea
            value={data.intro?.en || ''}
            onChange={(e) => updateIntro('en', e.target.value)}
            disabled={disabled}
            placeholder="Introduction text in English"
            rows={3}
          />
        </div>
        <div className="form-group">
          <label>Intro Text (French)</label>
          <textarea
            value={data.intro?.fr || ''}
            onChange={(e) => updateIntro('fr', e.target.value)}
            disabled={disabled}
            placeholder="Texte d'introduction en fran\u00e7ais"
            rows={3}
          />
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '24px', marginBottom: '16px' }}>
        <h4 style={{ margin: 0, color: '#1a2b3c' }}>Cards ({cards.length})</h4>
        {!disabled && (
          <button type="button" className="btn btn-primary btn-sm" onClick={addCard}>+ Add Card</button>
        )}
      </div>

      {cards.map((card, index) => (
        <div key={index} style={{ border: '1px solid #d1d9e0', borderRadius: '8px', padding: '16px', marginBottom: '12px', background: '#fafbfc' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontWeight: 600, color: '#1a2b3c', fontSize: '0.875rem' }}>Card {index + 1}</span>
            {!disabled && (
              <div style={{ display: 'flex', gap: '4px' }}>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => moveCard(index, -1)} disabled={index === 0}>Up</button>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => moveCard(index, 1)} disabled={index === cards.length - 1}>Down</button>
                <button type="button" className="btn btn-danger btn-sm" onClick={() => removeCard(index)}>Remove</button>
              </div>
            )}
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Title (English)</label>
              <input type="text" value={card.title?.en || ''} onChange={(e) => updateCardNested(index, 'title', 'en', e.target.value)} disabled={disabled} placeholder="Card title in English" />
            </div>
            <div className="form-group">
              <label>Title (French)</label>
              <input type="text" value={card.title?.fr || ''} onChange={(e) => updateCardNested(index, 'title', 'fr', e.target.value)} disabled={disabled} placeholder="Titre de la carte en fran\u00e7ais" />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Description (English)</label>
              <textarea value={card.description?.en || ''} onChange={(e) => updateCardNested(index, 'description', 'en', e.target.value)} disabled={disabled} placeholder="Description in English" rows={2} />
            </div>
            <div className="form-group">
              <label>Description (French)</label>
              <textarea value={card.description?.fr || ''} onChange={(e) => updateCardNested(index, 'description', 'fr', e.target.value)} disabled={disabled} placeholder="Description en fran\u00e7ais" rows={2} />
            </div>
          </div>
          <div className="form-group">
            <label>Icon (optional)</label>
            <input type="text" value={card.icon || ''} onChange={(e) => updateCard(index, 'icon', e.target.value)} disabled={disabled} placeholder="e.g., recycle, leaf, info" />
          </div>
        </div>
      ))}

      {cards.length === 0 && (
        <p style={{ color: '#5a6c7d', fontStyle: 'italic' }}>No cards added yet. Click "Add Card" to get started.</p>
      )}
    </div>
  );
}

export default InfoCardPageEditor;
