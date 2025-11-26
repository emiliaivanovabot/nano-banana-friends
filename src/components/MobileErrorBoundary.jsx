import React from 'react';

class MobileErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error for debugging mobile-specific issues
    console.error('MobileErrorBoundary caught an error:', error, errorInfo);
    
    // Store error details for display
    this.setState({
      error: error,
      errorInfo: errorInfo
    });

    // Report to crash analytics if available
    if (window.gtag) {
      window.gtag('event', 'exception', {
        description: `Mobile Error: ${error.toString()}`,
        fatal: false
      });
    }
  }

  render() {
    if (this.state.hasError) {
      // Mobile-optimized error UI
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          textAlign: 'center',
          background: 'hsl(var(--background))',
          color: 'hsl(var(--foreground))'
        }}>
          <div style={{
            background: 'hsl(var(--card))',
            borderRadius: '20px',
            padding: '30px',
            maxWidth: '400px',
            width: '100%',
            border: '1px solid hsl(var(--destructive) / 0.2)',
            boxShadow: '0 10px 30px hsl(var(--background) / 0.3)'
          }}>
            <div style={{
              fontSize: '48px',
              marginBottom: '16px'
            }}>
              📱💥
            </div>
            <h2 style={{
              margin: '0 0 16px 0',
              fontSize: '24px',
              fontWeight: '600',
              color: 'hsl(var(--destructive))'
            }}>
              Oops! Etwas ist schiefgelaufen
            </h2>
            <p style={{
              margin: '0 0 20px 0',
              fontSize: '14px',
              color: 'hsl(var(--muted-foreground))',
              lineHeight: '1.5'
            }}>
              Es gab ein Problem beim Laden der Seite. Dies kann bei der Navigation auf mobilen Geräten auftreten.
            </p>
            
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              <button
                onClick={() => {
                  this.setState({ hasError: false, error: null, errorInfo: null });
                }}
                style={{
                  padding: '12px 24px',
                  background: 'hsl(var(--primary))',
                  color: 'hsl(var(--primary-foreground))',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                Nochmal versuchen
              </button>
              
              <button
                onClick={() => {
                  window.location.href = '/dashboard';
                }}
                style={{
                  padding: '12px 24px',
                  background: 'hsl(var(--secondary))',
                  color: 'hsl(var(--secondary-foreground))',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                Zum Dashboard
              </button>
            </div>
            
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details style={{
                marginTop: '20px',
                padding: '12px',
                background: 'hsl(var(--muted) / 0.3)',
                borderRadius: '8px',
                fontSize: '12px',
                textAlign: 'left'
              }}>
                <summary style={{ cursor: 'pointer', fontWeight: '600' }}>
                  Debug Info (Dev Mode)
                </summary>
                <pre style={{
                  margin: '8px 0 0 0',
                  whiteSpace: 'pre-wrap',
                  fontSize: '10px',
                  color: 'hsl(var(--muted-foreground))'
                }}>
                  {this.state.error && this.state.error.toString()}
                  <br />
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default MobileErrorBoundary;