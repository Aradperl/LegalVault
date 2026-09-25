import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { Title1, Body1, Button } from '@fluentui/react-components';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 40, textAlign: 'center', minHeight: '100vh', background: '#090E17', color: '#E2E8F0' }}>
          <Title1 block style={{ color: '#F87171', marginBottom: 16 }}>Something went wrong</Title1>
          <Body1 block style={{ color: '#94A3B8', marginBottom: 20 }}>
            {this.state.error?.message || 'An unexpected error occurred'}
          </Body1>
          <Button
            appearance="primary"
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.reload();
            }}
          >
            Reload page
          </Button>
          <details style={{ marginTop: 20, textAlign: 'left' }}>
            <summary style={{ cursor: 'pointer', color: '#14B8A6' }}>Error details</summary>
            <pre style={{ background: '#1E293B', padding: 10, borderRadius: 4, overflow: 'auto', fontFamily: '"JetBrains Mono", monospace' }}>
              {this.state.error?.stack}
            </pre>
          </details>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
