import '../App.css';
import { useNavigate, useLocation } from 'react-router-dom';
import { useState } from 'react';

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

// ── ICONS ─────────────────────────────────────────────────────────────────────
const Icons = {
    dashboard: (
        <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
    ),
    calendar: (
        <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
    ),
    players: (
        <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0" />
        </svg>
    ),
    drills: (
        <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
    ),
    load: (
        <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
    ),
    testing: (
        <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
    ),
    users: (
        <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
    ),
    hamburger: (
        <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
    ),
    close: (
        <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
    ),
};

// ── SIDEBAR SECTION LABEL ─────────────────────────────────────────────────────
function NAV_SECTION_LABEL({ label }) {
    return <div className="sidebar-section-label">{label}</div>;
}

// ── SIDEBAR BUTTON ────────────────────────────────────────────────────────────
function SIDEBAR_BUTTON({ label, path, icon }) {
    const navigate = useNavigate();
    const location = useLocation();
    const isActive = location.pathname === path;

    return (
        <div
            className={`sidebar-nav-btn ${isActive ? 'btn-active' : ''}`}
            onClick={() => navigate(path)}
        >
            {icon && <span className="sidebar-nav-btn-icon">{icon}</span>}
            <span className="sidebar-nav-btn-txt">{label}</span>
        </div>
    );
}

// ── COACH SIDEBAR ─────────────────────────────────────────────────────────────
export function COACH_SIDEBAR() {
    const [mobileOpen, setMobileOpen] = useState(false);

    return (
        <>
            {/* Mobile hamburger - hidden on desktop via CSS */}
            <button
                className="sidebar-hamburger"
                onClick={() => setMobileOpen(true)}
                aria-label="Open menu"
            >
                {Icons.hamburger}
            </button>

            {/* Mobile overlay */}
            {mobileOpen && (
                <div
                    className="sidebar-overlay"
                    onClick={() => setMobileOpen(false)}
                />
            )}

            <div id="sidebar" className={mobileOpen ? 'sidebar-mobile-open' : ''}>
                <div id="sidebar-logo">
                    {/* Place your logo at: tennis-management-base/public/hpt.png */}
                    <img
                        src="/hpt.png"
                        alt="HPT"
                        className="sidebar-logo-img"
                        onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                        }}
                    />
                    {/* Fallback shown if logo file not found */}
                    <div className="sidebar-logo-fallback" style={{ display: 'none' }}>
                        <div className="sidebar-logo-icon">HPT</div>
                        <div className="sidebar-logo-text-wrap">
                            <div className="sidebar-logo-name">HPT</div>
                            <div className="sidebar-logo-sub">MANAGEMENT BASE</div>
                        </div>
                    </div>
                    <button
                        className="sidebar-close-btn"
                        onClick={() => setMobileOpen(false)}
                        aria-label="Close menu"
                    >
                        {Icons.close}
                    </button>
                </div>

                <div id="sidebar-nav">
                    <NAV_SECTION_LABEL label="MAIN" />
                    <SIDEBAR_BUTTON label="Dashboard"    path="/CoachDashboard" icon={Icons.dashboard} />
                    <SIDEBAR_BUTTON label="Calendar"     path="/CoachCalendar"  icon={Icons.calendar}  />
                    <SIDEBAR_BUTTON label="Players"      path="/PlayerProfile"  icon={Icons.players}   />
                    <SIDEBAR_BUTTON label="Drill Library" path="/DrillLibrary"  icon={Icons.drills}    />
                    <SIDEBAR_BUTTON label="Load Tracking" path="/LoadTracking"  icon={Icons.load}      />
                    <SIDEBAR_BUTTON label="Testing"      path="/Testing"        icon={Icons.testing}   />
                    <SIDEBAR_BUTTON label="Other Users"  path="/OtherUsers"     icon={Icons.users}     />
                </div>

                <div id="sidebar-bottom">
                    <div className="sidebar-user-card">
                        <div className="sidebar-avatar">KG</div>
                        <div className="sidebar-user-info">
                            <div className="sidebar-user-name">Kent Green</div>
                            <div className="sidebar-user-role">Administrator</div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

// ── PLAYER SIDEBAR ────────────────────────────────────────────────────────────
export function PLAYER_SIDEBAR() {
    const [mobileOpen, setMobileOpen] = useState(false);

    return (
        <>
            <button
                className="sidebar-hamburger"
                onClick={() => setMobileOpen(true)}
                aria-label="Open menu"
            >
                {Icons.hamburger}
            </button>

            {mobileOpen && (
                <div
                    className="sidebar-overlay"
                    onClick={() => setMobileOpen(false)}
                />
            )}

            <div id="sidebar" className={mobileOpen ? 'sidebar-mobile-open' : ''}>
                <div id="sidebar-logo">
                    <img
                        src="/hpt.png"
                        alt="HPT"
                        className="sidebar-logo-img"
                        onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                        }}
                    />
                    <div className="sidebar-logo-fallback" style={{ display: 'none' }}>
                        <div className="sidebar-logo-icon">HPT</div>
                        <div className="sidebar-logo-text-wrap">
                            <div className="sidebar-logo-name">HPT</div>
                            <div className="sidebar-logo-sub">MANAGEMENT BASE</div>
                        </div>
                    </div>
                    <button
                        className="sidebar-close-btn"
                        onClick={() => setMobileOpen(false)}
                    >
                        {Icons.close}
                    </button>
                </div>

                <div id="sidebar-nav">
                    <NAV_SECTION_LABEL label="MAIN" />
                    <SIDEBAR_BUTTON label="Dashboard" path="/PlayerDashboard" icon={Icons.dashboard} />
                    <SIDEBAR_BUTTON label="Calendar"  path="/PlayerCalendar"  icon={Icons.calendar}  />
                </div>

                <div id="sidebar-bottom">
                    <div className="sidebar-user-card">
                        <div className="sidebar-avatar">P</div>
                        <div className="sidebar-user-info">
                            <div className="sidebar-user-name">Player</div>
                            <div className="sidebar-user-role">Athlete</div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

// ── TOPBAR ────────────────────────────────────────────────────────────────────
export function TOPBAR() {
    return (
        <div id="topbar">
        </div>
    );
}

// ── TYPING INPUT ──────────────────────────────────────────────────────────────

export function TYPING_INPUT({ label, num_rows, input_id, box_w, box_h, sample_txt, value, onChange }) {
    const multiline = num_rows > 1;
    const size = { width: box_w, height: box_h };
    return (
        <div className="input-container">
            <span className="input-container-label">{label}</span>
            <div className="input-box-wrapper" style={size}>
                {multiline ? (
                    <textarea
                        className="typing-textarea-box"
                        id={input_id}
                        rows={num_rows}
                        placeholder={sample_txt}
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                    />
                ) : (
                    <input
                        className="typing-input-box"
                        id={input_id}
                        placeholder={sample_txt}
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                    />
                )}
            </div>
        </div>
    );
}

// ── DROPDOWN INPUT ────────────────────────────────────────────────────────────
// Preserved exactly from team's version
export function DROPDOWN_INPUT({ label, input_id, box_w, box_h, options, value, onChange }) {
    const size = { width: box_w, height: box_h };
    return (
        <div className="input-container">
            <span className="input-container-label">{label}</span>
            <div className="input-box-wrapper" style={size}>
                <select
                    className="select-input-box"
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

// ── LOADING OVERLAY ───────────────────────────────────────────────────────────

export function LOADING_OVERLAY({ caption }) {
    return (
        <div className="loading-overlay">
            <div className="loading-overlay-spinner"></div>
            <span className="loading-overlay-caption">Loading {caption} ...</span>
        </div>
    );
}
