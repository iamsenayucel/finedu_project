import { createBrowserRouter } from "react-router";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import UnitDetail from "./pages/UnitDetail";
import AdminPanel from "./pages/AdminPanel";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Login,
  },
  {
    path: "/login",
    Component: Login,
  },
  {
    path: "/register",
    Component: Register,
  },
  {
    path: "/dashboard",
    Component: Dashboard,
  },
  {
    path: "/unit/:unitId",
    Component: UnitDetail,
  },
  {
    path: "/admin",
    Component: AdminPanel,
  },
]);