import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "./Button";

interface PageErrorStateProps {
  title: string;
  message?: string;
  onRetry: () => void;
}

// AŞAMA 5 kapanış: ValuesBridge.tsx'te zaten var olan error-state pattern'i
// (loadError → AlertTriangle + "Tekrar Dene") Dashboard/Profile/AdminPanel'e
// de eklenince 4 sayfada birebir aynı görsel/davranış tekrarlandığı için
// paylaşılan bileşene çıkarıldı — yeni bir tasarım icat edilmedi.
export function PageErrorState({
  title,
  message = "Sunucuya ulaşılamadı. Lütfen bağlantını kontrol edip tekrar dene.",
  onRetry,
}: PageErrorStateProps) {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
      <AlertTriangle className="size-12 mx-auto text-destructive mb-4" />
      <h2 className="text-xl font-bold text-foreground mb-2">{title}</h2>
      <p className="text-muted-foreground mb-6">{message}</p>
      <Button variant="primary" onClick={onRetry}>
        <RefreshCw className="size-4 mr-2" /> Tekrar Dene
      </Button>
    </div>
  );
}
