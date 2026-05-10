import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';

// 1. Shared Layout Components
import { COACH_SIDEBAR, TOPBAR } from './Components/SharedComponents';
import Layout from './Components/LoginRegisterComponents';

// 2. Auth Pages
import Login from './pages/Login';
import Register from './pages/Register';

// 3. Main Dashboard Pages
import CoachCalendar from './pages/CoachCalendar';
import CoachDashboard from './pages/CoachDashboard';
import PlayerProfile from './pages/PlayerProfile';
import DrillLibrary from './pages/DrillLibrary';
import Testing from './pages/Testing';
import OtherUsers from './pages/OtherUsers';

// This component handles the conditional rendering of the sidebar/topbar
function AppContent() {
  const location = useLocation();
  
  // Logic to determine if we should hide the sidebar
  const isAuthPage = 
    location.pathname === '/login' || 
    location.pathname === '/register' || 
    location.pathname === '/';

  return (
    <Routes>
      {/* --- AUTHENTICATION ROUTES (Background & Logo Layout) --- */}
      <Route element={<Layout />}>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Route>

      {/* --- DASHBOARD ROUTES (Sidebar & Topbar Layout) --- */}
      {!isAuthPage && (
        <Route
          path="*"
          element={
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
                    <Route path="/Testing" element={<Testing />} />
                    <Route path="/OtherUsers" element={<OtherUsers />} />
                    
                    {/* Catch-all for dashboard paths to avoid white screens */}
                    <Route path="*" element={<Navigate to="/CoachDashboard" replace />} />
                  </Routes>
                </main>
              </div>
            </div>
          }
        />
      )}
    </Routes>
  );
}

// Main App export
export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}