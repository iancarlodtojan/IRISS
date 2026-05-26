import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import LoginPage from "./pages/LoginPage";
import ProtectedRoute from "./components/ProtectedRoute";

// CASHIER
import CashierDashboardPage from "./pages/Cashier/DashboardPage";
import ItemsPage from "./pages/Cashier/ItemsPage";
import LogsPage from "./pages/Cashier/LogsPage";
import PriceListPage from "./pages/Cashier/PriceListPage";
import CustomersPage from "./pages/Cashier/CustomersPage";

// ADMIN
import AdminDashboardPage from "./pages/Admin/DashboardPage";
import UsersPage from "./pages/Admin/UsersPage";

// LOGISTICS
import LogisticsDashboardPage from "./pages/Logistics/DashboardPage";
import LogisticsInventoryPage from "./pages/Logistics/InventoryPage";
import LogisticsPriceListPage from "./pages/Logistics/PriceListPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* DEFAULT */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* LOGIN */}
        <Route path="/login" element={<LoginPage />} />

        {/* CASHIER */}
        <Route
          path="/cashier/dashboard"
          element={
            <ProtectedRoute allowedRoles={["cashier"]}>
              <CashierDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/cashier/items"
          element={
            <ProtectedRoute allowedRoles={["cashier"]}>
              <ItemsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/cashier/prices"
          element={
            <ProtectedRoute allowedRoles={["cashier"]}>
              <PriceListPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/cashier/logs"
          element={
            <ProtectedRoute allowedRoles={["cashier"]}>
              <LogsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/cashier/customers"
          element={
            <ProtectedRoute allowedRoles={["cashier"]}>
              <CustomersPage />
            </ProtectedRoute>
          }
        />

        {/* ADMIN */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <UsersPage />
            </ProtectedRoute>
          }
        />

        {/* LOGISTICS */}
        <Route
          path="/logistics/dashboard"
          element={
            <ProtectedRoute allowedRoles={["logistics"]}>
              <LogisticsDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/logistics/inventory"
          element={
            <ProtectedRoute allowedRoles={["logistics"]}>
              <LogisticsInventoryPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/logistics/prices"
          element={
            <ProtectedRoute allowedRoles={["logistics"]}>
              <LogisticsPriceListPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/logistics/deliveries"
          element={
            <ProtectedRoute allowedRoles={["logistics"]}>
              <LogisticsDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/logistics/suppliers"
          element={
            <ProtectedRoute allowedRoles={["logistics"]}>
              <LogisticsDashboardPage />
            </ProtectedRoute>
          }
        />

        {/* FALLBACK */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;