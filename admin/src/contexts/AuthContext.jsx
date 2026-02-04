// Manages authentication state and municipality assignment for admin users
import { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail
} from 'firebase/auth';
import { doc, getDoc, updateDoc, serverTimestamp, collection, getDocs, query, orderBy } from 'firebase/firestore';
import { auth, db } from '../firebase/config';

const AuthContext = createContext(null);

// Auto-signout after 15 minutes of inactivity
const INACTIVITY_TIMEOUT = 15 * 60 * 1000; // 15 minutes in milliseconds

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [adminData, setAdminData] = useState(null);
  // assignedMunicipality is the admin's actual assigned municipality from Firestore (immutable for non-super-admins)
  const [assignedMunicipality, setAssignedMunicipality] = useState(null);
  // activeMunicipality is what super-admins can switch to (always equals assignedMunicipality for non-super-admins)
  const [activeMunicipality, setActiveMunicipality] = useState(null);
  const [municipalityConfig, setMunicipalityConfig] = useState(null);
  const [municipalitiesList, setMunicipalitiesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Inactivity timeout ref and last activity timestamp
  const inactivityTimeoutRef = useRef(null);
  const lastActivityRef = useRef(Date.now());

  // Reset the inactivity timer
  const resetInactivityTimer = useCallback(() => {
    // Update last activity timestamp
    lastActivityRef.current = Date.now();

    // Clear existing timeout
    if (inactivityTimeoutRef.current) {
      clearTimeout(inactivityTimeoutRef.current);
    }

    // Only set timeout if user is logged in
    if (user) {
      inactivityTimeoutRef.current = setTimeout(async () => {
        console.log('Session expired due to inactivity');
        await firebaseSignOut(auth);
      }, INACTIVITY_TIMEOUT);
    }
  }, [user]);

  // Check session on visibility change (handles mobile tab switching)
  useEffect(() => {
    if (!user) return;

    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible') {
        // Tab became visible - check if session should have expired
        const timeSinceLastActivity = Date.now() - lastActivityRef.current;

        if (timeSinceLastActivity >= INACTIVITY_TIMEOUT) {
          console.log('Session expired while tab was hidden');
          await firebaseSignOut(auth);
        } else {
          // Reset timer with remaining time
          const remainingTime = INACTIVITY_TIMEOUT - timeSinceLastActivity;

          if (inactivityTimeoutRef.current) {
            clearTimeout(inactivityTimeoutRef.current);
          }

          inactivityTimeoutRef.current = setTimeout(async () => {
            console.log('Session expired due to inactivity');
            await firebaseSignOut(auth);
          }, remainingTime);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user]);

  // Set up activity listeners when user is logged in
  useEffect(() => {
    if (!user) {
      // Clear timeout when logged out
      if (inactivityTimeoutRef.current) {
        clearTimeout(inactivityTimeoutRef.current);
        inactivityTimeoutRef.current = null;
      }
      return;
    }

    // Activity events to track
    const activityEvents = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'];

    // Throttle the reset to avoid too many calls
    let lastActivity = Date.now();
    const throttledReset = () => {
      const now = Date.now();
      // Only reset if at least 1 second has passed since last reset
      if (now - lastActivity > 1000) {
        lastActivity = now;
        resetInactivityTimer();
      }
    };

    // Add event listeners
    activityEvents.forEach(event => {
      document.addEventListener(event, throttledReset, { passive: true });
    });

    // Start the initial timer
    resetInactivityTimer();

    // Cleanup
    return () => {
      activityEvents.forEach(event => {
        document.removeEventListener(event, throttledReset);
      });
      if (inactivityTimeoutRef.current) {
        clearTimeout(inactivityTimeoutRef.current);
      }
    };
  }, [user, resetInactivityTimer]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setError(null);

      if (firebaseUser) {
        try {
          // Get admin record to find their municipality
          const adminDoc = await getDoc(doc(db, 'admins', firebaseUser.uid));

          if (adminDoc.exists()) {
            const adminInfo = adminDoc.data();

            // Check if admin is active
            if (adminInfo.active === false) {
              setUser(null);
              setAdminData(null);
              setAssignedMunicipality(null);
              setActiveMunicipality(null);
              setMunicipalityConfig(null);
              setError('Your account has been deactivated.');
              await firebaseSignOut(auth);
              setLoading(false);
              return;
            }

            setUser(firebaseUser);
            setAdminData({ id: firebaseUser.uid, ...adminInfo });
            setAssignedMunicipality(adminInfo.municipalityId);
            setActiveMunicipality(adminInfo.municipalityId);

            // Update last login
            await updateDoc(doc(db, 'admins', firebaseUser.uid), {
              lastLogin: serverTimestamp()
            });

            // Fetch municipality config for branding
            if (adminInfo.municipalityId) {
              const configDoc = await getDoc(
                doc(db, 'municipalities', adminInfo.municipalityId)
              );
              if (configDoc.exists()) {
                setMunicipalityConfig({ id: configDoc.id, ...configDoc.data() });
              }
            }
          } else {
            // User exists in Auth but not in admins collection
            console.warn('User not found in admins collection');
            setUser(null);
            setAdminData(null);
            setAssignedMunicipality(null);
            setActiveMunicipality(null);
            setMunicipalityConfig(null);
            setError('You are not authorized to access the admin console.');
            await firebaseSignOut(auth);
          }
        } catch (err) {
          console.error('Error fetching admin data:', err);
          setError('Error loading admin data. Please try again.');
          setUser(null);
          setAdminData(null);
          setAssignedMunicipality(null);
          setActiveMunicipality(null);
          setMunicipalityConfig(null);
        }
      } else {
        setUser(null);
        setAdminData(null);
        setAssignedMunicipality(null);
        setActiveMunicipality(null);
        setMunicipalityConfig(null);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async (email, password) => {
    setError(null);
    setLoading(true);

    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      return result;
    } catch (err) {
      console.error('Sign in error:', err);

      switch (err.code) {
        case 'auth/invalid-email':
          setError('Invalid email address.');
          break;
        case 'auth/user-disabled':
          setError('This account has been disabled.');
          break;
        case 'auth/user-not-found':
        case 'auth/wrong-password':
        case 'auth/invalid-credential':
          setError('Invalid email or password.');
          break;
        case 'auth/too-many-requests':
          setError('Too many failed attempts. Please try again later.');
          break;
        default:
          setError('Failed to sign in. Please try again.');
      }

      setLoading(false);
      throw err;
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (err) {
      console.error('Sign out error:', err);
      setError('Failed to sign out.');
    }
  };

  const resetPassword = async (email) => {
    setError(null);

    try {
      await sendPasswordResetEmail(auth, email);
      return true;
    } catch (err) {
      console.error('Password reset error:', err);

      switch (err.code) {
        case 'auth/invalid-email':
          setError('Invalid email address.');
          break;
        case 'auth/user-not-found':
          setError('No account found with this email.');
          break;
        default:
          setError('Failed to send password reset email.');
      }

      throw err;
    }
  };

  const clearError = () => setError(null);

  // Check if user has specific role or higher
  const hasRole = (role) => {
    if (!adminData) return false;
    if (adminData.role === 'super-admin') return true;

    const roleHierarchy = ['viewer', 'editor', 'admin', 'super-admin'];
    const userRoleIndex = roleHierarchy.indexOf(adminData.role);
    const requiredRoleIndex = roleHierarchy.indexOf(role);

    return userRoleIndex >= requiredRoleIndex;
  };

  const isSuperAdmin = () => adminData?.role === 'super-admin';

  // Load all municipalities (for super-admin switcher)
  const loadMunicipalities = useCallback(async () => {
    if (adminData?.role !== 'super-admin') return [];

    try {
      const municipalitiesCol = collection(db, 'municipalities');
      const q = query(municipalitiesCol, orderBy('name'));
      const snapshot = await getDocs(q);

      const list = snapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name,
        nameEn: doc.data().nameEn,
        nameFr: doc.data().nameFr,
        active: doc.data().active,
        colors: doc.data().colors
      }));

      setMunicipalitiesList(list);
      return list;
    } catch (err) {
      console.error('Error loading municipalities:', err);
      return [];
    }
  }, [adminData?.role]);

  // Switch municipality (super-admin only) - secured against console manipulation
  const switchMunicipality = useCallback(async (municipalityId) => {
    // SECURITY: Double-check role from adminData which comes from Firestore
    if (adminData?.role !== 'super-admin') {
      console.warn('Security: Only super-admins can switch municipalities');
      return false;
    }

    try {
      // Fetch new municipality config BEFORE updating state
      const configDoc = await getDoc(doc(db, 'municipalities', municipalityId));
      const newConfig = configDoc.exists()
        ? { id: configDoc.id, ...configDoc.data() }
        : null;

      // Update both states together after successful fetch
      setActiveMunicipality(municipalityId);
      setMunicipalityConfig(newConfig);
      return true;
    } catch (err) {
      console.error('Error switching municipality:', err);
      setError('Failed to switch municipality');
      return false;
    }
  }, [adminData?.role]);

  // SECURITY: Compute the effective municipality based on role
  // Non-super-admins ALWAYS use their assigned municipality from Firestore
  // This prevents manipulation via browser console
  const municipality = adminData?.role === 'super-admin'
    ? activeMunicipality
    : assignedMunicipality;

  const value = {
    user,
    adminData,
    municipality, // This is now a computed value, secure against manipulation
    assignedMunicipality, // The admin's actual assigned municipality (read-only)
    municipalityConfig,
    municipalitiesList,
    loading,
    error,
    signIn,
    signOut,
    resetPassword,
    clearError,
    hasRole,
    isSuperAdmin,
    loadMunicipalities,
    switchMunicipality
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
