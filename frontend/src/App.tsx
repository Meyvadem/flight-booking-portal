// frontend/src/App.tsx
import { Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import Results from "./pages/Results";
import LoginPage from "./pages/LoginPage";
import AncillariesPage from "./pages/AncillariesPage";
import PaymentPage from "./pages/PaymentPage";
import MyFlightsPage from "./pages/MyFlightsPage";
import ReceiptPage from "./pages/ReceiptPage";
import RegisterPage from "./pages/RegisterPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/results" element={<Results />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/ancillaries" element={<AncillariesPage />} />
      <Route path="/payment" element={<PaymentPage />} />
      <Route path="/my-flights" element={<MyFlightsPage />} />
      <Route path="/receipt" element={<ReceiptPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}



