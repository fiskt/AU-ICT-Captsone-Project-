import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { COACH_SIDEBAR, PLAYER_SIDEBAR, TOPBAR } from './Components/SharedComponents';

import Login from './pages/Login'
import Register from './pages/Register'

import CoachCalendar from './pages/CoachCalendar'
import CoachDashboard from './pages/CoachDashboard'
import PlayerProfile from './pages/PlayerProfile'
import DrillLibrary from './pages/DrillLibrary';
import LoadTracking from './pages/LoadTracking';
import Testing from './pages/Testing';
import OtherUsers from './pages/OtherUsers';

import PlayerCalendar from './pages/PlayerCalendar'
import PlayerDashboard from './pages/PlayerDashboard'

// create a Layout wrapper for your authenticated pages
function DashboardLayout() {
  return (
    <div id="layout">
      <COACH_SIDEBAR />
      <TOPBAR />
      <div id="main-content-wrapper">
        <main id="main-content">
          {/* This is where the nested routes will be rendered */}
          <Outlet /> 
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* PUBLIC ROUTES (No Sidebar/Topbar) */}
        {/* automatically redirect the root URL to the login page */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* PROTECTED ROUTES (Wrapped in DashboardLayout) */}
        <Route element={<DashboardLayout />}>
          <Route path="/CoachDashboard" element={<CoachDashboard />} />
          <Route path="/CoachCalendar" element={<CoachCalendar />} />
          <Route path="/PlayerProfile" element={<PlayerProfile />} />
          <Route path="/DrillLibrary" element={<DrillLibrary />} />
          <Route path="/Testing" element={<Testing />} />
          <Route path="/OtherUsers" element={<OtherUsers />} />

          <Route path="/PlayerCalendar" element={<PlayerCalendar />} />
          <Route path="/PlayerDashboard" element={<PlayerDashboard />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;