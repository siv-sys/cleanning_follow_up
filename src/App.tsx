import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './auth/AuthProvider';
import { GuestOnly, RequireAuth, RoleHome } from './auth/guards';
import { ToastProvider } from './components/ui/ToastProvider';
import { ConfirmProvider } from './components/ui/ConfirmProvider';
import { AppShell } from './components/layout/AppShell';
import { LoginPage } from './features/auth/LoginPage';
import { AccountPage } from './features/account/AccountPage';
import { UsersPage } from './features/admin/UsersPage';
import { MyPhotosPage } from './features/photos/MyPhotosPage';
import { HousesPage } from './features/houses/HousesPage';
import { HouseDetailPage } from './features/houses/HouseDetailPage';
import { StudentsPage } from './features/houses/StudentsPage';
import { StudentPhotosPage } from './features/houses/StudentPhotosPage';
import { MyHousePage } from './features/houses/MyHousePage';
import { NotFoundPage } from './features/common/Placeholder';

// Teachers and admins share these pages; admins also get management controls.
const staffRoutes = (
  <>
    <Route path="houses" element={<HousesPage />} />
    <Route path="houses/:houseId" element={<HouseDetailPage />} />
    <Route path="students" element={<StudentsPage />} />
    <Route path="students/:studentId" element={<StudentPhotosPage />} />
  </>
);

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <ConfirmProvider>
          <AuthProvider>
            <Routes>
              {/* Login only: accounts are created by administrators. */}
              <Route path="/login" element={<GuestOnly><LoginPage /></GuestOnly>} />

              <Route element={<RequireAuth />}>
                <Route index element={<RoleHome />} />
                <Route element={<AppShell />}>
                  <Route path="account" element={<AccountPage />} />

                  <Route path="student" element={<RequireAuth roles={['student']} />}>
                    <Route index element={<MyPhotosPage />} />
                  </Route>

                  {/* Supervisor: uploads like a student + sees their own house's members. */}
                  <Route path="supervisor" element={<RequireAuth roles={['supervisor']} />}>
                    <Route index element={<MyPhotosPage />} />
                    <Route path="house" element={<MyHousePage />} />
                    <Route path="students/:studentId" element={<StudentPhotosPage />} />
                  </Route>

                  <Route path="teacher" element={<RequireAuth roles={['teacher']} />}>
                    <Route index element={<Navigate to="houses" replace />} />
                    {staffRoutes}
                  </Route>

                  <Route path="admin" element={<RequireAuth roles={['admin']} />}>
                    <Route index element={<Navigate to="houses" replace />} />
                    {staffRoutes}
                    <Route path="users" element={<UsersPage />} />
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
