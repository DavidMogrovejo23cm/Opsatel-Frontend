import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import General from './pages/General';
import Ventas from './pages/Ventas';
import Tecnica from './pages/Tecnica';
import Admin from './pages/Admin';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="general" element={<General />} />
          <Route path="ventas" element={<Ventas />} />
          <Route path="tecnica" element={<Tecnica />} />
          <Route path="admin" element={<Admin />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
