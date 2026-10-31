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
import Login from "./pages/Login";
import PanelAdmin from "./pages/admin/PanelAdmin";
import SalonesAdmin from "./pages/admin/SalonesAdmin";
import SalonForm from "./pages/admin/SalonForm";
import HistorialSalon from "./pages/admin/HistorialSalon";
import TurnosAdmin from "./pages/admin/TurnosAdmin";
import PanelEstadisticas from "./pages/admin/PanelEstadisticas";
import HistorialReservas from "./pages/admin/HistorialReservas";
import ClientesAdmin from "./pages/admin/ClientesAdmin";
import MiSalon from "./pages/admin/MiSalon";
import SolicitudesAdmin from "./pages/admin/SolicitudesAdmin";

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
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<p className="empty-state">Página no encontrada</p>} />
      </Route>

     <Route path="/admin" element={<RutaAdmin><AdminLayout /></RutaAdmin>}>
  <Route index element={<PanelAdmin />} />
  <Route path="salones" element={<SalonesAdmin />} />
  <Route path="salones/nuevo" element={<SalonForm />} />
  <Route path="salones/:id" element={<SalonForm />} />
  <Route path="salones/:id/historial" element={<HistorialSalon />} />
  <Route path="turnos" element={<TurnosAdmin />} />
  <Route path="estadisticas" element={<PanelEstadisticas />} />
  <Route path="historial-reservas" element={<HistorialReservas />} />
  <Route path="clientes" element={<ClientesAdmin />} />
  <Route path="mi-salon" element={<MiSalon />} />
  <Route path="solicitudes" element={<SolicitudesAdmin />} />
  <Route path="*" element={<Navigate to="/admin" replace />} />

        
      </Route>
    </Routes>
  );
}