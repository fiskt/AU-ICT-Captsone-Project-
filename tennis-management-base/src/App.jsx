import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import Login from './pages/Login'
import Register from './pages/Register'
import CoachCalendar from './pages/CoachCalendar'
import CoachDashboard from './pages/CoachDashboard'
import PlayerCalendar from './pages/PlayerCalendar'
import PlayerDashboard from './pages/PlayerDashboard'
import PlayerProfile from './pages/PlayerProfile'

function App() {
  return (
    <BrowserRouter>
      <nav>
        <Link to="/">Home</Link> | <Link to="/CoachDashboard">Coach Dashboard</Link>
      </nav>

      <Routes>
        <Route path="/" element={<div>Welcome to the Home Page</div>} />
        <Route path="/CoachDashboard" element={<CoachDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App