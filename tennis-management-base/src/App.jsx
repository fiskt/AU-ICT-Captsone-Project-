import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';

import { COACH_SIDEBAR, PLAYER_SIDEBAR, TOPBAR } from './Components/SharedComponents';

import Login from './pages/Login';
import Register from './pages/Register';
import AuthCallback from './pages/AuthCallback';

import CoachCalendar from './pages/CoachCalendar';
import CoachDashboard from './pages/CoachDashboard';
import PlayerProfile from './pages/PlayerProfile';
import PlayerDashboard from './pages/PlayerDashboard';
import PlayerCalendar from './pages/PlayerCalendar';
import DrillLibrary from './pages/DrillLibrary';
import Testing from './pages/Testing';
import SessionFeedback from './pages/SessionFeedback'
import OtherUsers from './pages/OtherUsers';

const AUTH_ROUTES   = ['/', '/Login', '/Register', '/auth/callback'];
const PLAYER_ROUTES = ['/PlayerDashboard', '/PlayerCalendar', '/SessionFeedback'];

function AppLayout() {
  const location = useLocation();
  const isAuthPage   = AUTH_ROUTES.includes(location.pathname);
  const isPlayerPage = PLAYER_ROUTES.includes(location.pathname);

  const loginLocation = location.pathname === 'Login' || location.pathname === 'Register';

  return (
    <div id="layout">
      {!isAuthPage && isPlayerPage && !loginLocation && <PLAYER_SIDEBAR />}
      {!isAuthPage && !isPlayerPage && !loginLocation && <COACH_SIDEBAR />}
      {!isAuthPage && !loginLocation && <TOPBAR />}

      <div id={isAuthPage ? undefined : 'main-content-wrapper'}>
        <main id={isAuthPage ? undefined : 'main-content'}>
          <Routes>
            <Route path="/"               element={<Login />} />
            <Route path="/Login"          element={<Login />} />
            <Route path="/Register"       element={<Register />} />
            <Route path="/auth/callback"  element={<AuthCallback />} />

            <Route path="/CoachDashboard"  element={<CoachDashboard />} />
            <Route path="/CoachCalendar"   element={<CoachCalendar />} />
            <Route path="/PlayerProfile"   element={<PlayerProfile />} />
            <Route path="/PlayerDashboard" element={<PlayerDashboard />} />
            <Route path="/PlayerCalendar" element={<PlayerCalendar />} />
            <Route path="/DrillLibrary"    element={<DrillLibrary />} />
            <Route path="/Testing"         element={<Testing />} />
            <Route path="/SessionFeedback" element={<SessionFeedback />} />
            <Route path="/OtherUsers"      element={<OtherUsers />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  );
}

export default App;