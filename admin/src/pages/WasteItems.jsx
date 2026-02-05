import { useState, useEffect, useMemo } from 'react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, getDoc, Timestamp, arrayUnion } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import { can } from '../utils/permissions';
import { normalizeText } from '../utils/textNormalize';
import quebecTemplate from '../data/quebec-waste-template.json';

const INITIAL_FORM = {
  nameFr: '',
  nameEn: '',
  binId: '',
  noteFr: '',
  noteEn: '',
  aliases: '',
};

const INITIAL_SUGGESTION_FORM = {
  nameFr: '',
  nameEn: '',
  categoryFr: '',
  categoryEn: '',
  noteFr: '',
  noteEn: '',
  aliases: '',
};

function generateSearchTerms(nameFr, nameEn, aliasesStr) {
  const terms = new Set();
  if (nameFr) {
    terms.add(normalizeText(nameFr));
    normalizeText(nameFr).split(/\s+/).forEach(w => { if (w) terms.add(w); });
  }
  if (nameEn) {
    terms.add(normalizeText(nameEn));
    normalizeText(nameEn).split(/\s+/).forEach(w => { if (w) terms.add(w); });
  }
  if (aliasesStr) {
    aliasesStr.split(',').map(a => normalizeText(a)).filter(Boolean).forEach(a => terms.add(a));
  }
  return [...terms];
}

function WasteItems() {
  const { municipality, adminData, isSuperAdmin } = useAuth();
  const canCreate = can(adminData?.role, 'wasteItems', 'create');
  const canEdit = can(adminData?.role, 'wasteItems', 'edit');
  const canDelete = can(adminData?.role, 'wasteItems', 'delete');
  const superAdmin = isSuperAdmin();

  const [items, setItems] = useState([]);
  const [collectionTypes, setCollectionTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(INITIAL_FORM);
  const [searchFilter, setSearchFilter] = useState('');
  const [binFilter, setBinFilter] = useState('');
  const [showImportModal, setShowImportModal] = useState(false);
  const [importMapping, setImportMapping] = useState({});
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);

  // Suggestions state
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestionModal, setShowSuggestionModal] = useState(false);
  const [editingSuggestionId, setEditingSuggestionId] = useState(null);
  const [suggestionForm, setSuggestionForm] = useState(INITIAL_SUGGESTION_FORM);
  const [acceptingId, setAcceptingId] = useState(null);
  const [acceptBinId, setAcceptBinId] = useState('');

  useEffect(() => {
    if (municipality) {
      loadData();
    }
  }, [municipality]);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([loadItems(), loadCollectionTypes(), loadSuggestions()]);
    } finally {
      setLoading(false);
    }
  };

  const loadItems = async () => {
    try {
      const itemsCol = collection(db, 'municipalities', municipality, 'wasteItems');
      const querySnapshot = await getDocs(itemsCol);
      const data = querySnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      data.sort((a, b) => (a.nameFr || '').localeCompare(b.nameFr || '', 'fr'));
      setItems(data);
    } catch (error) {
      console.error('Error loading waste items:', error.message);
    }
  };

  const loadCollectionTypes = async () => {
    try {
      const scheduleRef = doc(db, 'municipalities', municipality, 'data', 'schedule');
      const docSnap = await getDoc(scheduleRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setCollectionTypes(data.collectionTypes || []);
      }
    } catch (error) {
      console.error('Error loading collection types:', error.message);
    }
  };

  const loadSuggestions = async () => {
    try {
      const sugCol = collection(db, 'suggestedWasteItems');
      const querySnapshot = await getDocs(sugCol);
      const data = querySnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      data.sort((a, b) => (a.nameFr || '').localeCompare(b.nameFr || '', 'fr'));
      setSuggestions(data);
    } catch (error) {
      console.error('Error loading suggestions:', error.message);
    }
  };

  const pendingSuggestions = useMemo(() => {
    if (!municipality) return [];
    return suggestions.filter(s =>
      !(s.acceptedBy || []).includes(municipality) &&
      !(s.dismissedBy || []).includes(municipality)
    );
  }, [suggestions, municipality]);

  const getBinInfo = (binId) => {
    return collectionTypes.find(ct => ct.id === binId);
  };

  const filteredItems = useMemo(() => {
    let result = items;
    if (binFilter) {
      result = result.filter(item => item.binId === binFilter);
    }
    if (searchFilter.length >= 2) {
      const normalized = normalizeText(searchFilter);
      result = result.filter(item =>
        normalizeText(item.nameFr || '').includes(normalized) ||
        normalizeText(item.nameEn || '').includes(normalized)
      );
    }
    return result;
  }, [items, searchFilter, binFilter]);

  // CRUD
  const handleSubmit = async (e) => {
    e.preventDefault();
    const nameFr = form.nameFr.trim();
    const nameEn = form.nameEn.trim();
    if (!nameFr || !nameEn) {
      alert('Name is required in both English and French');
      return;
    }
    if (!form.binId) {
      alert('Please select a bin/collection type');
      return;
    }

    const searchTerms = generateSearchTerms(nameFr, nameEn, form.aliases);
    const itemData = {
      nameFr,
      nameEn,
      binId: form.binId,
      noteFr: form.noteFr.trim(),
      noteEn: form.noteEn.trim(),
      searchTerms,
      updatedAt: Timestamp.now(),
    };

    try {
      if (editingId) {
        await updateDoc(doc(db, 'municipalities', municipality, 'wasteItems', editingId), itemData);
      } else {
        itemData.createdAt = Timestamp.now();
        await addDoc(collection(db, 'municipalities', municipality, 'wasteItems'), itemData);
      }
      setShowModal(false);
      setForm(INITIAL_FORM);
      setEditingId(null);
      await loadItems();
    } catch (error) {
      alert('Error saving item: ' + error.message);
    }
  };

  const handleEdit = (item) => {
    const aliases = (item.searchTerms || [])
      .filter(t =>
        t !== normalizeText(item.nameFr || '') &&
        t !== normalizeText(item.nameEn || '') &&
        !normalizeText(item.nameFr || '').split(/\s+/).includes(t) &&
        !normalizeText(item.nameEn || '').split(/\s+/).includes(t)
      )
      .join(', ');
    setForm({
      nameFr: item.nameFr || '',
      nameEn: item.nameEn || '',
      binId: item.binId || '',
      noteFr: item.noteFr || '',
      noteEn: item.noteEn || '',
      aliases,
    });
    setEditingId(item.id);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    try {
      await deleteDoc(doc(db, 'municipalities', municipality, 'wasteItems', id));
      await loadItems();
    } catch (error) {
      alert('Error deleting item: ' + error.message);
    }
  };

  const openNewModal = () => {
    setForm({ ...INITIAL_FORM, binId: collectionTypes[0]?.id || '' });
    setEditingId(null);
    setShowModal(true);
  };

  // Import
  const openImportModal = () => {
    const mapping = {};
    for (const [catKey, catData] of Object.entries(quebecTemplate.categories)) {
      const normalizedCat = normalizeText(catData.nameFr);
      const match = collectionTypes.find(ct =>
        normalizeText(ct.name?.fr || '') === normalizedCat ||
        normalizeText(ct.id || '') === normalizedCat
      );
      mapping[catKey] = match?.id || '';
    }
    setImportMapping(mapping);
    setImportResult(null);
    setShowImportModal(true);
  };

  const getImportPreview = () => {
    const existingNormalized = new Set(items.map(i => normalizeText(i.nameFr || '')));
    let toImport = 0;
    let duplicates = 0;
    let unmapped = 0;

    for (const [catKey, catData] of Object.entries(quebecTemplate.categories)) {
      const binId = importMapping[catKey];
      if (!binId) {
        unmapped += catData.items.length;
        continue;
      }
      for (const item of catData.items) {
        if (existingNormalized.has(normalizeText(item.nameFr))) {
          duplicates++;
        } else {
          toImport++;
        }
      }
    }
    return { toImport, duplicates, unmapped };
  };

  const handleImport = async () => {
    setImporting(true);
    const existingNormalized = new Set(items.map(i => normalizeText(i.nameFr || '')));
    let imported = 0;
    let skipped = 0;

    try {
      for (const [catKey, catData] of Object.entries(quebecTemplate.categories)) {
        const binId = importMapping[catKey];
        if (!binId) continue;

        for (const item of catData.items) {
          if (existingNormalized.has(normalizeText(item.nameFr))) {
            skipped++;
            continue;
          }

          const aliasesStr = (item.aliases || []).join(', ');
          const searchTerms = generateSearchTerms(item.nameFr, item.nameEn, aliasesStr);

          await addDoc(collection(db, 'municipalities', municipality, 'wasteItems'), {
            nameFr: item.nameFr,
            nameEn: item.nameEn,
            binId,
            noteFr: item.noteFr || '',
            noteEn: item.noteEn || '',
            searchTerms,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
          });
          imported++;
        }
      }
      setImportResult({ imported, skipped });
      await loadItems();
    } catch (error) {
      alert('Error importing items: ' + error.message);
    } finally {
      setImporting(false);
    }
  };

  // Suggestion CRUD (super-admin)
  const openNewSuggestionModal = () => {
    setSuggestionForm(INITIAL_SUGGESTION_FORM);
    setEditingSuggestionId(null);
    setShowSuggestionModal(true);
  };

  const openEditSuggestionModal = (suggestion) => {
    setSuggestionForm({
      nameFr: suggestion.nameFr || '',
      nameEn: suggestion.nameEn || '',
      categoryFr: suggestion.categoryFr || '',
      categoryEn: suggestion.categoryEn || '',
      noteFr: suggestion.noteFr || '',
      noteEn: suggestion.noteEn || '',
      aliases: (suggestion.aliases || []).join(', '),
    });
    setEditingSuggestionId(suggestion.id);
    setShowSuggestionModal(true);
  };

  const handleSuggestionSubmit = async (e) => {
    e.preventDefault();
    const nameFr = suggestionForm.nameFr.trim();
    const nameEn = suggestionForm.nameEn.trim();
    if (!nameFr || !nameEn) {
      alert('Name is required in both English and French');
      return;
    }

    const aliases = suggestionForm.aliases
      .split(',')
      .map(a => a.trim())
      .filter(Boolean);

    const data = {
      nameFr,
      nameEn,
      categoryFr: suggestionForm.categoryFr.trim(),
      categoryEn: suggestionForm.categoryEn.trim(),
      noteFr: suggestionForm.noteFr.trim(),
      noteEn: suggestionForm.noteEn.trim(),
      aliases,
      updatedAt: Timestamp.now(),
    };

    try {
      if (editingSuggestionId) {
        await updateDoc(doc(db, 'suggestedWasteItems', editingSuggestionId), data);
      } else {
        data.acceptedBy = [];
        data.dismissedBy = [];
        data.createdAt = Timestamp.now();
        await addDoc(collection(db, 'suggestedWasteItems'), data);
      }
      setShowSuggestionModal(false);
      setSuggestionForm(INITIAL_SUGGESTION_FORM);
      setEditingSuggestionId(null);
      await loadSuggestions();
    } catch (error) {
      alert('Error saving suggestion: ' + error.message);
    }
  };

  const handleDeleteSuggestion = async (id) => {
    if (!confirm('Are you sure you want to delete this suggestion?')) return;
    try {
      await deleteDoc(doc(db, 'suggestedWasteItems', id));
      await loadSuggestions();
    } catch (error) {
      alert('Error deleting suggestion: ' + error.message);
    }
  };

  // Accept / Dismiss (editors)
  const handleAcceptSuggestion = async (suggestion) => {
    if (!acceptBinId) {
      alert('Please select a bin first');
      return;
    }

    const searchTerms = generateSearchTerms(suggestion.nameFr, suggestion.nameEn, (suggestion.aliases || []).join(', '));

    try {
      await addDoc(collection(db, 'municipalities', municipality, 'wasteItems'), {
        nameFr: suggestion.nameFr,
        nameEn: suggestion.nameEn,
        binId: acceptBinId,
        noteFr: suggestion.noteFr || '',
        noteEn: suggestion.noteEn || '',
        searchTerms,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });

      await updateDoc(doc(db, 'suggestedWasteItems', suggestion.id), {
        acceptedBy: arrayUnion(municipality),
      });

      setAcceptingId(null);
      setAcceptBinId('');
      await Promise.all([loadItems(), loadSuggestions()]);
    } catch (error) {
      alert('Error accepting suggestion: ' + error.message);
    }
  };

  const handleDismissSuggestion = async (suggestion) => {
    try {
      await updateDoc(doc(db, 'suggestedWasteItems', suggestion.id), {
        dismissedBy: arrayUnion(municipality),
      });
      await loadSuggestions();
    } catch (error) {
      alert('Error dismissing suggestion: ' + error.message);
    }
  };

  const preview = showImportModal ? getImportPreview() : null;
  const allCategoriesMapped = Object.values(importMapping).every(v => v);
  const showSuggestionsCard = superAdmin || pendingSuggestions.length > 0;

  return (
    <div>
      <div className="page-header">
        <h2>What Goes Where</h2>
        <p>Manage the waste item database for resident search</p>
      </div>

      {/* Suggestions Card */}
      {showSuggestionsCard && (
        <div className="card" style={{ marginBottom: '24px' }}>
          <div className="card-header">
            <span>
              Suggestions
              {pendingSuggestions.length > 0 && (
                <span style={{
                  marginLeft: '8px',
                  backgroundColor: '#3498db',
                  color: 'white',
                  borderRadius: '12px',
                  padding: '2px 10px',
                  fontSize: '0.8rem',
                }}>
                  {pendingSuggestions.length} pending
                </span>
              )}
            </span>
            {superAdmin && (
              <button className="btn btn-primary" onClick={openNewSuggestionModal}>
                + Add Suggestion
              </button>
            )}
          </div>

          {loading ? (
            <p style={{ color: '#5a6c7d', padding: '20px' }}>Loading...</p>
          ) : superAdmin && suggestions.length === 0 ? (
            <div className="empty-state">
              <p>No suggestions yet</p>
              <button className="btn btn-primary" onClick={openNewSuggestionModal}>
                Add your first suggestion
              </button>
            </div>
          ) : pendingSuggestions.length === 0 && !superAdmin ? null : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Name (FR)</th>
                    <th>Name (EN)</th>
                    <th>Category</th>
                    {(canCreate || superAdmin) && <th>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {(superAdmin ? suggestions : pendingSuggestions).map((suggestion) => (
                    <tr key={suggestion.id}>
                      <td><strong>{suggestion.nameFr}</strong></td>
                      <td>{suggestion.nameEn}</td>
                      <td style={{ fontSize: '0.875rem', color: '#5a6c7d' }}>
                        {suggestion.categoryFr}
                        {suggestion.categoryEn && ` / ${suggestion.categoryEn}`}
                        {superAdmin && (
                          <div style={{ fontSize: '0.75rem', marginTop: '2px', color: '#999' }}>
                            {(suggestion.acceptedBy || []).length} accepted · {(suggestion.dismissedBy || []).length} dismissed
                          </div>
                        )}
                      </td>
                      {(canCreate || superAdmin) && (
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            {/* Accept/Dismiss for editors (and super-admin acting as municipality) */}
                            {canCreate && municipality && !(suggestion.acceptedBy || []).includes(municipality) && !(suggestion.dismissedBy || []).includes(municipality) && (
                              <>
                                {acceptingId === suggestion.id ? (
                                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                                    <select
                                      value={acceptBinId}
                                      onChange={(e) => setAcceptBinId(e.target.value)}
                                      style={{ minWidth: '150px', fontSize: '0.85rem' }}
                                    >
                                      <option value="">Select bin...</option>
                                      {collectionTypes.map(ct => (
                                        <option key={ct.id} value={ct.id}>
                                          {ct.name?.fr || ct.id}
                                        </option>
                                      ))}
                                    </select>
                                    <button
                                      className="btn btn-primary btn-sm"
                                      onClick={() => handleAcceptSuggestion(suggestion)}
                                      disabled={!acceptBinId}
                                    >
                                      Confirm
                                    </button>
                                    <button
                                      className="btn btn-secondary btn-sm"
                                      onClick={() => { setAcceptingId(null); setAcceptBinId(''); }}
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                ) : (
                                  <div style={{ display: 'flex', gap: '6px' }}>
                                    <button
                                      className="btn btn-primary btn-sm"
                                      onClick={() => { setAcceptingId(suggestion.id); setAcceptBinId(''); }}
                                    >
                                      Accept
                                    </button>
                                    <button
                                      className="btn btn-secondary btn-sm"
                                      onClick={() => handleDismissSuggestion(suggestion)}
                                    >
                                      Dismiss
                                    </button>
                                  </div>
                                )}
                              </>
                            )}
                            {canCreate && municipality && (suggestion.acceptedBy || []).includes(municipality) && (
                              <span style={{ color: '#27ae60', fontSize: '0.8rem' }}>Accepted</span>
                            )}
                            {canCreate && municipality && (suggestion.dismissedBy || []).includes(municipality) && (
                              <span style={{ color: '#999', fontSize: '0.8rem' }}>Dismissed</span>
                            )}
                            {/* Super-admin edit/delete */}
                            {superAdmin && (
                              <div style={{ display: 'flex', gap: '6px' }}>
                                <button
                                  className="btn btn-secondary btn-sm"
                                  onClick={() => openEditSuggestionModal(suggestion)}
                                >
                                  Edit
                                </button>
                                <button
                                  className="btn btn-danger btn-sm"
                                  onClick={() => handleDeleteSuggestion(suggestion.id)}
                                >
                                  Delete
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <span style={{ color: '#5a6c7d' }}>{items.length} items</span>
          <div style={{ display: 'flex', gap: '8px' }}>
            {canCreate && (
              <>
                <button className="btn btn-secondary" onClick={openImportModal}>
                  Import Quebec Template
                </button>
                <button className="btn btn-primary" onClick={openNewModal}>
                  + New Item
                </button>
              </>
            )}
          </div>
        </div>

        {/* Filter bar */}
        {items.length > 0 && (
          <div style={{ display: 'flex', gap: '12px', padding: '0 20px 16px', flexWrap: 'wrap' }}>
            <input
              type="text"
              placeholder="Search items..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              style={{ flex: 1, minWidth: '200px' }}
            />
            <select
              value={binFilter}
              onChange={(e) => setBinFilter(e.target.value)}
              style={{ minWidth: '180px' }}
            >
              <option value="">All bins</option>
              {collectionTypes.map(ct => (
                <option key={ct.id} value={ct.id}>{ct.name?.fr || ct.id} / {ct.name?.en || ct.id}</option>
              ))}
            </select>
          </div>
        )}

        {loading ? (
          <p style={{ color: '#5a6c7d', padding: '20px' }}>Loading...</p>
        ) : items.length === 0 ? (
          <div className="empty-state">
            <div className="icon">🔍</div>
            <p>No waste items added yet</p>
            {canCreate && (
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
                <button className="btn btn-secondary" onClick={openImportModal}>
                  Import Quebec Template
                </button>
                <button className="btn btn-primary" onClick={openNewModal}>
                  Add your first item
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Name (FR)</th>
                  <th>Name (EN)</th>
                  <th>Bin</th>
                  <th>Note</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => {
                  const bin = getBinInfo(item.binId);
                  const isOrphaned = item.binId && !bin;
                  return (
                    <tr key={item.id}>
                      <td><strong>{item.nameFr}</strong></td>
                      <td>{item.nameEn}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {bin ? (
                            <>
                              <span style={{
                                display: 'inline-block',
                                width: '12px',
                                height: '12px',
                                borderRadius: '50%',
                                backgroundColor: bin.color || '#999',
                                flexShrink: 0,
                              }} />
                              <span>{bin.name?.fr || bin.id}</span>
                            </>
                          ) : isOrphaned ? (
                            <span style={{ color: '#e67e22', fontSize: '0.875rem' }}>
                              ⚠️ {item.binId} (missing)
                            </span>
                          ) : (
                            <span style={{ color: '#999' }}>—</span>
                          )}
                        </div>
                      </td>
                      <td style={{ fontSize: '0.875rem', color: '#5a6c7d', maxWidth: '200px' }}>
                        {item.noteFr && (
                          <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {item.noteFr}
                          </div>
                        )}
                      </td>
                      <td>
                        <div className="actions">
                          {canEdit && (
                            <button
                              className="btn btn-secondary btn-sm"
                              onClick={() => handleEdit(item)}
                            >
                              Edit
                            </button>
                          )}
                          {canDelete && (
                            <button
                              className="btn btn-danger btn-sm"
                              onClick={() => handleDelete(item.id)}
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredItems.length === 0 && (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', color: '#999', padding: '20px' }}>
                      No items match your search
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h3>{editingId ? 'Edit Item' : 'New Item'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label>Name (French) *</label>
                    <input
                      type="text"
                      value={form.nameFr}
                      onChange={(e) => setForm({ ...form, nameFr: e.target.value })}
                      required
                      placeholder="e.g., Boîte de pizza"
                    />
                  </div>
                  <div className="form-group">
                    <label>Name (English) *</label>
                    <input
                      type="text"
                      value={form.nameEn}
                      onChange={(e) => setForm({ ...form, nameEn: e.target.value })}
                      required
                      placeholder="e.g., Pizza box"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Bin / Collection Type *</label>
                  <select
                    value={form.binId}
                    onChange={(e) => setForm({ ...form, binId: e.target.value })}
                    required
                  >
                    <option value="">Select a bin...</option>
                    {collectionTypes.map(ct => (
                      <option key={ct.id} value={ct.id}>
                        {ct.name?.fr || ct.id} / {ct.name?.en || ct.id}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Note (French)</label>
                    <input
                      type="text"
                      value={form.noteFr}
                      onChange={(e) => setForm({ ...form, noteFr: e.target.value })}
                      placeholder="e.g., Doit être propre"
                    />
                  </div>
                  <div className="form-group">
                    <label>Note (English)</label>
                    <input
                      type="text"
                      value={form.noteEn}
                      onChange={(e) => setForm({ ...form, noteEn: e.target.value })}
                      placeholder="e.g., Must be clean"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Search Aliases (comma-separated)</label>
                  <input
                    type="text"
                    value={form.aliases}
                    onChange={(e) => setForm({ ...form, aliases: e.target.value })}
                    placeholder="e.g., boite pizza, carton pizza"
                  />
                  <small style={{ color: '#5a6c7d', marginTop: '4px', display: 'block' }}>
                    Additional search terms beyond the French/English names
                  </small>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingId ? 'Save Changes' : 'Create Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div className="modal-overlay" onClick={() => setShowImportModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '650px' }}>
            <div className="modal-header">
              <h3>Import Quebec Template</h3>
              <button className="modal-close" onClick={() => setShowImportModal(false)}>×</button>
            </div>
            <div className="modal-body">
              {importResult ? (
                <div style={{ textAlign: 'center', padding: '20px' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '12px' }}>✅</div>
                  <p style={{ fontSize: '1.1rem', fontWeight: '600' }}>
                    Import complete
                  </p>
                  <p style={{ color: '#5a6c7d' }}>
                    {importResult.imported} items imported, {importResult.skipped} duplicates skipped
                  </p>
                  <button
                    className="btn btn-primary"
                    onClick={() => setShowImportModal(false)}
                    style={{ marginTop: '16px' }}
                  >
                    Done
                  </button>
                </div>
              ) : (
                <>
                  <p style={{ marginBottom: '16px', color: '#5a6c7d' }}>
                    Map each template category to your municipality's bin types. Existing items with the same French name will be skipped.
                  </p>

                  <div style={{
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    marginBottom: '20px',
                  }}>
                    {Object.entries(quebecTemplate.categories).map(([catKey, catData], idx) => (
                      <div
                        key={catKey}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          padding: '12px 16px',
                          borderBottom: idx < Object.keys(quebecTemplate.categories).length - 1 ? '1px solid #e0e0e0' : 'none',
                          backgroundColor: idx % 2 === 0 ? '#fafafa' : 'white',
                        }}
                      >
                        <div style={{ flex: 1 }}>
                          <strong>{catData.nameFr}</strong>
                          <span style={{ color: '#5a6c7d', marginLeft: '8px' }}>
                            ({catData.items.length} items)
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ color: '#5a6c7d' }}>→</span>
                          <select
                            value={importMapping[catKey] || ''}
                            onChange={(e) => setImportMapping({ ...importMapping, [catKey]: e.target.value })}
                            style={{ minWidth: '180px' }}
                          >
                            <option value="">Skip this category</option>
                            {collectionTypes.map(ct => (
                              <option key={ct.id} value={ct.id}>
                                {ct.name?.fr || ct.id}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    ))}
                  </div>

                  {preview && (
                    <div style={{
                      padding: '12px 16px',
                      backgroundColor: '#f0f7ff',
                      borderRadius: '8px',
                      marginBottom: '16px',
                      fontSize: '0.9rem',
                    }}>
                      <strong>{preview.toImport}</strong> items to import
                      {preview.duplicates > 0 && (
                        <span> · <strong>{preview.duplicates}</strong> duplicates to skip</span>
                      )}
                      {preview.unmapped > 0 && (
                        <span> · <strong>{preview.unmapped}</strong> items in unmapped categories</span>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
            {!importResult && (
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowImportModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleImport}
                  disabled={importing || preview?.toImport === 0}
                >
                  {importing ? 'Importing...' : `Import ${preview?.toImport || 0} Items`}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
      {/* Suggestion Add/Edit Modal (super-admin) */}
      {showSuggestionModal && (
        <div className="modal-overlay" onClick={() => setShowSuggestionModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h3>{editingSuggestionId ? 'Edit Suggestion' : 'New Suggestion'}</h3>
              <button className="modal-close" onClick={() => setShowSuggestionModal(false)}>×</button>
            </div>
            <form onSubmit={handleSuggestionSubmit}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label>Name (French) *</label>
                    <input
                      type="text"
                      value={suggestionForm.nameFr}
                      onChange={(e) => setSuggestionForm({ ...suggestionForm, nameFr: e.target.value })}
                      required
                      placeholder="e.g., Cartouche d'encre"
                    />
                  </div>
                  <div className="form-group">
                    <label>Name (English) *</label>
                    <input
                      type="text"
                      value={suggestionForm.nameEn}
                      onChange={(e) => setSuggestionForm({ ...suggestionForm, nameEn: e.target.value })}
                      required
                      placeholder="e.g., Ink cartridge"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Category hint (French)</label>
                    <input
                      type="text"
                      value={suggestionForm.categoryFr}
                      onChange={(e) => setSuggestionForm({ ...suggestionForm, categoryFr: e.target.value })}
                      placeholder="e.g., Écocentre"
                    />
                  </div>
                  <div className="form-group">
                    <label>Category hint (English)</label>
                    <input
                      type="text"
                      value={suggestionForm.categoryEn}
                      onChange={(e) => setSuggestionForm({ ...suggestionForm, categoryEn: e.target.value })}
                      placeholder="e.g., Ecocentre"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Note (French)</label>
                    <input
                      type="text"
                      value={suggestionForm.noteFr}
                      onChange={(e) => setSuggestionForm({ ...suggestionForm, noteFr: e.target.value })}
                      placeholder="Optional note"
                    />
                  </div>
                  <div className="form-group">
                    <label>Note (English)</label>
                    <input
                      type="text"
                      value={suggestionForm.noteEn}
                      onChange={(e) => setSuggestionForm({ ...suggestionForm, noteEn: e.target.value })}
                      placeholder="Optional note"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Search Aliases (comma-separated)</label>
                  <input
                    type="text"
                    value={suggestionForm.aliases}
                    onChange={(e) => setSuggestionForm({ ...suggestionForm, aliases: e.target.value })}
                    placeholder="e.g., encre, ink, toner"
                  />
                  <small style={{ color: '#5a6c7d', marginTop: '4px', display: 'block' }}>
                    Additional search terms beyond the French/English names
                  </small>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowSuggestionModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingSuggestionId ? 'Save Changes' : 'Create Suggestion'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default WasteItems;
