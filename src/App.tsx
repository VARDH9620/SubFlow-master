import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastContainer } from './components/ui';

// Layouts
import { PublicLayout, UserLayout, AdminLayout } from './components/layout';

// Public Pages
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';

// User Pages
import UserDashboard from './pages/user/Dashboard';
import UserServices from './pages/user/Services';
import UserSubscriptions from './pages/user/Subscriptions';
import UserBilling from './pages/user/Billing';
import UserProfile from './pages/user/Profile';
import UserSupport from './pages/user/Support';
import UserPayment from './pages/user/Payment';

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard';
import AdminUsers from './pages/admin/Users';
import AdminServices from './pages/admin/Services';
import AdminPlans from './pages/admin/Plans';
import AdminSubscriptions from './pages/admin/Subscriptions';
import AdminRevenue from './pages/admin/Revenue';
import AdminPayments from './pages/admin/Payments';
import AdminSupport from './pages/admin/Support';
import AdminSettings from './pages/admin/Settings';
import AdminSystemStatus from './pages/admin/SystemStatus';
import UserActivity from './pages/user/Activity';
import UserNotifications from './pages/user/Notifications';
import UserReferrals from './pages/user/Referrals';

import type { ReactNode } from 'react';

// Protected route wrapper
function ProtectedRoute({ children, role }: { children: ReactNode; role?: 'user' | 'admin' }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-10 h-10 border-[3px] border-border border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (role && user.role !== role) {
    return <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
      </Route>

      {/* User routes */}
      <Route element={<ProtectedRoute role="user"><UserLayout /></ProtectedRoute>}>
        <Route path="/dashboard" element={<UserDashboard />} />
        <Route path="/services" element={<UserServices />} />
        <Route path="/subscriptions" element={<UserSubscriptions />} />
        <Route path="/billing" element={<UserBilling />} />
        <Route path="/payment" element={<UserPayment />} />
        <Route path="/activity" element={<UserActivity />} />
        <Route path="/notifications" element={<UserNotifications />} />
        <Route path="/referrals" element={<UserReferrals />} />
        <Route path="/support" element={<UserSupport />} />
        <Route path="/profile" element={<UserProfile />} />
      </Route>

      {/* Admin routes */}
      <Route path="/admin" element={<ProtectedRoute role="admin"><AdminLayout /></ProtectedRoute>}>
        <Route index element={<AdminDashboard />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="services" element={<AdminServices />} />
        <Route path="plans" element={<AdminPlans />} />
        <Route path="subscriptions" element={<AdminSubscriptions />} />
        <Route path="revenue" element={<AdminRevenue />} />
        <Route path="payments" element={<AdminPayments />} />
        <Route path="tickets" element={<AdminSupport />} />
        <Route path="status" element={<AdminSystemStatus />} />
        <Route path="settings" element={<AdminSettings />} />
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <>
            <div className="premium-gradient-bg fixed inset-0 pointer-events-none z-[-1]" />
            <div className="relative z-0 min-h-screen">
              <ToastContainer />
              <AppRoutes />
            </div>
          </>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
