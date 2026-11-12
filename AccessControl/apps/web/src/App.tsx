import { BrowserRouter, Link, Navigate, Outlet, Route, Routes, useLocation } from 'react-router';
import { AppLayout } from './components/AppLayout';
import { Logo } from './components/Logo';
import { RequireSchool } from './components/RequireSchool';
import { AuthProvider, PANEL_ROLES, useAuth } from './contexts/AuthContext';
import { SerialProvider } from './contexts/SerialContext';
import { ToastProvider } from './contexts/ToastContext';
import { AccessLogsPage } from './pages/AccessLogsPage';
import { CalendarPage } from './pages/CalendarPage';
import { ClassGroupPage } from './pages/ClassGroupPage';
import { ClassGroupsPage } from './pages/ClassGroupsPage';
import { CoursesPage } from './pages/CoursesPage';
import { DashboardPage } from './pages/DashboardPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { SchoolsPage } from './pages/SchoolsPage';
import { SettingsPage } from './pages/SettingsPage';
import { StudentsPage } from './pages/StudentsPage';
import { SubjectsPage } from './pages/SubjectsPage';
import { TeachersPage } from './pages/TeachersPage';
import { UsersPage } from './pages/UsersPage';
import { VerificationPage } from './pages/VerificationPage';
import { VerifyEmailPage } from './pages/VerifyEmailPage';

/** Perfis futuros (aluno, funcionário, professor) ainda não têm painel. */
function ComingSoonPage() {
  const { logout } = useAuth();
  return (
    <div className="splash">
      <Logo variant="auto" />
      <h1>Em breve</h1>
      <p>Seu acesso à plataforma estará disponível em breve.</p>
      <button type="button" className="btn btn-primary" onClick={() => void logout()}>
        Sair
      </button>
    </div>
  );
}

function RequireAuth() {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) {
    return (
      <div className="splash">
        <Logo variant="auto" />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (!PANEL_ROLES.includes(user.role)) return <ComingSoonPage />;
  return <Outlet />;
}

/** Telas de gestão global: quem não é super admin volta para o início. */
function SuperAdminRoute() {
  const { isSuperAdmin } = useAuth();
  return isSuperAdmin ? <Outlet /> : <Navigate to="/" replace />;
}

function NotFoundPage() {
  return (
    <div className="splash">
      <Logo variant="auto" />
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
          <Route
            path="/alunos"
            element={
              <RequireSchool>
                <StudentsPage />
              </RequireSchool>
            }
          />
          <Route
            path="/cursos"
            element={
              <RequireSchool>
                <CoursesPage />
              </RequireSchool>
            }
          />
          <Route
            path="/turmas"
            element={
              <RequireSchool>
                <ClassGroupsPage />
              </RequireSchool>
            }
          />
          <Route
            path="/turmas/:id"
            element={
              <RequireSchool>
                <ClassGroupPage />
              </RequireSchool>
            }
          />
          <Route
            path="/disciplinas"
            element={
              <RequireSchool>
                <SubjectsPage />
              </RequireSchool>
            }
          />
          <Route
            path="/professores"
            element={
              <RequireSchool>
                <TeachersPage />
              </RequireSchool>
            }
          />
          <Route
            path="/calendario"
            element={
              <RequireSchool>
                <CalendarPage />
              </RequireSchool>
            }
          />
          <Route
            path="/verificacao"
            element={
              <RequireSchool>
                <VerificationPage />
              </RequireSchool>
            }
          />
          <Route path="/entradas" element={<AccessLogsPage />} />
          <Route path="/configuracoes" element={<SettingsPage />} />
          <Route element={<SuperAdminRoute />}>
            <Route path="/escolas" element={<SchoolsPage />} />
            <Route path="/usuarios" element={<UsersPage />} />
          </Route>
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
