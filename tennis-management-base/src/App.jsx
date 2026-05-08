import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import { COACH_SIDEBAR, TOPBAR } from './Components/SharedComponents';
import Layout from './Components/LoginRegisterComponents';

import Login from './pages/Login';
import Register from './pages/Register';

import CoachCalendar from './pages/CoachCalendar';
import CoachDashboard from './pages/CoachDashboard';
import PlayerProfile from './pages/PlayerProfile';
import DrillLibrary from './pages/DrillLibrary';
import LoadTracking from './pages/LoadTracking';
import Testing from './pages/Testing';
import OtherUsers from './pages/OtherUsers';

import PlayerCalendar from './pages/PlayerCalendar';
import PlayerDashboard from './pages/PlayerDashboard';

import './pages/LoginRegister.css';

function DashboardLayout() {
  return (
    <div id="layout">
      <COACH_SIDEBAR />

      <TOPBAR />

      <div id="main-content-wrapper">
        <main id="main-content">
          <Routes>
            <Route path="/CoachDashboard" element={<CoachDashboard />} />
            <Route path="/CoachCalendar" element={<CoachCalendar />} />
            <Route path="/PlayerProfile" element={<PlayerProfile />} />
            <Route path="/DrillLibrary" element={<DrillLibrary />} />
            <Route path="/LoadTracking" element={<LoadTracking />} />
            <Route path="/Testing" element={<Testing />} />
            <Route path="/OtherUsers" element={<OtherUsers />} />

            <Route path="/PlayerDashboard" element={<PlayerDashboard />} />
            <Route path="/PlayerCalendar" element={<PlayerCalendar />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />

        <Route element={<Layout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Route>

        <Route path="/*" element={<DashboardLayout />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;