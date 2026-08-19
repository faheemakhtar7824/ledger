import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SpaceProvider } from './context/SpaceContext';
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';
import SpaceThemeWrapper from './components/SpaceThemeWrapper';
import Login from './screens/Login';
import VerifyOtp from './screens/VerifyOtp';
import ForgotPassword from './screens/ForgotPassword';
import ResetPassword from './screens/ResetPassword';
import Dashboard from './screens/Dashboard';
import Categories from './screens/Categories';
import CategoryDetail from './screens/CategoryDetail';
import Settings from './screens/Settings';
import BudgetSetup from './screens/BudgetSetup';
import ExpenseHistory from './screens/ExpenseHistory';
import Reports from './screens/Reports';
import PrivacySecurity from './screens/PrivacySecurity';

function Themed({ children }) {
  return (
    <ProtectedRoute>
      <SpaceThemeWrapper>{children}</SpaceThemeWrapper>
    </ProtectedRoute>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SpaceProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/verify-otp" element={<VerifyOtp />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/" element={<Themed><Dashboard /></Themed>} />
              <Route path="/categories" element={<Themed><Categories /></Themed>} />
              <Route path="/categories/:categoryId" element={<Themed><CategoryDetail /></Themed>} />
              <Route path="/settings" element={<Themed><Settings /></Themed>} />
              <Route path="/budget" element={<Themed><BudgetSetup /></Themed>} />
              <Route path="/history" element={<Themed><ExpenseHistory /></Themed>} />
              <Route path="/reports" element={<Themed><Reports /></Themed>} />
              <Route path="/privacy" element={<Themed><PrivacySecurity /></Themed>} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </SpaceProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}