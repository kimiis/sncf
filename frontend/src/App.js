import './App.css';
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";

import Home from "./pages/Home.jsx";

import PrivateRoute from "./components/PrivateRoute";
import './index.css';
import UnauthorizedPage from "./pages/UnauthorizedPage";

function AppWrapper() {
  return (
      <Router>
        <App />
      </Router>
  );
}

function App() {
  const location = useLocation();
  const isAuthPage = location.pathname === "/" || location.pathname === "/login";

  return (
      <>
        {!isAuthPage}
        <Routes>
          {/* Pages publiques */}
          <Route path="/" element={<Home />} />
          {/*<Route path="/login" element={<Login />} />*/}

          {/*/!* Pages accessibles à tout utilisateur connecté *!/*/}
          {/*<Route element={<PrivateRoute />}>*/}
          {/*  <Route path="/index" element={<Index />} />*/}
          {/*  <Route path="/profil" element={<ProfilPage />} />*/}
          {/*</Route>*/}

          {/*/!* Pages accessibles à employee et admin *!/*/}
          {/*<Route element={<PrivateRoute roles={["employee", "admin"]} />}>*/}
          {/*  <Route path="/planning" element={<Planning />} />*/}
          {/*  <Route path="/reservations" element={<Reservations />} />*/}
          {/*</Route>*/}

          {/*/!* Pages accessibles à employee, admin et manager *!/*/}
          {/*<Route element={<PrivateRoute roles={["employee", "admin", "manager"]} />}>*/}
          {/*  <Route path="/users/:id" element={<InfosClient />} />*/}
          {/*</Route>*/}

          {/*/!* Pages accessibles à admin et manager *!/*/}
          {/*<Route element={<PrivateRoute roles={["admin", "manager"]} />}>*/}
          {/*  <Route path="/admin" element={<AdminDashboard />} />*/}
          {/*  <Route path="/plannings" element={<Plannings />} />*/}
          {/*  <Route path="/appointmentAsked" element={<AppointmentAsked />} />*/}
          {/*  <Route path="/clients" element={<Clients />} />*/}
          {/*  <Route path="/employees" element={<Employees />} />*/}
          {/*  <Route path="/invoices" element={<Invoices />} />*/}
          {/*  <Route path="/employes/:id" element={<EmployeeDetails />} />*/}
          {/*</Route>*/}

          {/* Page d'accès refusé */}
          <Route path="/unauthorized" element={<UnauthorizedPage />} />
        </Routes>
      </>
  );
}

export default AppWrapper;
