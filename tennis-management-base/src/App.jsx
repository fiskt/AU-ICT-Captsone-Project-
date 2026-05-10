import { BrowserRouter, Routes, Route } from 'react-router-dom';

import Layout from './Components/LoginRegisterComponents';
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
      <Routes>        
        <Route path="/Login" element={<Login />} />
        <Route path="/Register" element={<Register />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;