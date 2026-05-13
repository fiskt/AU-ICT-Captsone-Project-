import '../App.css';
import { useNavigate, useLocation } from 'react-router-dom';
import Login from '../pages/Login'
import Register from '../pages/Register'

import CoachDashboard from '../pages/CoachDashboard'
import CoachCalendar from '../pages/CoachCalendar'
import PlayerProfile from '../pages/PlayerProfile'
import DrillLibrary from '../pages/DrillLibrary'
import LoadTracking from '../pages/LoadTracking'
import Testing from '../pages/Testing'
import OtherUsers from '../pages/OtherUsers'

import PlayerCalendar from '../pages/PlayerCalendar'
import PlayerDashboard from '../pages/PlayerDashboard'

function SIDEBAR_BUTTON({ label, path }) {
    const navigate = useNavigate();
    const location = useLocation();
    const isActive = location.pathname === path;

    return (
        <div 
            className={`sidebar-nav-btn ${isActive ? 'btn-active' : ''}`} 
            onClick={()=>navigate(path)}
        >
            <span className="sidebar-nav-btn-txt">{label}</span>
        </div>
    );
}

export function COACH_SIDEBAR() {
    return (
        <div id="sidebar">
            <div id="sidebar-logo"></div>
            <div id="sidebar-nav">
                <SIDEBAR_BUTTON label="Dashboard" path="/CoachDashboard" />
                <SIDEBAR_BUTTON label="Calendar" path="/CoachCalendar" />
                <SIDEBAR_BUTTON label="Players" path="/PlayerProfile" />
                <SIDEBAR_BUTTON label="Drill Library" path="/DrillLibrary" />
                <SIDEBAR_BUTTON label="Testing" path="/Testing" />
                <SIDEBAR_BUTTON label="Other Users" path="/OtherUsers" />
            </div>
            <div id="sidebar-bottom"></div>
        </div>
    );
}

export function PLAYER_SIDEBAR() {
    return (
        <div id="sidebar">
            <div id="sidebar-logo"></div>
            <div id="sidebar-nav">
                <SIDEBAR_BUTTON label="Dashboard" path="/PlayerDashboard" />
                <SIDEBAR_BUTTON label="Calendar" path="/PlayerCalendar" />
            </div>
            <div id="sidebar-bottom"></div>
        </div>
    );
}

export function TOPBAR() {
    return (
        <div id="topbar">
        </div>
    );
}

export function TYPING_INPUT({ label, num_rows, input_id, box_w, box_h, sample_txt, value, onChange }) {
    const multiline = num_rows > 1;
    const size = {width: box_w, height: box_h};
    return (
        <div class="input-container">
            <span class="input-container-label">{label}</span>
            <div class="input-box-wrapper" style={size}>
                {multiline ?
                    (
                        <textarea 
                            class="typing-textarea-box" 
                            id={input_id}
                            rows={num_rows}
                            placeholder={sample_txt}
                            value={value}
                            onChange={(e) => onChange(e.target.value)}
                        />
                    ) : (
                        <input
                            class="typing-input-box"
                            id={input_id}
                            placeholder={sample_txt}
                            value={value}
                            onChange={(e) => onChange(e.target.value)}
                        />
                    )
                }
            </div>
        </div>
    );
}

export function DROPDOWN_INPUT({ label, input_id, box_w, box_h, options, value, onChange }) {
    const size = {width: box_w, height: box_h};
    return (
        <div class="input-container">
            <span class="input-container-label">{label}</span>
            <div class="input-box-wrapper" style={size}>
                <select
                    class="select-input-box"
                    id={input_id}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                >
                    {options.map((op) => (
                        <option key={op.val} value={op.val}>
                            {op.label}
                        </option>
                    ))}
                </select>
            </div>
        </div>
    );
}

export function LOADING_OVERLAY({ caption }) {
    return (
        <div class="loading-overlay">
            <div class="loading-overlay-spinner"></div>
            <span class="loading-overlay-caption">Loading {caption} ...</span>
        </div>
    );
}