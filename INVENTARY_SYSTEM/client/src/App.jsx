import React, { useContext } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthContext } from './contexts/AuthContext';
import Layout from './components/layout/Layout';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import ProductsPage from './pages/ProductsPage';
import BillingPage from './pages/BillingPage';
import ShelfMonitorPage from './pages/ShelfMonitorPage';
import InventoryHistoryPage from './pages/InventoryHistoryPage';
import NotificationsPage from './pages/NotificationsPage';
import SuppliersPage from './pages/SuppliersPage';
import ForecastPage from './pages/ForecastPage';
import ProcurementPage from './pages/ProcurementPage';
import ReportsPage from './pages/ReportsPage';
import SettingsPage from './pages/SettingsPage';

// Protected Route wrapper
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white font-bold text-sm">
        Authenticating Smart Inventory SaaS...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

const App = () => {
  return (
    <Routes>
      {/* Public Auth Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Protected SaaS Layout Routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="products" element={<ProductsPage />} />
        <Route path="billing" element={<BillingPage />} />
        <Route path="shelf-monitor" element={<ShelfMonitorPage />} />
        <Route path="inventory-history" element={<InventoryHistoryPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="suppliers" element={<SuppliersPage />} />
        <Route path="forecast" element={<ForecastPage />} />
        <Route path="procurement" element={<ProcurementPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route
          path="settings"
          element={
            <ProtectedRoute allowedRoles={['Admin']}>
              <SettingsPage />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

export default App;
