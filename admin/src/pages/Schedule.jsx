import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, collection, getDocs, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import { can } from '../utils/permissions';

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sunday', labelFr: 'Dimanche' },
  { value: 1, label: 'Monday', labelFr: 'Lundi' },
  { value: 2, label: 'Tuesday', labelFr: 'Mardi' },
  { value: 3, label: 'Wednesday', labelFr: 'Mercredi' },
  { value: 4, label: 'Thursday', labelFr: 'Jeudi' },
  { value: 5, label: 'Friday', labelFr: 'Vendredi' },
  { value: 6, label: 'Saturday', labelFr: 'Samedi' },
];

const DEFAULT_COLLECTION_TYPES = [
  {
    id: 'recycling',
    name: { en: 'Recycling', fr: 'Recyclage' },
    binName: { en: 'Blue Bin', fr: 'Bac bleu' },
    color: '#2E86AB',
    binSize: '360L',
    accepted: { en: [], fr: [] },
    notAccepted: { en: [], fr: [] },
    tip: { en: '', fr: '' }
  },
  {
    id: 'compost',
    name: { en: 'Compost', fr: 'Compost' },
    binName: { en: 'Brown Bin', fr: 'Bac brun' },
    color: '#8B5A2B',
    binSize: '80L',
    accepted: { en: [], fr: [] },
    notAccepted: { en: [], fr: [] },
    tip: { en: '', fr: '' }
  },
  {
    id: 'garbage',
    name: { en: 'Garbage', fr: 'Ordures' },
    binName: { en: 'Black Bin', fr: 'Bac noir' },
    color: '#4A4A4A',
    binSize: '240L',
    accepted: { en: [], fr: [] },
    notAccepted: { en: [], fr: [] },
    tip: { en: '', fr: '' }
  }
];

const DEFAULT_ZONES = [
  { id: 'east', nameEn: 'East Sector', nameFr: 'Secteur Est', descriptionEn: '', descriptionFr: '' },
  { id: 'west', nameEn: 'West Sector', nameFr: 'Secteur Ouest', descriptionEn: '', descriptionFr: '' }
];

function Schedule() {
  const { municipality, adminData } = useAuth();
  const canEdit = can(adminData?.role, 'schedule', 'edit');
  const canEditZones = can(adminData?.role, 'zones', 'edit');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('types');

  // Data state
  const [collectionTypes, setCollectionTypes] = useState(DEFAULT_COLLECTION_TYPES);
  const [zones, setZones] = useState(DEFAULT_ZONES);
  const [schedules, setSchedules] = useState({});
  const [guidelines, setGuidelines] = useState({
    timing: { en: '', fr: '' },
    position: { en: [], fr: [] }
  });
  const [zoneMapUrl, setZoneMapUrl] = useState('');

  // Special collections state
  const [specialCollections, setSpecialCollections] = useState([]);
  const [specialFilter, setSpecialFilter] = useState('upcoming'); // 'upcoming', 'past', 'all'

  // Modal state
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [showZoneModal, setShowZoneModal] = useState(false);
  const [showSpecialModal, setShowSpecialModal] = useState(false);
  const [editingType, setEditingType] = useState(null);
  const [editingZone, setEditingZone] = useState(null);
  const [editingSpecial, setEditingSpecial] = useState(null);

  useEffect(() => {
    if (municipality) {
      loadScheduleData();
    }
  }, [municipality]);

  const loadScheduleData = async () => {
    try {
      const scheduleRef = doc(db, 'municipalities', municipality, 'data', 'schedule');
      const docSnap = await getDoc(scheduleRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.collectionTypes?.length > 0) {
          setCollectionTypes(data.collectionTypes);
        }
        if (data.zones?.length > 0) {
          setZones(data.zones);
        }
        if (data.schedules) {
          setSchedules(data.schedules);
        }
        if (data.guidelines) {
          setGuidelines(data.guidelines);
        }
        if (data.zoneMapUrl) {
          setZoneMapUrl(data.zoneMapUrl);
        }
        if (data.specialCollections) {
          setSpecialCollections(data.specialCollections);
        }
      }
    } catch (error) {
      console.error('Error loading schedule:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveScheduleData = async () => {
    setSaving(true);
    try {
      // Save schedule document
      const scheduleRef = doc(db, 'municipalities', municipality, 'data', 'schedule');
      await setDoc(scheduleRef, {
        collectionTypes,
        zones,
        schedules,
        guidelines,
        zoneMapUrl,
        specialCollections,
        updatedAt: new Date().toISOString()
      });

      // Sync zones to zones collection for mobile app
      const zonesCol = collection(db, 'municipalities', municipality, 'zones');

      // Get existing zones to delete removed ones
      const existingZones = await getDocs(zonesCol);
      const existingIds = existingZones.docs.map(d => d.id);
      const newIds = zones.map(z => z.id);

      // Delete removed zones
      for (const existingId of existingIds) {
        if (!newIds.includes(existingId)) {
          await deleteDoc(doc(db, 'municipalities', municipality, 'zones', existingId));
        }
      }

      // Add/update zones
      for (const zone of zones) {
        await setDoc(doc(db, 'municipalities', municipality, 'zones', zone.id), {
          name: zone.nameEn,
          nameEn: zone.nameEn,
          nameFr: zone.nameFr,
          description: {
            en: zone.descriptionEn || '',
            fr: zone.descriptionFr || ''
          },
          updatedAt: new Date().toISOString()
        });
      }

      alert('Schedule saved successfully!');
    } catch (error) {
      alert('Error saving schedule: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  // Collection Type handlers
  const openTypeModal = (type = null) => {
    setEditingType(type ? { ...type } : {
      id: '',
      name: { en: '', fr: '' },
      binName: { en: '', fr: '' },
      color: '#2E86AB',
      binSize: '',
      accepted: { en: [], fr: [] },
      notAccepted: { en: [], fr: [] },
      tip: { en: '', fr: '' }
    });
    setShowTypeModal(true);
  };

  const saveType = () => {
    if (!editingType.id || !editingType.name.en) {
      alert('Please fill in the ID and English name');
      return;
    }

    const existingIndex = collectionTypes.findIndex(t => t.id === editingType.id);
    if (existingIndex >= 0) {
      const updated = [...collectionTypes];
      updated[existingIndex] = editingType;
      setCollectionTypes(updated);
    } else {
      setCollectionTypes([...collectionTypes, editingType]);
    }
    setShowTypeModal(false);
    setEditingType(null);
  };

  const deleteType = (id) => {
    if (!confirm('Delete this collection type?')) return;
    setCollectionTypes(collectionTypes.filter(t => t.id !== id));
    // Also remove from schedules
    const newSchedules = { ...schedules };
    Object.keys(newSchedules).forEach(zoneId => {
      delete newSchedules[zoneId][id];
    });
    setSchedules(newSchedules);
  };

  // Zone handlers
  const openZoneModal = (zone = null) => {
    setEditingZone(zone ? { ...zone } : {
      id: '',
      nameEn: '',
      nameFr: '',
      descriptionEn: '',
      descriptionFr: ''
    });
    setShowZoneModal(true);
  };

  const saveZone = () => {
    if (!editingZone.id || !editingZone.nameEn) {
      alert('Please fill in the ID and English name');
      return;
    }

    const existingIndex = zones.findIndex(z => z.id === editingZone.id);
    if (existingIndex >= 0) {
      const updated = [...zones];
      updated[existingIndex] = editingZone;
      setZones(updated);
    } else {
      setZones([...zones, editingZone]);
      // Initialize empty schedule for new zone
      setSchedules({ ...schedules, [editingZone.id]: {} });
    }
    setShowZoneModal(false);
    setEditingZone(null);
  };

  const deleteZone = (id) => {
    if (!confirm('Delete this zone?')) return;
    setZones(zones.filter(z => z.id !== id));
    const newSchedules = { ...schedules };
    delete newSchedules[id];
    setSchedules(newSchedules);
  };

  // Schedule handlers
  const updateZoneSchedule = (zoneId, typeId, field, value) => {
    setSchedules(prev => ({
      ...prev,
      [zoneId]: {
        ...prev[zoneId],
        [typeId]: {
          ...prev[zoneId]?.[typeId],
          [field]: value
        }
      }
    }));
  };

  const toggleTypeForZone = (zoneId, typeId, enabled) => {
    if (enabled) {
      setSchedules(prev => ({
        ...prev,
        [zoneId]: {
          ...prev[zoneId],
          [typeId]: { dayOfWeek: 1, frequency: 'weekly', time: '07:00' }
        }
      }));
    } else {
      setSchedules(prev => {
        const newZoneSchedule = { ...prev[zoneId] };
        delete newZoneSchedule[typeId];
        return { ...prev, [zoneId]: newZoneSchedule };
      });
    }
  };

  // Guidelines handlers
  const updateGuideline = (field, lang, value) => {
    setGuidelines(prev => ({
      ...prev,
      [field]: {
        ...prev[field],
        [lang]: value
      }
    }));
  };

  const updatePositionList = (lang, text) => {
    const items = text.split('\n').filter(item => item.trim());
    setGuidelines(prev => ({
      ...prev,
      position: {
        ...prev.position,
        [lang]: items
      }
    }));
  };

  // Special Collections handlers
  const openSpecialModal = (special = null) => {
    setEditingSpecial(special ? { ...special } : {
      id: `special-${Date.now()}`,
      collectionTypeId: '',
      customName: null,
      customColor: null,
      date: '',
      time: '',
      endTime: '',
      zones: [],
      description: { en: '', fr: '' },
      location: '',
      active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    setShowSpecialModal(true);
  };

  const saveSpecial = () => {
    if (!editingSpecial.date) {
      alert('Please select a date');
      return;
    }
    if (!editingSpecial.collectionTypeId && (!editingSpecial.customName?.en || !editingSpecial.customName?.fr)) {
      alert('Please select a collection type or provide custom names in both languages');
      return;
    }

    editingSpecial.updatedAt = new Date().toISOString();

    const existingIndex = specialCollections.findIndex(s => s.id === editingSpecial.id);
    if (existingIndex >= 0) {
      const updated = [...specialCollections];
      updated[existingIndex] = editingSpecial;
      setSpecialCollections(updated);
    } else {
      setSpecialCollections([...specialCollections, editingSpecial]);
    }
    setShowSpecialModal(false);
    setEditingSpecial(null);
  };

  const deleteSpecial = (id) => {
    if (!confirm('Delete this special collection?')) return;
    setSpecialCollections(specialCollections.filter(s => s.id !== id));
  };

  // Filter special collections based on filter state
  const getFilteredSpecialCollections = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return specialCollections.filter(sc => {
      const scDate = new Date(sc.date);
      scDate.setHours(0, 0, 0, 0);

      if (specialFilter === 'upcoming') {
        return scDate >= today;
      } else if (specialFilter === 'past') {
        return scDate < today;
      }
      return true; // 'all'
    }).sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return specialFilter === 'past' ? dateB - dateA : dateA - dateB;
    });
  };

  // Get display name for a special collection
  const getSpecialDisplayName = (sc) => {
    if (sc.collectionTypeId) {
      const type = collectionTypes.find(t => t.id === sc.collectionTypeId);
      return type ? `${type.name.en} / ${type.name.fr}` : sc.collectionTypeId;
    }
    return `${sc.customName?.en || ''} / ${sc.customName?.fr || ''}`;
  };

  // Get display color for a special collection
  const getSpecialDisplayColor = (sc) => {
    if (sc.collectionTypeId) {
      const type = collectionTypes.find(t => t.id === sc.collectionTypeId);
      return type?.color || '#888888';
    }
    return sc.customColor || '#888888';
  };

  if (loading) {
    return <div style={{ padding: 20, color: '#5a6c7d' }}>Loading...</div>;
  }

  return (
    <div>
      <div className="page-header">
        <h2>Collection Schedule</h2>
        <p>Configure waste collection types, zones, and schedules</p>
      </div>

      {/* Tab Navigation */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {['types', 'zones', 'schedules', 'guidelines', 'special'].map(tab => (
          <button
            key={tab}
            className={`btn ${activeTab === tab ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab === 'types' ? 'Collection Types' :
             tab === 'zones' ? 'Zones' :
             tab === 'schedules' ? 'Schedules' :
             tab === 'guidelines' ? 'Guidelines' : 'Special Collections'}
          </button>
        ))}
      </div>

      {/* Collection Types Tab */}
      {activeTab === 'types' && (
        <div className="card">
          <div className="card-header">
            <h3>Collection Types</h3>
            {canEdit && (
              <button className="btn btn-primary" onClick={() => openTypeModal()}>
                + Add Type
              </button>
            )}
          </div>

          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Color</th>
                  <th>Name</th>
                  <th>Bin</th>
                  <th>Size</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {collectionTypes.map(type => (
                  <tr key={type.id}>
                    <td>
                      <div style={{
                        width: 24,
                        height: 24,
                        borderRadius: 4,
                        backgroundColor: type.color
                      }} />
                    </td>
                    <td>
                      <strong>{type.name.en}</strong>
                      <br />
                      <span style={{ fontSize: '0.875rem', color: '#5a6c7d' }}>
                        {type.name.fr}
                      </span>
                    </td>
                    <td>
                      {type.binName.en}
                      <br />
                      <span style={{ fontSize: '0.875rem', color: '#5a6c7d' }}>
                        {type.binName.fr}
                      </span>
                    </td>
                    <td>{type.binSize}</td>
                    <td>
                      {canEdit && (
                        <div className="actions">
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => openTypeModal(type)}
                          >
                            Edit
                          </button>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => deleteType(type.id)}
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Zones Tab */}
      {activeTab === 'zones' && (
        <div className="card">
          <div className="card-header">
            <h3>Collection Zones</h3>
            {canEditZones && (
              <button className="btn btn-primary" onClick={() => openZoneModal()}>
                + Add Zone
              </button>
            )}
          </div>

          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Description</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {zones.map(zone => (
                  <tr key={zone.id}>
                    <td><code>{zone.id}</code></td>
                    <td>
                      <strong>{zone.nameEn}</strong>
                      <br />
                      <span style={{ fontSize: '0.875rem', color: '#5a6c7d' }}>
                        {zone.nameFr}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.875rem', color: '#5a6c7d' }}>
                      {zone.descriptionEn || '-'}
                    </td>
                    <td>
                      {canEditZones && (
                        <div className="actions">
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => openZoneModal(zone)}
                          >
                            Edit
                          </button>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => deleteZone(zone.id)}
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Zone Map URL */}
          <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid #e8e4dc' }}>
            <h4 style={{ marginBottom: 12 }}>Zone Map Link</h4>
            <p style={{ fontSize: '0.875rem', color: '#5a6c7d', marginBottom: 12 }}>
              If you have more than one zone, you can provide a link to a map that helps residents identify their zone. This will be shown on the zone selection screen in the mobile app.
            </p>
            <div className="form-group">
              <label>Map URL</label>
              <input
                type="url"
                value={zoneMapUrl}
                onChange={(e) => setZoneMapUrl(e.target.value)}
                placeholder="https://example.com/zone-map.pdf"
                disabled={!canEditZones}
              />
            </div>
          </div>
        </div>
      )}

      {/* Schedules Tab */}
      {activeTab === 'schedules' && (
        <div className="card">
          <div className="card-header">
            <h3>Zone Schedules</h3>
          </div>

          {zones.map(zone => (
            <div key={zone.id} style={{ marginBottom: 24 }}>
              <h4 style={{ marginBottom: 12, color: '#0d5c63' }}>
                {zone.nameEn} / {zone.nameFr}
              </h4>

              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Enabled</th>
                      <th>Type</th>
                      <th>Day</th>
                      <th>Frequency</th>
                      <th>Start Date (biweekly)</th>
                      <th>Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {collectionTypes.map(type => {
                      const zoneSchedule = schedules[zone.id]?.[type.id];
                      const isEnabled = !!zoneSchedule;

                      return (
                        <tr key={type.id}>
                          <td>
                            <input
                              type="checkbox"
                              checked={isEnabled}
                              onChange={(e) => toggleTypeForZone(zone.id, type.id, e.target.checked)}
                              style={{ width: 'auto' }}
                              disabled={!canEdit}
                            />
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <div style={{
                                width: 16,
                                height: 16,
                                borderRadius: 4,
                                backgroundColor: type.color
                              }} />
                              {type.name.en}
                            </div>
                          </td>
                          <td>
                            <select
                              value={zoneSchedule?.dayOfWeek ?? ''}
                              onChange={(e) => updateZoneSchedule(zone.id, type.id, 'dayOfWeek', parseInt(e.target.value))}
                              disabled={!isEnabled || !canEdit}
                              style={{ minWidth: 120 }}
                            >
                              {DAYS_OF_WEEK.map(day => (
                                <option key={day.value} value={day.value}>
                                  {day.label}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td>
                            <select
                              value={zoneSchedule?.frequency ?? 'weekly'}
                              onChange={(e) => updateZoneSchedule(zone.id, type.id, 'frequency', e.target.value)}
                              disabled={!isEnabled || !canEdit}
                            >
                              <option value="weekly">Weekly</option>
                              <option value="biweekly">Every 2 weeks</option>
                            </select>
                          </td>
                          <td>
                            <input
                              type="date"
                              value={zoneSchedule?.startDate ?? ''}
                              onChange={(e) => updateZoneSchedule(zone.id, type.id, 'startDate', e.target.value)}
                              disabled={!isEnabled || zoneSchedule?.frequency !== 'biweekly' || !canEdit}
                              style={{ minWidth: 140 }}
                            />
                          </td>
                          <td>
                            <input
                              type="time"
                              value={zoneSchedule?.time ?? '07:00'}
                              onChange={(e) => updateZoneSchedule(zone.id, type.id, 'time', e.target.value)}
                              disabled={!isEnabled || !canEdit}
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Guidelines Tab */}
      {activeTab === 'guidelines' && (
        <div className="card">
          <div className="card-header">
            <h3>Collection Guidelines</h3>
          </div>

          <div style={{ display: 'grid', gap: 20 }}>
            <div>
              <h4 style={{ marginBottom: 12 }}>Timing Instructions</h4>
              <div className="form-row">
                <div className="form-group">
                  <label>English</label>
                  <textarea
                    value={guidelines.timing?.en || ''}
                    onChange={(e) => updateGuideline('timing', 'en', e.target.value)}
                    placeholder="e.g., Put out by 7:00 AM on collection day"
                    rows={2}
                    disabled={!canEdit}
                  />
                </div>
                <div className="form-group">
                  <label>French</label>
                  <textarea
                    value={guidelines.timing?.fr || ''}
                    onChange={(e) => updateGuideline('timing', 'fr', e.target.value)}
                    placeholder="e.g., Sortir avant 7h00 le jour de collecte"
                    rows={2}
                    disabled={!canEdit}
                  />
                </div>
              </div>
            </div>

            <div>
              <h4 style={{ marginBottom: 12 }}>Bin Placement Instructions (one per line)</h4>
              <div className="form-row">
                <div className="form-group">
                  <label>English</label>
                  <textarea
                    value={(guidelines.position?.en || []).join('\n')}
                    onChange={(e) => updatePositionList('en', e.target.value)}
                    placeholder="Cover closed&#10;Handle facing home&#10;2 feet clearance"
                    rows={6}
                    disabled={!canEdit}
                  />
                </div>
                <div className="form-group">
                  <label>French</label>
                  <textarea
                    value={(guidelines.position?.fr || []).join('\n')}
                    onChange={(e) => updatePositionList('fr', e.target.value)}
                    placeholder="Couvercle fermé&#10;Poignée face à la maison&#10;2 pieds de dégagement"
                    rows={6}
                    disabled={!canEdit}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Special Collections Tab */}
      {activeTab === 'special' && (
        <div className="card">
          <div className="card-header">
            <h3>Special Collections</h3>
            {canEdit && (
              <button className="btn btn-primary" onClick={() => openSpecialModal()}>
                + Add Special Collection
              </button>
            )}
          </div>

          <p style={{ fontSize: '0.875rem', color: '#5a6c7d', marginBottom: 16 }}>
            One-time collection events like hazardous waste days, bulk item pickup, etc.
          </p>

          {/* Filter buttons */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            {['upcoming', 'past', 'all'].map(filter => (
              <button
                key={filter}
                className={`btn btn-sm ${specialFilter === filter ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setSpecialFilter(filter)}
                style={{ textTransform: 'capitalize' }}
              >
                {filter}
              </button>
            ))}
          </div>

          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Color</th>
                  <th>Date</th>
                  <th>Name</th>
                  <th>Zones</th>
                  <th>Time</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {getFilteredSpecialCollections().length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', color: '#5a6c7d' }}>
                      No {specialFilter !== 'all' ? specialFilter : ''} special collections
                    </td>
                  </tr>
                ) : (
                  getFilteredSpecialCollections().map(sc => (
                    <tr key={sc.id}>
                      <td>
                        <div style={{
                          width: 24,
                          height: 24,
                          borderRadius: 4,
                          backgroundColor: getSpecialDisplayColor(sc)
                        }} />
                      </td>
                      <td>
                        <strong>{sc.date}</strong>
                      </td>
                      <td>
                        {sc.collectionTypeId ? (
                          <>
                            {collectionTypes.find(t => t.id === sc.collectionTypeId)?.name.en || sc.collectionTypeId}
                            <br />
                            <span style={{ fontSize: '0.875rem', color: '#5a6c7d' }}>
                              {collectionTypes.find(t => t.id === sc.collectionTypeId)?.name.fr || ''}
                            </span>
                          </>
                        ) : (
                          <>
                            {sc.customName?.en || 'Custom'}
                            <br />
                            <span style={{ fontSize: '0.875rem', color: '#5a6c7d' }}>
                              {sc.customName?.fr || ''}
                            </span>
                          </>
                        )}
                      </td>
                      <td>
                        {sc.zones?.length === 0 ? (
                          <span style={{ color: '#5a6c7d' }}>All zones</span>
                        ) : (
                          sc.zones?.join(', ')
                        )}
                      </td>
                      <td>
                        {sc.time ? (
                          <>
                            {sc.time}
                            {sc.endTime ? ` - ${sc.endTime}` : ''}
                          </>
                        ) : (
                          <span style={{ color: '#5a6c7d' }}>-</span>
                        )}
                      </td>
                      <td>
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: 4,
                          fontSize: '0.75rem',
                          backgroundColor: sc.active ? '#E8F5E9' : '#FFEBEE',
                          color: sc.active ? '#2E7D32' : '#C62828'
                        }}>
                          {sc.active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        {canEdit && (
                          <div className="actions">
                            <button
                              className="btn btn-secondary btn-sm"
                              onClick={() => openSpecialModal(sc)}
                            >
                              Edit
                            </button>
                            <button
                              className="btn btn-danger btn-sm"
                              onClick={() => deleteSpecial(sc.id)}
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Save Button */}
      {canEdit && (
        <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end' }}>
          <button
            className="btn btn-primary"
            onClick={saveScheduleData}
            disabled={saving}
            style={{ minWidth: 150 }}
          >
            {saving ? 'Saving...' : 'Save All Changes'}
          </button>
        </div>
      )}

      {/* Collection Type Modal */}
      {showTypeModal && editingType && (
        <div className="modal-overlay" onClick={() => setShowTypeModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 700 }}>
            <div className="modal-header">
              <h3>{editingType.id ? 'Edit Collection Type' : 'New Collection Type'}</h3>
              <button className="modal-close" onClick={() => setShowTypeModal(false)}>×</button>
            </div>
            <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
              <div className="form-row">
                <div className="form-group">
                  <label>ID (lowercase, no spaces) *</label>
                  <input
                    type="text"
                    value={editingType.id}
                    onChange={(e) => setEditingType({ ...editingType, id: e.target.value.toLowerCase().replace(/\s/g, '') })}
                    placeholder="e.g., recycling"
                    disabled={collectionTypes.some(t => t.id === editingType.id)}
                  />
                </div>
                <div className="form-group">
                  <label>Color</label>
                  <input
                    type="color"
                    value={editingType.color}
                    onChange={(e) => setEditingType({ ...editingType, color: e.target.value })}
                    style={{ height: 40, padding: 4 }}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Name (English) *</label>
                  <input
                    type="text"
                    value={editingType.name.en}
                    onChange={(e) => setEditingType({ ...editingType, name: { ...editingType.name, en: e.target.value } })}
                    placeholder="e.g., Recycling"
                  />
                </div>
                <div className="form-group">
                  <label>Name (French) *</label>
                  <input
                    type="text"
                    value={editingType.name.fr}
                    onChange={(e) => setEditingType({ ...editingType, name: { ...editingType.name, fr: e.target.value } })}
                    placeholder="e.g., Recyclage"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Bin Name (English)</label>
                  <input
                    type="text"
                    value={editingType.binName.en}
                    onChange={(e) => setEditingType({ ...editingType, binName: { ...editingType.binName, en: e.target.value } })}
                    placeholder="e.g., Blue Bin"
                  />
                </div>
                <div className="form-group">
                  <label>Bin Name (French)</label>
                  <input
                    type="text"
                    value={editingType.binName.fr}
                    onChange={(e) => setEditingType({ ...editingType, binName: { ...editingType.binName, fr: e.target.value } })}
                    placeholder="e.g., Bac bleu"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Bin Size</label>
                <input
                  type="text"
                  value={editingType.binSize}
                  onChange={(e) => setEditingType({ ...editingType, binSize: e.target.value })}
                  placeholder="e.g., 360L"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Accepted Items (English, one per line)</label>
                  <textarea
                    value={(editingType.accepted?.en || []).join('\n')}
                    onChange={(e) => setEditingType({
                      ...editingType,
                      accepted: { ...editingType.accepted, en: e.target.value.split('\n').filter(s => s.trim()) }
                    })}
                    rows={5}
                    placeholder="Metal containers&#10;Glass containers&#10;Plastic containers"
                  />
                </div>
                <div className="form-group">
                  <label>Accepted Items (French, one per line)</label>
                  <textarea
                    value={(editingType.accepted?.fr || []).join('\n')}
                    onChange={(e) => setEditingType({
                      ...editingType,
                      accepted: { ...editingType.accepted, fr: e.target.value.split('\n').filter(s => s.trim()) }
                    })}
                    rows={5}
                    placeholder="Contenants en métal&#10;Contenants en verre&#10;Contenants en plastique"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Not Accepted (English, one per line)</label>
                  <textarea
                    value={(editingType.notAccepted?.en || []).join('\n')}
                    onChange={(e) => setEditingType({
                      ...editingType,
                      notAccepted: { ...editingType.notAccepted, en: e.target.value.split('\n').filter(s => s.trim()) }
                    })}
                    rows={5}
                    placeholder="Plastic bags&#10;Styrofoam&#10;Electronics"
                  />
                </div>
                <div className="form-group">
                  <label>Not Accepted (French, one per line)</label>
                  <textarea
                    value={(editingType.notAccepted?.fr || []).join('\n')}
                    onChange={(e) => setEditingType({
                      ...editingType,
                      notAccepted: { ...editingType.notAccepted, fr: e.target.value.split('\n').filter(s => s.trim()) }
                    })}
                    rows={5}
                    placeholder="Sacs en plastique&#10;Styromousse&#10;Électroniques"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Tip (English)</label>
                  <textarea
                    value={editingType.tip?.en || ''}
                    onChange={(e) => setEditingType({ ...editingType, tip: { ...editingType.tip, en: e.target.value } })}
                    rows={2}
                    placeholder="Quick tip for residents"
                  />
                </div>
                <div className="form-group">
                  <label>Tip (French)</label>
                  <textarea
                    value={editingType.tip?.fr || ''}
                    onChange={(e) => setEditingType({ ...editingType, tip: { ...editingType.tip, fr: e.target.value } })}
                    rows={2}
                    placeholder="Conseil rapide pour les résidents"
                  />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowTypeModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={saveType}>Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Zone Modal */}
      {showZoneModal && editingZone && (
        <div className="modal-overlay" onClick={() => setShowZoneModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{zones.some(z => z.id === editingZone.id) ? 'Edit Zone' : 'New Zone'}</h3>
              <button className="modal-close" onClick={() => setShowZoneModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>ID (lowercase, no spaces) *</label>
                <input
                  type="text"
                  value={editingZone.id}
                  onChange={(e) => setEditingZone({ ...editingZone, id: e.target.value.toLowerCase().replace(/\s/g, '') })}
                  placeholder="e.g., east"
                  disabled={zones.some(z => z.id === editingZone.id)}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Name (English) *</label>
                  <input
                    type="text"
                    value={editingZone.nameEn}
                    onChange={(e) => setEditingZone({ ...editingZone, nameEn: e.target.value })}
                    placeholder="e.g., East Sector"
                  />
                </div>
                <div className="form-group">
                  <label>Name (French) *</label>
                  <input
                    type="text"
                    value={editingZone.nameFr}
                    onChange={(e) => setEditingZone({ ...editingZone, nameFr: e.target.value })}
                    placeholder="e.g., Secteur Est"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Description (English)</label>
                  <input
                    type="text"
                    value={editingZone.descriptionEn}
                    onChange={(e) => setEditingZone({ ...editingZone, descriptionEn: e.target.value })}
                    placeholder="e.g., East of Main Street"
                  />
                </div>
                <div className="form-group">
                  <label>Description (French)</label>
                  <input
                    type="text"
                    value={editingZone.descriptionFr}
                    onChange={(e) => setEditingZone({ ...editingZone, descriptionFr: e.target.value })}
                    placeholder="e.g., Est de la rue Principale"
                  />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowZoneModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={saveZone}>Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Special Collection Modal */}
      {showSpecialModal && editingSpecial && (
        <div className="modal-overlay" onClick={() => setShowSpecialModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 600 }}>
            <div className="modal-header">
              <h3>{specialCollections.some(s => s.id === editingSpecial.id) ? 'Edit Special Collection' : 'New Special Collection'}</h3>
              <button className="modal-close" onClick={() => setShowSpecialModal(false)}>×</button>
            </div>
            <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
              {/* Collection Type Selection */}
              <div className="form-group">
                <label>Collection Type</label>
                <select
                  value={editingSpecial.collectionTypeId || 'custom'}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === 'custom') {
                      setEditingSpecial({
                        ...editingSpecial,
                        collectionTypeId: '',
                        customName: { en: '', fr: '' },
                        customColor: '#888888'
                      });
                    } else {
                      setEditingSpecial({
                        ...editingSpecial,
                        collectionTypeId: value,
                        customName: null,
                        customColor: null
                      });
                    }
                  }}
                >
                  <option value="custom">Custom (specify below)</option>
                  {collectionTypes.map(type => (
                    <option key={type.id} value={type.id}>
                      {type.name.en} / {type.name.fr}
                    </option>
                  ))}
                </select>
              </div>

              {/* Custom Name/Color (shown only if custom selected) */}
              {!editingSpecial.collectionTypeId && (
                <>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Custom Name (English) *</label>
                      <input
                        type="text"
                        value={editingSpecial.customName?.en || ''}
                        onChange={(e) => setEditingSpecial({
                          ...editingSpecial,
                          customName: { ...editingSpecial.customName, en: e.target.value }
                        })}
                        placeholder="e.g., Hazardous Waste Day"
                      />
                    </div>
                    <div className="form-group">
                      <label>Custom Name (French) *</label>
                      <input
                        type="text"
                        value={editingSpecial.customName?.fr || ''}
                        onChange={(e) => setEditingSpecial({
                          ...editingSpecial,
                          customName: { ...editingSpecial.customName, fr: e.target.value }
                        })}
                        placeholder="e.g., Journée des matières dangereuses"
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Custom Color</label>
                    <input
                      type="color"
                      value={editingSpecial.customColor || '#888888'}
                      onChange={(e) => setEditingSpecial({ ...editingSpecial, customColor: e.target.value })}
                      style={{ height: 40, padding: 4, width: 100 }}
                    />
                  </div>
                </>
              )}

              {/* Date (required) */}
              <div className="form-group">
                <label>Date *</label>
                <input
                  type="date"
                  value={editingSpecial.date}
                  onChange={(e) => setEditingSpecial({ ...editingSpecial, date: e.target.value })}
                  style={{ minWidth: 180 }}
                />
              </div>

              {/* Time Range (optional) */}
              <div className="form-row">
                <div className="form-group">
                  <label>Start Time (optional)</label>
                  <input
                    type="time"
                    value={editingSpecial.time || ''}
                    onChange={(e) => setEditingSpecial({ ...editingSpecial, time: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>End Time (optional)</label>
                  <input
                    type="time"
                    value={editingSpecial.endTime || ''}
                    onChange={(e) => setEditingSpecial({ ...editingSpecial, endTime: e.target.value })}
                  />
                </div>
              </div>

              {/* Zones (multi-select) */}
              <div className="form-group">
                <label>Zones (leave empty for all zones)</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {zones.map(zone => (
                    <label key={zone.id} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <input
                        type="checkbox"
                        checked={editingSpecial.zones?.includes(zone.id) || false}
                        onChange={(e) => {
                          const currentZones = editingSpecial.zones || [];
                          if (e.target.checked) {
                            setEditingSpecial({ ...editingSpecial, zones: [...currentZones, zone.id] });
                          } else {
                            setEditingSpecial({ ...editingSpecial, zones: currentZones.filter(z => z !== zone.id) });
                          }
                        }}
                        style={{ width: 'auto' }}
                      />
                      {zone.nameEn}
                    </label>
                  ))}
                </div>
              </div>

              {/* Description (bilingual) */}
              <div className="form-row">
                <div className="form-group">
                  <label>Description (English)</label>
                  <textarea
                    value={editingSpecial.description?.en || ''}
                    onChange={(e) => setEditingSpecial({
                      ...editingSpecial,
                      description: { ...editingSpecial.description, en: e.target.value }
                    })}
                    placeholder="Optional notes about this collection"
                    rows={2}
                  />
                </div>
                <div className="form-group">
                  <label>Description (French)</label>
                  <textarea
                    value={editingSpecial.description?.fr || ''}
                    onChange={(e) => setEditingSpecial({
                      ...editingSpecial,
                      description: { ...editingSpecial.description, fr: e.target.value }
                    })}
                    placeholder="Notes optionnelles sur cette collecte"
                    rows={2}
                  />
                </div>
              </div>

              {/* Location (optional) */}
              <div className="form-group">
                <label>Drop-off Location (optional)</label>
                <input
                  type="text"
                  value={editingSpecial.location || ''}
                  onChange={(e) => setEditingSpecial({ ...editingSpecial, location: e.target.value })}
                  placeholder="e.g., 123 Main Street, City Hall parking lot"
                />
              </div>

              {/* Active toggle */}
              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input
                    type="checkbox"
                    checked={editingSpecial.active}
                    onChange={(e) => setEditingSpecial({ ...editingSpecial, active: e.target.checked })}
                    style={{ width: 'auto' }}
                  />
                  Active (visible to users)
                </label>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowSpecialModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={saveSpecial}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Schedule;
