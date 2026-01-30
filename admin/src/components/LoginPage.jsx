// Login page for CivicKey Admin Console
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showResetForm, setShowResetForm] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const { signIn, resetPassword, error, clearError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    clearError();

    try {
      await signIn(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      // Error is handled in AuthContext
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    clearError();

    try {
      await resetPassword(email);
      setResetSent(true);
    } catch (err) {
      // Error is handled in AuthContext
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        {/* Logo/Header */}
        <div style={styles.header}>
          <h1 style={styles.logo}>CivicKey</h1>
          <p style={styles.subtitle}>Console d'administration</p>
        </div>

        {/* Error Message */}
        {error && (
          <div style={styles.error}>
            {error}
          </div>
        )}

        {/* Reset Password Success */}
        {resetSent && (
          <div style={styles.success}>
            Password reset email sent! Check your inbox.
          </div>
        )}

        {/* Login Form */}
        {!showResetForm ? (
          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.inputGroup}>
              <label style={styles.label} htmlFor="email">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={styles.input}
                placeholder="admin@municipality.ca"
                required
                disabled={isLoading}
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label} htmlFor="password">
                Password / Mot de passe
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={styles.input}
                placeholder="********"
                required
                disabled={isLoading}
              />
            </div>

            <button
              type="submit"
              style={{
                ...styles.button,
                ...(isLoading ? styles.buttonDisabled : {})
              }}
              disabled={isLoading}
            >
              {isLoading ? 'Signing in...' : 'Sign In / Connexion'}
            </button>

            <button
              type="button"
              onClick={() => {
                setShowResetForm(true);
                clearError();
                setResetSent(false);
              }}
              style={styles.linkButton}
            >
              Forgot password? / Mot de passe oublie?
            </button>
          </form>
        ) : (
          /* Reset Password Form */
          <form onSubmit={handleResetPassword} style={styles.form}>
            <p style={styles.resetText}>
              Enter your email address and we'll send you a link to reset your password.
            </p>

            <div style={styles.inputGroup}>
              <label style={styles.label} htmlFor="reset-email">
                Email
              </label>
              <input
                id="reset-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={styles.input}
                placeholder="admin@municipality.ca"
                required
                disabled={isLoading}
              />
            </div>

            <button
              type="submit"
              style={{
                ...styles.button,
                ...(isLoading ? styles.buttonDisabled : {})
              }}
              disabled={isLoading}
            >
              {isLoading ? 'Sending...' : 'Send Reset Link'}
            </button>

            <button
              type="button"
              onClick={() => {
                setShowResetForm(false);
                clearError();
                setResetSent(false);
              }}
              style={styles.linkButton}
            >
              Back to login
            </button>
          </form>
        )}

        {/* Footer */}
        <div style={styles.footer}>
          <p style={styles.footerText}>
            CivicKey Admin Console
          </p>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F0E8',
    padding: '20px',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: '16px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
    padding: '40px',
    width: '100%',
    maxWidth: '400px',
  },
  header: {
    textAlign: 'center',
    marginBottom: '32px',
  },
  logo: {
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#0D5C63',
    margin: 0,
  },
  subtitle: {
    fontSize: '14px',
    color: '#5A6C7D',
    marginTop: '8px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#1A1A2E',
  },
  input: {
    padding: '12px 16px',
    fontSize: '16px',
    border: '2px solid #E8E4DC',
    borderRadius: '8px',
    outline: 'none',
    transition: 'border-color 0.2s',
  },
  button: {
    padding: '14px',
    fontSize: '16px',
    fontWeight: '600',
    color: 'white',
    backgroundColor: '#0D5C63',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  buttonDisabled: {
    backgroundColor: '#B0C4C8',
    cursor: 'not-allowed',
  },
  linkButton: {
    background: 'none',
    border: 'none',
    color: '#0D5C63',
    fontSize: '14px',
    cursor: 'pointer',
    textDecoration: 'underline',
    padding: '8px',
  },
  error: {
    backgroundColor: '#FEE2E2',
    color: '#DC2626',
    padding: '12px 16px',
    borderRadius: '8px',
    fontSize: '14px',
    marginBottom: '16px',
  },
  success: {
    backgroundColor: '#D1FAE5',
    color: '#059669',
    padding: '12px 16px',
    borderRadius: '8px',
    fontSize: '14px',
    marginBottom: '16px',
  },
  resetText: {
    fontSize: '14px',
    color: '#5A6C7D',
    lineHeight: '1.5',
  },
  footer: {
    marginTop: '32px',
    paddingTop: '20px',
    borderTop: '1px solid #E8E4DC',
    textAlign: 'center',
  },
  footerText: {
    fontSize: '12px',
    color: '#5A6C7D',
    margin: '4px 0',
  },
};

export default LoginPage;
