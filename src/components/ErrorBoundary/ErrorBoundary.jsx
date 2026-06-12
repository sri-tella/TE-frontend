import { Component } from 'react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(rgba(21,71,52,0.85), rgba(21,71,52,0.7))',
          color: 'white',
          textAlign: 'center',
          padding: '40px 20px',
          fontFamily: 'Inter, sans-serif',
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '16px' }}>⚠</div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '12px' }}>
            Something went wrong
          </h2>
          <p style={{ opacity: 0.75, marginBottom: '32px', maxWidth: '400px', lineHeight: 1.6 }}>
            {this.state.error?.message || 'An unexpected error occurred. Try reloading the page.'}
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '14px 40px',
              borderRadius: '50px',
              background: '#2dd4bf',
              color: '#1a2535',
              border: 'none',
              fontWeight: 800,
              fontSize: '1rem',
              cursor: 'pointer',
              letterSpacing: '1px',
            }}
          >
            Reload Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
