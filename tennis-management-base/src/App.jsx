import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';

import { COACH_SIDEBAR, TOPBAR } from './Components/SharedComponents';

import Login from './pages/Login';
import Register from './pages/Register';

import CoachCalendar from './pages/CoachCalendar';
import CoachDashboard from './pages/CoachDashboard';
import PlayerProfile from './pages/PlayerProfile';
import DrillLibrary from './pages/DrillLibrary';
import Testing from './pages/Testing';
import PlayerDashboard from './pages/PlayerDashboard';  
import OtherUsers from './pages/OtherUsers';

const AUTH_ROUTES = ['/', '/login', '/register'];

function AppLayout() {
  const location = useLocation();
  const isAuthPage = AUTH_ROUTES.includes(location.pathname);

  return (
    <div id="layout">
      {!isAuthPage && <COACH_SIDEBAR />}
      {!isAuthPage && <TOPBAR />}

      <div id={isAuthPage ? undefined : 'main-content-wrapper'}>
        <main id={isAuthPage ? undefined : 'main-content'}>
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            <Route path="/CoachDashboard" element={<CoachDashboard />} />
            <Route path="/CoachCalendar" element={<CoachCalendar />} />
            <Route path="/PlayerProfile" element={<PlayerProfile />} />
            <Route path="/DrillLibrary" element={<DrillLibrary />} />
            <Route path="/Testing" element={<Testing />} />
            <Route path="/OtherUsers" element={<OtherUsers />} />
            <Route path="/PlayerDashboard" element={<PlayerDashboard />} />
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
