import { Navigate, Outlet, useLocation } from "react-router";
import { getAuthToken } from "../utils/api";

// Route-level authentication gate. Önceden her sayfa kendi useEffect'inde
// `if (!token) navigate("/login")` yapıyordu — bu hem tutarsızdı (bazı
// sayfalar token'ı silmiyordu bile) hem de sayfa bir an render olduktan
// sonra yönlendiriyordu. Bu guard, korumalı route'ların component'i hiç
// mount olmadan önce anonim kullanıcıyı /login'e yönlendirir.
//
// Bu yalnızca bir UX katmanıdır — gerçek yetkilendirme backend'de
// (DRF TokenAuthentication + permission sınıfları) uygulanır ve değişmedi.
export default function RequireAuth() {
  const location = useLocation();

  if (!getAuthToken()) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}
