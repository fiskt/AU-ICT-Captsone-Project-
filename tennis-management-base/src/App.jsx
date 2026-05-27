import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';

import { COACH_SIDEBAR, PLAYER_SIDEBAR, TOPBAR } from './Components/SharedComponents';
import ProtectedRoute from './Components/ProtectedRoute';

import Login          from './pages/Login';
import Register       from './pages/Register';
import AuthCallback   from './pages/AuthCallback';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword  from './pages/ResetPassword';

import CoachCalendar   from './pages/CoachCalendar';
import CoachDashboard  from './pages/CoachDashboard';
import PlayerProfile   from './pages/PlayerProfile';
import PlayerDashboard from './pages/PlayerDashboard';
import PlayerCalendar  from './pages/PlayerCalendar';
import DrillLibrary    from './pages/DrillLibrary';
import Testing         from './pages/Testing';
import SessionFeedback from './pages/SessionFeedback';
import FeedbackSummary from './pages/PlayerFeedbackSummary';
import OtherUsers      from './pages/OtherUsers';

const AUTH_ROUTES   = ['/', '/Login', '/login', '/Register', '/register', '/auth/callback', '/ForgotPassword', '/forgotpassword', '/ResetPassword', '/resetpassword'];
const PLAYER_ROUTES = ['/PlayerDashboard', '/PlayerCalendar', '/SessionFeedback'];

function AppLayout() {
    const location = useLocation();

    const isAuthPage     = AUTH_ROUTES.includes(location.pathname);
    const isPlayerRoute  = PLAYER_ROUTES.includes(location.pathname);
    const isCoachPreview = location.state?.isCoachPreview ?? false;

    const showPlayerSidebar = isPlayerRoute && !isCoachPreview;
    const showCoachSidebar  = !isAuthPage && !showPlayerSidebar;

    return (
        <div id="layout">
            {!isAuthPage && showPlayerSidebar && <PLAYER_SIDEBAR />}
            {showCoachSidebar && <COACH_SIDEBAR />}
            {!isAuthPage && <TOPBAR />}

            <div id={isAuthPage ? undefined : 'main-content-wrapper'}>
                <main id={isAuthPage ? undefined : 'main-content'}>
                    <Routes>
                        {/* Public routes: no sign in required */}
                        <Route path="/"                element={<Login />} />
                        <Route path="/Login"           element={<Login />} />
                        <Route path="/login"           element={<Login />} />
                        <Route path="/Register"        element={<Register />} />
                        <Route path="/register"        element={<Register />} />
                        <Route path="/auth/callback"   element={<AuthCallback />} />
                        <Route path="/ForgotPassword"  element={<ForgotPassword />} />
                        <Route path="/forgotpassword"  element={<ForgotPassword />} />
                        <Route path="/ResetPassword"   element={<ResetPassword />} />
                        <Route path="/resetpassword"   element={<ResetPassword />} />

                        {/* Protected routes: must be logged in */}
                        <Route path="/CoachDashboard"  element={<ProtectedRoute allowedRoles={['coach']}><CoachDashboard /></ProtectedRoute>} />
                        <Route path="/CoachCalendar"   element={<ProtectedRoute allowedRoles={['coach']}><CoachCalendar /></ProtectedRoute>} />
                        <Route path="/PlayerProfile"   element={<ProtectedRoute allowedRoles={['coach']}><PlayerProfile /></ProtectedRoute>} />
                        <Route path="/DrillLibrary"    element={<ProtectedRoute allowedRoles={['coach']}><DrillLibrary /></ProtectedRoute>} />
                        <Route path="/Testing"         element={<ProtectedRoute allowedRoles={['coach']}><Testing /></ProtectedRoute>} />
                        <Route path="/OtherUsers"      element={<ProtectedRoute allowedRoles={['coach']}><OtherUsers /></ProtectedRoute>} />

                        <Route path="/PlayerDashboard" element={<ProtectedRoute allowedRoles={['player']}><PlayerDashboard /></ProtectedRoute>} />
                        <Route path="/PlayerCalendar"  element={<ProtectedRoute allowedRoles={['player']}><PlayerCalendar /></ProtectedRoute>} />
                        <Route path="/SessionFeedback" element={<ProtectedRoute allowedRoles={['player']}><SessionFeedback /></ProtectedRoute>} />
                        <Route path="/PlayerFeedbackSummary" element={<ProtectedRoute allowedRoles={['player']}><FeedbackSummary /></ProtectedRoute>} />
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