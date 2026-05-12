import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import DashboardPage from "./pages/DashboardPage";
import ItemsPage from "./pages/ItemsPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/items" element={<ItemsPage />} />
        {/* placeholder routes for links without pages yet */}
        <Route path="/logs" element={<DashboardPage />} />
        <Route path="/customers" element={<DashboardPage />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;