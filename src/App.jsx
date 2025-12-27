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
import AdminDashboard from './pages/dashboards/AdminDashboard';
import ManagerDashboard from './pages/dashboards/ManagerDashboard';
import TechnicianDashboard from './pages/dashboards/TechnicianDashboard';
import EmployeeDashboard from './pages/dashboards/EmployeeDashboard';

// Smart Dashboard Router - redirects to role-specific dashboard
const DashboardRouter = () => {
  const { currentUser } = useData();

  if (!currentUser) return <Navigate to="/login" replace />;

  const role = currentUser.role?.toLowerCase();

  switch (role) {
    case 'admin':
      return <AdminDashboard />;
    case 'manager':
      return <ManagerDashboard />;
    case 'technician':
      return <TechnicianDashboard />;
    case 'employee':
      return <EmployeeDashboard />;
    default:
      return <EmployeeDashboard />;
  }
};

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
            <Route path="dashboard" element={<DashboardRouter />} />
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
