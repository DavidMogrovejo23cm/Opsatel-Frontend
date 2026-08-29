import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import General from './pages/General';
import Ventas from './pages/Ventas';
import Tecnica from './pages/Tecnica';
import Admin from './pages/Admin';
import Administrar from './pages/Administrar';
import Configuraciones from './pages/Configuraciones';
import ExtrasGeneral from './pages/ExtrasGeneral';
import ExtraPagos from './pages/ExtraPagos';
import HojaRuta from './pages/HojaRuta';
import Tickets from './pages/Tickets';
import ONT from './pages/ONT';
import Activacion from './pages/Activacion';
import SubirBD from './pages/SubirBD';
import CallCenter from './pages/CallCenter';
import Balance from './pages/Balance';
import Asistencia from './pages/Asistencia';
import WhatsApp from './pages/WhatsApp';
import Eliminados from './pages/Eliminados';

function HomeRedirect() {
  const { user } = useAuth();
  if (user?.rol === 'tecnico') {
    return <Navigate to="/hoja-ruta" replace />;
  }
  return <Dashboard />;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          
          <Route path="/" element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            <Route index element={<HomeRedirect />} />
            <Route path="general" element={<General />} />
            
            {/* Rutas de Ventas/Secretaría */}
            <Route path="ventas" element={
              <ProtectedRoute roles={['administrador', 'secretario', 'tecnico']}>
                <Ventas />
              </ProtectedRoute>
            } />
            
            {/* Rutas Técnicas */}
            <Route path="tecnica" element={
              <ProtectedRoute roles={['administrador', 'tecnico', 'instalador']}>
                <Tecnica />
              </ProtectedRoute>
            } />
            <Route path="ont" element={
              <ProtectedRoute roles={['administrador', 'tecnico', 'instalador']}>
                <ONT />
              </ProtectedRoute>
            } />
            <Route path="activacion" element={
              <ProtectedRoute roles={['administrador', 'tecnico', 'instalador']}>
                <Activacion />
              </ProtectedRoute>
            } />

            
            {/* Rutas de Administración/Cobros */}
            <Route path="admin" element={
              <ProtectedRoute roles={['administrador', 'secretario']}>
                <Admin />
              </ProtectedRoute>
            } />
            
            <Route path="administrar" element={
              <ProtectedRoute roles={['administrador', 'secretario', 'tecnico']}>
                <Administrar />
              </ProtectedRoute>
            } />
            
            
            
            <Route path="config" element={
              <ProtectedRoute roles={['administrador']}>
                <Configuraciones />
              </ProtectedRoute>
            } />

            <Route path="whatsapp" element={
              <ProtectedRoute roles={['administrador']}>
                <WhatsApp />
              </ProtectedRoute>
            } />

            <Route path="extras-general" element={
              <ProtectedRoute roles={['administrador', 'secretario']}>
                <ExtrasGeneral />
              </ProtectedRoute>
            } />
            <Route path="extras-pagos" element={
              <ProtectedRoute roles={['administrador', 'secretario']}>
                <ExtraPagos />
              </ProtectedRoute>
            } />
            <Route path="upload-db" element={
              <ProtectedRoute roles={['administrador', 'secretario']}>
                <SubirBD />
              </ProtectedRoute>
            } />

            <Route path="hoja-ruta" element={
              <ProtectedRoute roles={['administrador', 'tecnico']}>
                <HojaRuta />
              </ProtectedRoute>
            } />
            <Route path="tickets" element={
              <ProtectedRoute roles={['administrador']}>
                <Tickets />
              </ProtectedRoute>
            } />
            <Route path="call-center" element={
              <ProtectedRoute roles={['administrador', 'secretario', 'tecnico']}>
                <CallCenter />
              </ProtectedRoute>
            } />
            <Route path="balance" element={
              <ProtectedRoute roles={['administrador', 'secretario']}>
                <Balance />
              </ProtectedRoute>
            } />
            <Route path="asistencia" element={
              <ProtectedRoute>
                <Asistencia />
              </ProtectedRoute>
            } />
            <Route path="eliminados" element={
              <ProtectedRoute roles={['administrador']}>
                <Eliminados />
              </ProtectedRoute>
            } />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
