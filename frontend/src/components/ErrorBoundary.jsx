import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('💥 React Error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh', display: 'flex', alignItems: 'center',
          justifyContent: 'center', padding: 24, background: '#faf7f2'
        }}>
          <div style={{
            background: 'white', borderRadius: 16, padding: 40,
            maxWidth: 520, width: '100%', boxShadow: '0 4px 24px rgba(0,0,0,.10)',
            border: '1px solid #f0ede8', textAlign: 'center'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: 16 }}>⚠️</div>
            <h2 style={{ fontFamily: 'sans-serif', marginBottom: 12, color: '#1a1a18' }}>
              Something went wrong
            </h2>
            <p style={{ color: '#7a7a75', marginBottom: 8, fontSize: '0.9rem' }}>
              The page crashed. This is usually a data loading issue.
            </p>
            <details style={{ textAlign: 'left', marginBottom: 24 }}>
              <summary style={{ cursor: 'pointer', fontSize: '0.82rem', color: '#7a7a75', marginBottom: 8 }}>
                Error details
              </summary>
              <pre style={{
                background: '#f3f4f6', padding: 12, borderRadius: 8,
                fontSize: '0.75rem', overflowX: 'auto', color: '#d63031',
                whiteSpace: 'pre-wrap', wordBreak: 'break-word'
              }}>
                {this.state.error?.message}
                {'\n'}
                {this.state.error?.stack?.split('\n').slice(0, 5).join('\n')}
              </pre>
            </details>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button
                onClick={() => { this.setState({ hasError: false, error: null }); }}
                style={{
                  padding: '10px 20px', background: '#1a5c38', color: 'white',
                  border: 'none', borderRadius: 8, cursor: 'pointer',
                  fontWeight: 600, fontSize: '0.9rem'
                }}>
                Try Again
              </button>
              <button
                onClick={() => { sessionStorage.clear(); window.location.href = '/login'; }}
                style={{
                  padding: '10px 20px', background: '#f3f4f6', color: '#1a1a18',
                  border: '1px solid #c5c5c0', borderRadius: 8, cursor: 'pointer',
                  fontWeight: 600, fontSize: '0.9rem'
                }}>
                Sign Out & Retry
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}