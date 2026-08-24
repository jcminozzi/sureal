import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props { children: ReactNode }
interface State { hasError: boolean }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Falha inesperada no Meus Gastinhos', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="fatal-error">
          <div className="fatal-error__card">
            <span className="brand-mark" aria-hidden="true">mg</span>
            <h1>Algo saiu do lugar.</h1>
            <p>Seus dados continuam guardados neste dispositivo. Recarregue a página para tentar novamente.</p>
            <button className="button button--primary" onClick={() => window.location.reload()}>Recarregar</button>
          </div>
        </main>
      );
    }
    return this.props.children;
  }
}

