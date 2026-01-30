// Route guard that redirects unauthenticated users to login
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export function ProtectedRoute({ children, requiredRole = null }) {
  const { user, adminData, loading } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking auth
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: '#F5F0E8'
      }}>
        <div style={{
          textAlign: 'center',
          color: '#0D5C63'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid #E8E4DC',
            borderTopColor: '#0D5C63',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }} />
          <p>Loading...</p>
          <style>{`
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      </div>
    );
  }

  // Not logged in - redirect to login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role if required
  if (requiredRole && adminData?.role !== requiredRole && adminData?.role !== 'super-admin') {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: '#F5F0E8'
      }}>
        <div style={{
          textAlign: 'center',
          padding: '40px',
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ color: '#E07A5F', marginBottom: '16px' }}>Access Denied</h2>
          <p style={{ color: '#5A6C7D' }}>
            You don't have permission to access this page.
          </p>
          <p style={{ color: '#5A6C7D', fontSize: '14px', marginTop: '8px' }}>
            Required role: {requiredRole}
          </p>
        </div>
      </div>
    );
  }

  return children;
}

export default ProtectedRoute;
