import { Component } from 'react'

export class RootErrorBoundary extends Component {
  state = { error: null }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('Portfolio root error:', error, info?.componentStack)
  }

  render() {
    if (this.state.error) {
      return (
        <div
          style={{
            minHeight: '100dvh',
            background: '#0a0a0a',
            color: '#f4f4f5',
            padding: '2rem',
            fontFamily: 'system-ui, sans-serif',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '1rem',
            textAlign: 'center',
          }}
        >
          <p style={{ margin: 0, maxWidth: '28rem' }}>
            Something went wrong loading the page. You can try reloading.
          </p>
          <button
            type="button"
            style={{
              padding: '0.5rem 1rem',
              borderRadius: 8,
              border: '1px solid rgba(255,255,255,0.2)',
              background: '#1a1a1a',
              color: '#fff',
              cursor: 'pointer',
            }}
            onClick={() => window.location.reload()}
          >
            Reload
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
