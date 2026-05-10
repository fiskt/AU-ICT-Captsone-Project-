import { BrowserRouter, Routes, Route } from 'react-router-dom';

import { COACH_SIDEBAR, TOPBAR } from './Components/SharedComponents';

import Login from './pages/Login';
import Register from './pages/Register';

import CoachCalendar from './pages/CoachCalendar';
import CoachDashboard from './pages/CoachDashboard';
import PlayerProfile from './pages/PlayerProfile';
import DrillLibrary from './pages/DrillLibrary';
import Testing from './pages/Testing';
import OtherUsers from './pages/OtherUsers';

function App() {
  return (
    <BrowserRouter>
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
            </Routes>
          </main>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;