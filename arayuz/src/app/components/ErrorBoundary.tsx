import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

// Tek, uygulama-seviyesi error boundary. Önceden hiç yoktu: bir render
// exception'ı (örn. beklenmeyen API şekli) tüm ekranı boş bırakıyordu.
// Internal stack trace kullanıcıya gösterilmez, yalnızca console'a loglanır
// (token/kullanıcı verisi loglanmaz — bkz. AŞAMA 5 madde 58).
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Beklenmeyen render hatası:", error, info.componentStack);
  }

  handleReload = () => {
    this.setState({ hasError: false });
    window.location.href = "/dashboard";
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <div className="max-w-sm w-full text-center space-y-4">
            <h1 className="text-xl font-bold text-foreground">Beklenmeyen bir hata oluştu</h1>
            <p className="text-sm text-muted-foreground">
              Sayfayı yenileyin veya panele dönmeyi deneyin. Sorun devam ederse lütfen daha sonra tekrar deneyin.
            </p>
            <button
              onClick={this.handleReload}
              className="inline-flex items-center justify-center rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold hover:bg-primary/90 transition-colors"
            >
              Panele Dön
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
