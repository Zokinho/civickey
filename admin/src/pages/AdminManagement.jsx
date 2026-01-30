import { useState, useEffect } from 'react';
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  setDoc,
  serverTimestamp
} from 'firebase/firestore';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut as firebaseSignOut } from 'firebase/auth';
import { db, secondaryAuth } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import { ROLES, ROLE_DISPLAY_NAMES, ROLE_DESCRIPTIONS, getAssignableRoles } from '../utils/permissions';
import './AdminManagement.css';

export default function AdminManagement() {
  const { adminData, municipality, municipalitiesList, loadMunicipalities, isSuperAdmin } = useAuth();
  const [admins, setAdmins] = useState([]);
  const [allAdmins, setAllAdmins] = useState([]); // All admins across municipalities
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [saving, setSaving] = useState(false);
  const [viewAllMunicipalities, setViewAllMunicipalities] = useState(false);

  // Form state for creating new admin
  const [newAdmin, setNewAdmin] = useState({
    email: '',
    name: '',
    role: ROLES.VIEWER,
    password: '',
    municipalityId: municipality || ''
  });

  useEffect(() => {
    if (isSuperAdmin()) {
      loadMunicipalities();
      loadAdmins();
    }
  }, [municipality]);

  // Update newAdmin municipality when municipality changes
  useEffect(() => {
    if (municipality) {
      setNewAdmin(prev => ({ ...prev, municipalityId: municipality }));
    }
  }, [municipality]);

  const loadAdmins = async () => {
    try {
      setLoading(true);
      setError(null);

      // Query admins for the current municipality
      const adminsQuery = query(
        collection(db, 'admins'),
        where('municipalityId', '==', municipality)
      );

      const snapshot = await getDocs(adminsQuery);
      const adminsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Sort by role (super-admin first) then by name
      adminsList.sort((a, b) => {
        const roleOrder = { 'super-admin': 0, 'admin': 1, 'editor': 2, 'viewer': 3 };
        const roleCompare = (roleOrder[a.role] || 4) - (roleOrder[b.role] || 4);
        if (roleCompare !== 0) return roleCompare;
        return (a.name || a.email).localeCompare(b.name || b.email);
      });

      setAdmins(adminsList);
    } catch (err) {
      console.error('Error loading admins:', err);
      setError('Failed to load admin users');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      // Create the user using secondary auth instance to avoid logging out current user
      const userCredential = await createUserWithEmailAndPassword(
        secondaryAuth,
        newAdmin.email,
        newAdmin.password
      );

      // Create the admin document in Firestore
      await setDoc(doc(db, 'admins', userCredential.user.uid), {
        email: newAdmin.email,
        name: newAdmin.name,
        role: newAdmin.role,
        municipalityId: newAdmin.municipalityId,
        active: true,
        createdAt: serverTimestamp(),
        createdBy: adminData.id
      });

      // Sign out of the secondary auth instance
      await firebaseSignOut(secondaryAuth);

      // Reset form and close modal
      setNewAdmin({ email: '', name: '', role: ROLES.VIEWER, password: '', municipalityId: municipality });
      setShowCreateModal(false);

      // Reload admins list
      await loadAdmins();
    } catch (err) {
      console.error('Error creating admin:', err);
      if (err.code === 'auth/email-already-in-use') {
        // User exists in Auth but maybe not in admins collection
        // Try to link the existing user
        try {
          const existingUser = await signInWithEmailAndPassword(
            secondaryAuth,
            newAdmin.email,
            newAdmin.password
          );

          // Check if admin document already exists
          const existingAdminDoc = await getDocs(query(
            collection(db, 'admins'),
            where('email', '==', newAdmin.email)
          ));

          if (existingAdminDoc.empty) {
            // Create the admin document for this existing user
            await setDoc(doc(db, 'admins', existingUser.user.uid), {
              email: newAdmin.email,
              name: newAdmin.name,
              role: newAdmin.role,
              municipalityId: newAdmin.municipalityId,
              active: true,
              createdAt: serverTimestamp(),
              createdBy: adminData.id
            });

            await firebaseSignOut(secondaryAuth);
            setNewAdmin({ email: '', name: '', role: ROLES.VIEWER, password: '', municipalityId: municipality });
            setShowCreateModal(false);
            await loadAdmins();
          } else {
            await firebaseSignOut(secondaryAuth);
            setError('This admin already exists in the system');
          }
        } catch (linkErr) {
          console.error('Error linking existing user:', linkErr);
          if (linkErr.code === 'auth/wrong-password' || linkErr.code === 'auth/invalid-credential') {
            setError('User exists but password is incorrect. Enter the correct password to link this account.');
          } else {
            setError('An account with this email exists but could not be linked');
          }
        }
      } else if (err.code === 'auth/weak-password') {
        setError('Password must be at least 6 characters');
      } else if (err.code === 'auth/invalid-email') {
        setError('Invalid email address');
      } else {
        setError('Failed to create admin user');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleEditAdmin = (admin) => {
    setSelectedAdmin({ ...admin });
    setShowEditModal(true);
  };

  const handleUpdateAdmin = async (e) => {
    e.preventDefault();
    if (!selectedAdmin) return;

    setSaving(true);
    setError(null);

    try {
      const updateData = {
        name: selectedAdmin.name,
        role: selectedAdmin.role,
        updatedAt: serverTimestamp(),
        updatedBy: adminData.id
      };

      // Allow super-admin to change municipality assignment
      if (selectedAdmin.municipalityId) {
        updateData.municipalityId = selectedAdmin.municipalityId;
      }

      await updateDoc(doc(db, 'admins', selectedAdmin.id), updateData);

      setShowEditModal(false);
      setSelectedAdmin(null);
      await loadAdmins();
    } catch (err) {
      console.error('Error updating admin:', err);
      setError('Failed to update admin user');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (admin) => {
    // Prevent deactivating yourself
    if (admin.id === adminData.id) {
      setError('You cannot deactivate your own account');
      return;
    }

    // Prevent deactivating other super-admins
    if (admin.role === ROLES.SUPER_ADMIN) {
      setError('Cannot deactivate super-admin accounts');
      return;
    }

    try {
      await updateDoc(doc(db, 'admins', admin.id), {
        active: !admin.active,
        updatedAt: serverTimestamp(),
        updatedBy: adminData.id
      });

      await loadAdmins();
    } catch (err) {
      console.error('Error toggling admin status:', err);
      setError('Failed to update admin status');
    }
  };

  const assignableRoles = getAssignableRoles(adminData?.role);

  // Helper to get municipality name by ID
  const getMunicipalityName = (municipalityId) => {
    const muni = municipalitiesList.find(m => m.id === municipalityId);
    return muni?.name || municipalityId || '—';
  };

  if (!isSuperAdmin()) {
    return (
      <div className="admin-management">
        <div className="access-denied">
          <h2>Access Denied</h2>
          <p>You do not have permission to view this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-management">
      <div className="page-header">
        <div>
          <h1>Admin Management</h1>
          <p className="subtitle">Manage admin users for your municipality</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => setShowCreateModal(true)}
        >
          + Add Admin
        </button>
      </div>

      {error && (
        <div className="error-banner">
          {error}
          <button onClick={() => setError(null)}>Dismiss</button>
        </div>
      )}

      {/* Role Legend */}
      <div className="role-legend">
        <h3>Role Permissions</h3>
        <div className="role-cards">
          {Object.entries(ROLE_DESCRIPTIONS).map(([role, description]) => (
            <div key={role} className="role-card">
              <span className={`role-badge role-${role}`}>
                {ROLE_DISPLAY_NAMES[role]}
              </span>
              <p>{description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Admins List */}
      <div className="admins-section">
        <h3>Current Admins ({admins.length})</h3>

        {loading ? (
          <div className="loading">Loading admins...</div>
        ) : admins.length === 0 ? (
          <div className="empty-state">
            <p>No admin users found</p>
          </div>
        ) : (
          <div className="admins-table">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Municipality</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Last Login</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {admins.map(admin => (
                  <tr key={admin.id} className={admin.active === false ? 'inactive' : ''}>
                    <td>{admin.name || '—'}</td>
                    <td>{admin.email}</td>
                    <td>{getMunicipalityName(admin.municipalityId)}</td>
                    <td>
                      <span className={`role-badge role-${admin.role}`}>
                        {ROLE_DISPLAY_NAMES[admin.role] || admin.role}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge ${admin.active !== false ? 'active' : 'inactive'}`}>
                        {admin.active !== false ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      {admin.lastLogin
                        ? new Date(admin.lastLogin.seconds * 1000).toLocaleDateString()
                        : 'Never'}
                    </td>
                    <td className="actions">
                      {admin.role !== ROLES.SUPER_ADMIN && admin.id !== adminData.id && (
                        <>
                          <button
                            className="btn btn-sm btn-secondary"
                            onClick={() => handleEditAdmin(admin)}
                          >
                            Edit
                          </button>
                          <button
                            className={`btn btn-sm ${admin.active !== false ? 'btn-danger' : 'btn-success'}`}
                            onClick={() => handleToggleActive(admin)}
                          >
                            {admin.active !== false ? 'Deactivate' : 'Activate'}
                          </button>
                        </>
                      )}
                      {admin.id === adminData.id && (
                        <span className="you-badge">You</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Admin Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add New Admin</h2>
              <button className="close-btn" onClick={() => setShowCreateModal(false)}>
                &times;
              </button>
            </div>
            <form onSubmit={handleCreateAdmin}>
              <div className="form-group">
                <label>Name</label>
                <input
                  type="text"
                  value={newAdmin.name}
                  onChange={e => setNewAdmin({ ...newAdmin, name: e.target.value })}
                  placeholder="Full name"
                  required
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={newAdmin.email}
                  onChange={e => setNewAdmin({ ...newAdmin, email: e.target.value })}
                  placeholder="admin@example.com"
                  required
                />
              </div>
              <div className="form-group">
                <label>Password</label>
                <input
                  type="password"
                  value={newAdmin.password}
                  onChange={e => setNewAdmin({ ...newAdmin, password: e.target.value })}
                  placeholder="Minimum 6 characters"
                  minLength={6}
                  required
                />
              </div>
              <div className="form-group">
                <label>Role</label>
                <select
                  value={newAdmin.role}
                  onChange={e => setNewAdmin({ ...newAdmin, role: e.target.value })}
                >
                  {assignableRoles.map(role => (
                    <option key={role} value={role}>
                      {ROLE_DISPLAY_NAMES[role]}
                    </option>
                  ))}
                </select>
                <small className="help-text">
                  {ROLE_DESCRIPTIONS[newAdmin.role]}
                </small>
              </div>
              <div className="form-group">
                <label>Municipality</label>
                <select
                  value={newAdmin.municipalityId}
                  onChange={e => setNewAdmin({ ...newAdmin, municipalityId: e.target.value })}
                  required
                >
                  <option value="">Select a municipality...</option>
                  {municipalitiesList.filter(m => m.active !== false).map(m => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
                <small className="help-text">
                  The municipality this admin will manage
                </small>
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowCreateModal(false)}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={saving}
                >
                  {saving ? 'Creating...' : 'Create Admin'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Admin Modal */}
      {showEditModal && selectedAdmin && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit Admin</h2>
              <button className="close-btn" onClick={() => setShowEditModal(false)}>
                &times;
              </button>
            </div>
            <form onSubmit={handleUpdateAdmin}>
              <div className="form-group">
                <label>Name</label>
                <input
                  type="text"
                  value={selectedAdmin.name || ''}
                  onChange={e => setSelectedAdmin({ ...selectedAdmin, name: e.target.value })}
                  placeholder="Full name"
                  required
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={selectedAdmin.email}
                  disabled
                  className="disabled"
                />
                <small className="help-text">Email cannot be changed</small>
              </div>
              <div className="form-group">
                <label>Role</label>
                <select
                  value={selectedAdmin.role}
                  onChange={e => setSelectedAdmin({ ...selectedAdmin, role: e.target.value })}
                >
                  {assignableRoles.map(role => (
                    <option key={role} value={role}>
                      {ROLE_DISPLAY_NAMES[role]}
                    </option>
                  ))}
                </select>
                <small className="help-text">
                  {ROLE_DESCRIPTIONS[selectedAdmin.role]}
                </small>
              </div>
              <div className="form-group">
                <label>Municipality</label>
                <select
                  value={selectedAdmin.municipalityId || ''}
                  onChange={e => setSelectedAdmin({ ...selectedAdmin, municipalityId: e.target.value })}
                  required
                >
                  {municipalitiesList.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.name} {m.active === false ? '(Inactive)' : ''}
                    </option>
                  ))}
                </select>
                <small className="help-text">
                  Reassign this admin to a different municipality
                </small>
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowEditModal(false)}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
