import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './auth/AuthProvider';
import { GuestOnly, RequireAuth, RoleHome } from './auth/guards';
import { ToastProvider } from './components/ui/ToastProvider';
import { ConfirmProvider } from './components/ui/ConfirmProvider';
import { AppShell } from './components/layout/AppShell';
import { LoginPage } from './features/auth/LoginPage';
import { SignUpPage } from './features/auth/SignUpPage';
import { ForgotPasswordPage, ResetPasswordPage } from './features/auth/PasswordPages';
import { AccountPage } from './features/account/AccountPage';
import { NotFoundPage, Placeholder } from './features/common/Placeholder';

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <ConfirmProvider>
          <AuthProvider>
            <Routes>
              <Route path="/login" element={<GuestOnly><LoginPage /></GuestOnly>} />
              <Route path="/signup" element={<GuestOnly><SignUpPage /></GuestOnly>} />
              <Route path="/forgot-password" element={<GuestOnly><ForgotPasswordPage /></GuestOnly>} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />

              <Route element={<RequireAuth />}>
                <Route index element={<RoleHome />} />
                <Route element={<AppShell />}>
                  <Route path="account" element={<AccountPage />} />

                  <Route path="student" element={<RequireAuth roles={['student']} />}>
                    <Route index element={<Placeholder title="My tasks" stage={3} />} />
                    <Route path="history" element={<Placeholder title="Submission history" stage={3} />} />
                  </Route>

                  <Route path="teacher" element={<RequireAuth roles={['teacher']} />}>
                    <Route index element={<Placeholder title="Submissions" stage={4} />} />
                    <Route path="students" element={<Placeholder title="Students" stage={4} />} />
                    <Route path="reviews" element={<Placeholder title="My reviews" stage={4} />} />
                  </Route>

                  <Route path="admin" element={<RequireAuth roles={['admin']} />}>
                    <Route index element={<Placeholder title="Overview" stage={5} />} />
                    <Route path="submissions" element={<Placeholder title="All submissions" stage={5} />} />
                    <Route path="tasks" element={<Placeholder title="Cleaning tasks" stage={5} />} />
                    <Route path="classes" element={<Placeholder title="Classes" stage={5} />} />
                    <Route path="users" element={<Placeholder title="Users & roles" stage={5} />} />
                  </Route>
                </Route>
              </Route>

              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </AuthProvider>
        </ConfirmProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}
