import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { DataProvider, useData } from './context/DataContext';
import MainLayout from './components/layout/MainLayout';
import EquipmentPage from './pages/equipment/EquipmentPage';
import MaintenancePage from './pages/maintenance/MaintenancePage';
import CalendarPage from './pages/CalendarPage';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/auth/LoginPage';
import SignupPage from './pages/auth/SignupPage';

const Dashboard = () => <div><h2>Dashboard</h2><p>Not implemented in this prototype. Go to Equipment or Maintenance.</p></div>;

const ProtectedRoute = ({ children }) => {
  const { currentUser } = useData();
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

function App() {
  return (
    <DataProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />

          <Route element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }>
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="equipment" element={<EquipmentPage />} />
            <Route path="maintenance" element={<MaintenancePage />} />
            <Route path="calendar" element={<CalendarPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </DataProvider>
  );
}

export default App;
