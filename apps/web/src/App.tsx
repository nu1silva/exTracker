import { Navigate, Route, Routes } from 'react-router';
import { DashboardPage } from './DashboardPage.tsx';
import { LoginPage } from './LoginPage.tsx';
import { RequireUser } from './RequireUser.tsx';
import { SignupPage } from './SignupPage.tsx';

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route element={<RequireUser />}>
        <Route index element={<DashboardPage />} />
      </Route>
      {/* No other pages yet. Signed-out people then go on to sign in. */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
