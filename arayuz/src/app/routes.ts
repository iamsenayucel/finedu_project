import { createBrowserRouter } from "react-router";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import UnitDetail from "./pages/UnitDetail";
import AdminPanel from "./pages/AdminPanel";
import Profile from "./pages/Profile";
import PreSurvey from "./pages/PreSurvey";
import PostSurvey from "./pages/PostSurvey";
import ValuesBridge from "./pages/ValuesBridge";

export const router = createBrowserRouter([
  { path: "/", Component: Login },
  { path: "/login", Component: Login },
  { path: "/register", Component: Register },
  { path: "/pre-survey", Component: PreSurvey },
  { path: "/post-survey", Component: PostSurvey },
  { path: "/dashboard", Component: Dashboard },
  { path: "/unit/:unitId", Component: UnitDetail },
  { path: "/admin", Component: AdminPanel },
  { path: "/profile", Component: Profile },
  { path: "/values-bridge", Component: ValuesBridge },
]);
