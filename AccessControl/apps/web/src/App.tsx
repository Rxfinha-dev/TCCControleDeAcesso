import { lazy, Suspense, type ComponentType } from 'react';
import { BrowserRouter, Link, Navigate, Outlet, Route, Routes, useLocation } from 'react-router';
import { AppLayout } from './components/AppLayout';
import { Logo } from './components/Logo';
import { RequireSchool } from './components/RequireSchool';
import type { UserRole } from './api/types';
import { AuthProvider, PANEL_ROLES, useAuth } from './contexts/AuthContext';
import { SerialProvider } from './contexts/SerialContext';
import { ToastProvider } from './contexts/ToastContext';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';

/** Cada tela vira um arquivo à parte, baixado só quando é aberta (login e cadastro ficam no pacote inicial). */
function page<K extends string>(load: () => Promise<Record<K, ComponentType>>, name: K) {
  return lazy(() => load().then((module) => ({ default: module[name] })));
}

const AccessLogsPage = page(() => import('./pages/AccessLogsPage'), 'AccessLogsPage');
const AssessmentsPage = page(() => import('./pages/AssessmentsPage'), 'AssessmentsPage');
const AttendancePage = page(() => import('./pages/AttendancePage'), 'AttendancePage');
const CalendarPage = page(() => import('./pages/CalendarPage'), 'CalendarPage');
const ChangePasswordPage = page(() => import('./pages/ChangePasswordPage'), 'ChangePasswordPage');
const ClassGroupPage = page(() => import('./pages/ClassGroupPage'), 'ClassGroupPage');
const ClassGroupsPage = page(() => import('./pages/ClassGroupsPage'), 'ClassGroupsPage');
const CoursesPage = page(() => import('./pages/CoursesPage'), 'CoursesPage');
const DashboardPage = page(() => import('./pages/DashboardPage'), 'DashboardPage');
const ForgotPasswordPage = page(() => import('./pages/ForgotPasswordPage'), 'ForgotPasswordPage');
const ReportCardPage = page(() => import('./pages/ReportCardPage'), 'ReportCardPage');
const SchoolsPage = page(() => import('./pages/SchoolsPage'), 'SchoolsPage');
const SettingsPage = page(() => import('./pages/SettingsPage'), 'SettingsPage');
const StudentHomePage = page(() => import('./pages/StudentHomePage'), 'StudentHomePage');
const StudentsPage = page(() => import('./pages/StudentsPage'), 'StudentsPage');
const SubjectsPage = page(() => import('./pages/SubjectsPage'), 'SubjectsPage');
const TeacherHomePage = page(() => import('./pages/TeacherHomePage'), 'TeacherHomePage');
const TeachersPage = page(() => import('./pages/TeachersPage'), 'TeachersPage');
const UsersPage = page(() => import('./pages/UsersPage'), 'UsersPage');
const VerificationPage = page(() => import('./pages/VerificationPage'), 'VerificationPage');
const VerifyEmailPage = page(() => import('./pages/VerifyEmailPage'), 'VerifyEmailPage');

/** Perfis ainda sem painel (funcionário). */
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
  if (!user) return <Navigate to="/login" replace state={{ from: `${location.pathname}${location.search}` }} />;
  if (user.mustChangePassword) return <ChangePasswordPage />;
  if (!PANEL_ROLES.includes(user.role)) return <ComingSoonPage />;
  return <Outlet />;
}

/** Libera as telas só para os perfis informados; os outros voltam para o início deles. */
function RoleRoute({ roles }: { roles: UserRole[] }) {
  const { user } = useAuth();
  return user && roles.includes(user.role) ? <Outlet /> : <Navigate to="/" replace />;
}

const SCHOOL_ROLES: UserRole[] = ['SUPER_ADMIN', 'SCHOOL'];
/** Chamada e avaliações: a escola e o professor (limitado às aulas dele). */
const STAFF_ROLES: UserRole[] = [...SCHOOL_ROLES, 'TEACHER'];

function HomePage() {
  const { user } = useAuth();
  if (user?.role === 'TEACHER') return <TeacherHomePage />;
  if (user?.role === 'STUDENT') return <StudentHomePage />;
  return <DashboardPage />;
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
    <Suspense
      fallback={
        <div className="splash">
          <Logo variant="auto" />
        </div>
      }
    >
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/cadastro" element={<RegisterPage />} />
      <Route path="/ativar-conta" element={<VerifyEmailPage />} />
      <Route path="/esqueci-senha" element={<ForgotPasswordPage />} />
      <Route element={<RequireAuth />}>
        <Route element={<AppLayout />}>
          <Route index element={<HomePage />} />
          <Route element={<RoleRoute roles={['STUDENT']} />}>
            <Route path="/boletim" element={<ReportCardPage />} />
          </Route>
          <Route element={<RoleRoute roles={STAFF_ROLES} />}>
          <Route
            path="/presenca"
            element={
              <RequireSchool>
                <AttendancePage />
              </RequireSchool>
            }
          />
          <Route
            path="/avaliacoes"
            element={
              <RequireSchool>
                <AssessmentsPage />
              </RequireSchool>
            }
          />
          </Route>
          <Route element={<RoleRoute roles={SCHOOL_ROLES} />}>
          <Route
            path="/boletim/:studentId"
            element={
              <RequireSchool>
                <ReportCardPage />
              </RequireSchool>
            }
          />
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
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
    </Suspense>
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
