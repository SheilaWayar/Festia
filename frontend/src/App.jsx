import { Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import RutaProtegida from "./components/RutaProtegida";
import RutaAdmin from "./components/RutaAdmin";
import Salones from "./pages/Salones";
import SalonDetalle from "./pages/SalonDetalle";
import Reservar from "./pages/Reservar";
import MisTurnos from "./pages/MisTurnos";
import Login from "./pages/Login";
import PanelAdmin from "./pages/admin/PanelAdmin";
import SalonesAdmin from "./pages/admin/SalonesAdmin";
import SalonForm from "./pages/admin/SalonForm";
import TurnosAdmin from "./pages/admin/TurnosAdmin";

export default function App() {
  return (
    <>
      <Navbar />
      <main>
        <Routes>
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

          <Route path="/admin" element={<RutaAdmin><PanelAdmin /></RutaAdmin>} />
          <Route path="/admin/salones" element={<RutaAdmin><SalonesAdmin /></RutaAdmin>} />
          <Route path="/admin/salones/nuevo" element={<RutaAdmin><SalonForm /></RutaAdmin>} />
          <Route path="/admin/salones/:id" element={<RutaAdmin><SalonForm /></RutaAdmin>} />
          <Route path="/admin/turnos" element={<RutaAdmin><TurnosAdmin /></RutaAdmin>} />

          <Route path="*" element={<p className="empty-state">Página no encontrada</p>} />
        </Routes>
      </main>
      <Footer />
    </>
  );
}
