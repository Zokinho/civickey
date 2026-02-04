import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={styles.container}>
          <div style={styles.card}>
            <div style={styles.icon}>⚠️</div>
            <h2 style={styles.title}>Something went wrong</h2>
            <p style={styles.message}>
              The admin console ran into an unexpected error. Please try again or
              refresh the page.
            </p>
            <button
              style={styles.button}
              onClick={this.handleReset}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = '#0a4a50';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = '#0D5C63';
              }}
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const styles = {
  container: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    backgroundColor: '#f5f0e8',
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif",
    padding: '32px',
  },
  card: {
    background: 'white',
    borderRadius: '12px',
    padding: '48px',
    textAlign: 'center',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    maxWidth: '480px',
    width: '100%',
  },
  icon: {
    fontSize: '3rem',
    marginBottom: '16px',
  },
  title: {
    fontSize: '1.5rem',
    fontWeight: '600',
    color: '#1a1a2e',
    marginBottom: '12px',
  },
  message: {
    fontSize: '1rem',
    color: '#5a6c7d',
    lineHeight: '1.5',
    marginBottom: '32px',
  },
  button: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '12px 32px',
    backgroundColor: '#0D5C63',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '0.875rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
};

export default ErrorBoundary;
