import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import LoginPage from "./pages/LoginPage";

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
        <Route path="/cashier/dashboard" element={<CashierDashboardPage />} />
        <Route path="/cashier/items" element={<ItemsPage />} />
        <Route path="/cashier/prices" element={<PriceListPage />} />
        <Route path="/cashier/logs" element={<LogsPage />} />
        <Route path="/cashier/customers" element={<CustomersPage />} />

        {/* ADMIN */}
        <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
        <Route path="/admin/users" element={<UsersPage />} />

        {/* LOGISTICS */}
        <Route
          path="/logistics/dashboard"
          element={<LogisticsDashboardPage />}
        />

        <Route
          path="/logistics/inventory"
          element={<LogisticsInventoryPage />}
        />
        <Route path="/logistics/prices" element={<LogisticsPriceListPage />} />
        
        <Route
          path="/logistics/deliveries"
          element={<LogisticsDashboardPage />}
        />
        <Route
          path="/logistics/suppliers"
          element={<LogisticsDashboardPage />}
        />

        {/* FALLBACK */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
