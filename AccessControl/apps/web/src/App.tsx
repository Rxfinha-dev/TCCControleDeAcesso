import { BrowserRouter, Link, Navigate, Outlet, Route, Routes, useLocation } from 'react-router';
import { AppLayout } from './components/AppLayout';
import { Logo } from './components/Logo';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SerialProvider } from './contexts/SerialContext';
import { ToastProvider } from './contexts/ToastContext';
import { AccessLogsPage } from './pages/AccessLogsPage';
import { CoursesPage } from './pages/CoursesPage';
import { DashboardPage } from './pages/DashboardPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { SettingsPage } from './pages/SettingsPage';
import { StudentsPage } from './pages/StudentsPage';
import { VerificationPage } from './pages/VerificationPage';
import { VerifyEmailPage } from './pages/VerifyEmailPage';

function RequireAuth() {
  const { school, loading } = useAuth();
  const location = useLocation();
  if (loading) {
    return (
      <div className="splash">
        <Logo className="floating" />
      </div>
    );
  }
  if (!school) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return <Outlet />;
}

function NotFoundPage() {
  return (
    <div className="splash">
      <Logo />
      <h1>Página não encontrada</h1>
      <Link to="/" className="btn btn-primary">
        Voltar ao início
      </Link>
    </div>
  );
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/cadastro" element={<RegisterPage />} />
      <Route path="/ativar-conta" element={<VerifyEmailPage />} />
      <Route path="/esqueci-senha" element={<ForgotPasswordPage />} />
      <Route element={<RequireAuth />}>
        <Route element={<AppLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="/alunos" element={<StudentsPage />} />
          <Route path="/cursos" element={<CoursesPage />} />
          <Route path="/verificacao" element={<VerificationPage />} />
          <Route path="/entradas" element={<AccessLogsPage />} />
          <Route path="/configuracoes" element={<SettingsPage />} />
        </Route>
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <SerialProvider>
            <AppRoutes />
          </SerialProvider>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}
