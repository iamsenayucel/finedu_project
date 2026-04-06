import { createRoot } from "react-dom/client";
import App from "./app/App.tsx";
import "./styles/index.css";
import { ThemeProvider } from "next-themes";
import { Toaster } from "./app/components/ui/sonner";

createRoot(document.getElementById("root")!).render(
  <ThemeProvider attribute="class" defaultTheme="light" disableTransitionOnChange>
    <App />
    <Toaster position="top-center" richColors closeButton />
  </ThemeProvider>
);
