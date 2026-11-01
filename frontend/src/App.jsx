import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import RutaProtegida from "./components/RutaProtegida";
import RutaAdmin from "./components/RutaAdmin";
import AdminLayout from "./components/AdminLayout";
import Salones from "./pages/Salones";
import SalonDetalle from "./pages/SalonDetalle";
import Reservar from "./pages/Reservar";
import MisTurnos from "./pages/MisTurnos";
import MiPerfil from "./pages/MiPerfil";
import Login from "./pages/Login";
import QuieroSerSalon from "./pages/QuieroSerSalon";
import PanelAdmin from "./pages/admin/PanelAdmin";
import SalonesAdmin from "./pages/admin/SalonesAdmin";
import SalonForm from "./pages/admin/SalonForm";
import HistorialSalon from "./pages/admin/HistorialSalon";
import TurnosAdmin from "./pages/admin/TurnosAdmin";

// Pantallas nuevas (carpeta src/admin/)
import RequireRole from "./admin/RequireRole";
import Historial from "./admin/Historial";
import Clientes from "./admin/Clientes";
import MiSalon from "./admin/MiSalon";
import Panel from "./admin/Panel";
import Solicitudes from "./admin/Solicitudes";

function LayoutPublico() {
  return (
    <>
      <Navbar />
      <main>
        <Outlet />
      </main>
      <Footer />
    </>
  );
}

export default function App() {
  return (
    <Routes>
      <Route element={<LayoutPublico />}>
        <Route path="/" element={<Navigate to="/salones" replace />} />
        <Route path="/salones" element={<Salones />} />
        <Route path="/salones/:id" element={<SalonDetalle />} />
        <Route
          path="/salones/:id/reservar"
          element={<RutaProtegida><Reservar /></RutaProtegida>}
        />
        <Route
          path="/mis-turnos"
          element={<RutaProtegida><MisTurnos /></RutaProtegida>}
        />
        <Route
          path="/mi-perfil"
          element={<RutaProtegida><MiPerfil /></RutaProtegida>}
        />
        <Route path="/quiero-ser-salon" element={<QuieroSerSalon />} />
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<p className="empty-state">Página no encontrada</p>} />
      </Route>

      <Route path="/admin" element={<RutaAdmin><AdminLayout /></RutaAdmin>}>
        {/* Resumen: estadísticas arriba y accesos rápidos abajo */}
        <Route
          index
          element={
            <>
              <RequireRole><Panel /></RequireRole>
              <PanelAdmin />
            </>
          }
        />
        <Route path="salones" element={<SalonesAdmin />} />
        <Route path="salones/nuevo" element={<SalonForm />} />
        <Route path="salones/:id" element={<SalonForm />} />
        <Route path="salones/:id/historial" element={<HistorialSalon />} />
        <Route path="turnos" element={<TurnosAdmin />} />
        <Route path="pagos" element={<TurnosAdmin />} />

        <Route path="panel" element={<Navigate to="/admin" replace />} />
        <Route path="historial" element={<RequireRole><Historial /></RequireRole>} />
        <Route path="clientes" element={<RequireRole><Clientes /></RequireRole>} />
        <Route path="mi-salon" element={<RequireRole><MiSalon /></RequireRole>} />
        <Route
          path="solicitudes"
          element={<RequireRole soloSuperadmin><Solicitudes /></RequireRole>}
        />

        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Route>
    </Routes>
  );
}