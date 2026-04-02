import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', textAlign: 'center', background: '#fff', minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
          <h1 style={{ fontSize: '24px', fontWeight: '900', color: '#333' }}>ОЙ! ЧТО-ТО СЛОМАЛОСЬ 🦖</h1>
          <p style={{ color: '#666', margin: '20px 0' }}>Нажми кнопку ниже, чтобы сбросить всё и попробовать снова.</p>
          <button 
            onClick={() => {
                localStorage.clear();
                window.location.reload();
            }}
            style={{ padding: '15px 30px', borderRadius: '20px', border: 'none', background: '#f50', color: '#fff', fontWeight: 'bold' }}
          >
            СБРОСИТЬ И ОБНОВИТЬ
          </button>
          <pre style={{ marginTop: '40px', fontSize: '10px', color: '#999', textAlign: 'left', background: '#f5f5f5', padding: '10px' }}>
            {this.state.error?.message}
          </pre>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
