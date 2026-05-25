import '../App.css';
import { useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';

// ── CURRENT USER HOOK ─────────────────────────────────────────────────────────
function useCurrentUser() {
    const [user, setUser] = useState(null);

    useEffect(() => {
        const load = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            const firstName = user.user_metadata?.first_name || '';
            const lastName  = user.user_metadata?.last_name  || '';
            const role      = user.user_metadata?.role       || '';
            const initials  = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || '?';
            setUser({ firstName, lastName, role, initials, fullName: `${firstName} ${lastName}`.trim() });
        };
        load();
    }, []);

    return user;
}

// ── USER CARD (with logout dropup) ────────────────────────────────────────────
function USER_CARD() {
    const navigate = useNavigate();
    const user = useCurrentUser();
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        const handler = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/Login');
    };

    const roleLabel = user?.role === 'coach' ? 'Coach' : user?.role === 'player' ? 'Athlete' : '';

    return (
        <div ref={ref} style={{ position: 'relative' }}>
            {/* Logout dropup */}
            {open && (
                <div style={{
                    position: 'absolute',
                    bottom: 'calc(100% + 6px)',
                    left: 0, right: 0,
                    backgroundColor: '#222120',
                    border: '1px solid #3a3835',
                    borderRadius: '7px',
                    overflow: 'hidden',
                    boxShadow: '0 -4px 16px rgba(0,0,0,0.5)',
                    zIndex: 200,
                }}>
                    <div
                        onClick={handleLogout}
                        style={{
                            padding: '10px 14px',
                            color: '#f87171',
                            fontSize: '13px',
                            fontFamily: 'DM Sans Light, sans-serif',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            transition: 'background 0.15s',
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3a2020'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                        <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Log out
                    </div>
                </div>
            )}

            {/* User card — click to toggle dropup */}
            <div
                className="sidebar-user-card"
                onClick={() => setOpen(!open)}
                style={{
                    cursor: 'pointer',
                    userSelect: 'none',
                    padding: '3px 10px',
                    margin: '3px 7px',
                    borderRadius: '7px',
                    transition: 'background 0.2s',
                    justifyContent: 'space-between',
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.06)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div className="sidebar-avatar">{user?.initials || '?'}</div>
                    <div className="sidebar-user-info">
                        <div className="sidebar-user-name">{user?.fullName || 'Loading...'}</div>
                        <div className="sidebar-user-role">{roleLabel}</div>
                    </div>
                </div>
                <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px', flexShrink: 0 }}>
                    {open ? '▲' : '▼'}
                </span>
            </div>
        </div>
    );
}

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
    eye: (
        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
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

// ── SIDEBAR BUTTON ────────────────────────────────────────────────────────────
function SIDEBAR_BUTTON({ label, path, icon, closeMobileSidebar }) {
    const navigate = useNavigate();
    const location = useLocation();
    const isActive = location.pathname === path;

    return (
        <div
            className={`sidebar-nav-btn ${isActive ? 'btn-active' : ''}`}
            onClick={() => {
                navigate(path);
                closeMobileSidebar(false);
            }}
        >
            {icon && <span className="sidebar-nav-btn-icon">{icon}</span>}
            <span className="sidebar-nav-btn-txt">{label}</span>
        </div>
    );
}

// ── PREVIEW BUTTON ────────────────────────────────────────────────────────────
function PREVIEW_BTN() {
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);
    const [players, setPlayers] = useState([]);
    const [loading, setLoading] = useState(false);
    const ref = useRef(null);

    // Fetch players when opened
    useEffect(() => {
        if (!open) return;
        const fetch = async () => {
            setLoading(true);
            const { data, error } = await supabase
                .from('signin_details')
                .select('id, first_name, last_name')
                .eq('role', 'player')
                .order('first_name', { ascending: true });
            if (!error && data) setPlayers(data);
            setLoading(false);
        };
        fetch();
    }, [open]);

    // Close on outside click
    useEffect(() => {
        const handler = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const handleSelect = (player) => {
        setOpen(false);
        navigate('/PlayerDashboard', {
            state: {
                isCoachPreview: true,
                previewPlayer: `${player.first_name} ${player.last_name}`,
                previewPlayerId: player.id,
            },
        });
    };

    return (
        <div ref={ref} style={{ position: 'relative' }}>

            {/* Dropup */}
            {open && (
                <div style={{
                    position: 'absolute',
                    bottom: 'calc(100% + 6px)',
                    left: 0, right: 0,
                    backgroundColor: '#222120',
                    border: '1px solid #3a3835',
                    borderRadius: '7px',
                    overflow: 'hidden',
                    boxShadow: '0 -4px 16px rgba(0,0,0,0.5)',
                    zIndex: 200,
                    maxHeight: '240px',
                    overflowY: 'auto',
                }}>
                    <p style={{
                        margin: 0, padding: '7px 12px',
                        fontSize: '11px', color: '#6B6760',
                        fontFamily: 'DM Mono Light, sans-serif',
                        borderBottom: '1px solid #3a3835',
                        letterSpacing: '0.05em',
                    }}>
                        SELECT PLAYER
                    </p>

                    {loading && (
                        <p style={{ margin: 0, padding: '10px 12px', fontSize: '13px', color: '#FFFFFF50', fontFamily: 'DM Sans Light, sans-serif' }}>
                            Loading...
                        </p>
                    )}

                    {!loading && players.length === 0 && (
                        <p style={{ margin: 0, padding: '10px 12px', fontSize: '13px', color: '#FFFFFF50', fontFamily: 'DM Sans Light, sans-serif' }}>
                            No players found
                        </p>
                    )}

                    {!loading && players.map((player) => (
                        <div
                            key={player.id}
                            onClick={() => handleSelect(player)}
                            style={{
                                padding: '9px 12px',
                                color: '#FFFFFF90',
                                fontSize: '13px',
                                fontFamily: 'DM Sans Light, sans-serif',
                                cursor: 'pointer',
                                borderBottom: '1px solid #2a2825',
                                transition: 'background 0.15s',
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#EC784230'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                            {player.first_name} {player.last_name}
                        </div>
                    ))}
                </div>
            )}

            {/* Button */}
            <div
                className={`sidebar-nav-btn ${open ? 'btn-active' : ''}`}
                onClick={() => setOpen(!open)}
                style={{ justifyContent: 'space-between', paddingRight: '10px' }}
            >
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="sidebar-nav-btn-icon">{Icons.eye}</span>
                    <span className="sidebar-nav-btn-txt" style={{ opacity: open ? 1 : 0.7 }}>
                        Preview
                    </span>
                </span>
                <span style={{ color: '#FFFFFF60', fontSize: '10px' }}>
                    {open ? '▲' : '▼'}
                </span>
            </div>
        </div>
    );
}

// ── COACH SIDEBAR ─────────────────────────────────────────────────────────────
export function COACH_SIDEBAR() {
    const [mobileOpen, setMobileOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const sidebarRef = useRef(null);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 768);
        };

        window.addEventListener('resize', handleResize);
    
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return (
        <>
            <button className="sidebar-hamburger" onClick={() => setMobileOpen(true)} aria-label="Open menu">
                {Icons.hamburger}
            </button>

            {mobileOpen && isMobile && (
                <div 
                    className="sidebar-overlay" 
                    onClick={(e) => {
                        if (sidebarRef.current && !sidebarRef.current.contains(e.target)) {
                            setMobileOpen(false);
                        }
                    }}
                >
                    <div className="mobile-sidebar" ref={sidebarRef}>
                        <div className="mobile-sidebar-top">
                            <div id="sidebar-logo">
                            <img src="/logo.png" alt="HPT" className="sidebar-logo-img"
                                onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                            />
                            <div className="sidebar-logo-fallback" style={{ display: 'none' }}>
                                <div className="sidebar-logo-icon">HPT</div>
                                <div className="sidebar-logo-text-wrap">
                                    <div className="sidebar-logo-name">HPT</div>
                                    <div className="sidebar-logo-sub">MANAGEMENT BASE</div>
                                </div>
                            </div>
                            <button className="sidebar-close-btn" onClick={() => setMobileOpen(false)} aria-label="Close menu">
                                {Icons.close}
                            </button>
                        </div>
                        </div>

                        <div className="mobile-sidebar-nav">
                            <SIDEBAR_BUTTON label="Dashboard"           path="/CoachDashboard" icon={Icons.dashboard} closeMobileSidebar={setMobileOpen}/>
                            <SIDEBAR_BUTTON label="Calendar"            path="/CoachCalendar"  icon={Icons.calendar}  closeMobileSidebar={setMobileOpen}/>
                            <SIDEBAR_BUTTON label="Players"             path="/PlayerProfile"  icon={Icons.players}   closeMobileSidebar={setMobileOpen}/>
                            <SIDEBAR_BUTTON label="Drill Library"       path="/DrillLibrary"   icon={Icons.drills}    closeMobileSidebar={setMobileOpen}/>
                            <SIDEBAR_BUTTON label="Performance Testing" path="/Testing"        icon={Icons.testing}   closeMobileSidebar={setMobileOpen}/>
                            <SIDEBAR_BUTTON label="Other Users"         path="/OtherUsers"     icon={Icons.users}     closeMobileSidebar={setMobileOpen}/>
                            <PREVIEW_BTN />
                        </div>

                        <div className="mobile-sidebar-bottom">
                            <USER_CARD />
                        </div>
                    </div>
                </div>
            )}

            {!isMobile && (
                <div id="sidebar" className={mobileOpen ? 'sidebar-mobile-open' : ''}>
                    <div id="sidebar-logo">
                        <img src="/logo.png" alt="HPT" className="sidebar-logo-img"
                            onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                        />
                        <div className="sidebar-logo-fallback" style={{ display: 'none' }}>
                            <div className="sidebar-logo-icon">HPT</div>
                            <div className="sidebar-logo-text-wrap">
                                <div className="sidebar-logo-name">HPT</div>
                                <div className="sidebar-logo-sub">MANAGEMENT BASE</div>
                            </div>
                        </div>
                        <button className="sidebar-close-btn" onClick={() => setMobileOpen(false)} aria-label="Close menu">
                            {Icons.close}
                        </button>
                    </div>

                    <div id="sidebar-nav">
                        <SIDEBAR_BUTTON label="Dashboard"           path="/CoachDashboard" icon={Icons.dashboard} />
                        <SIDEBAR_BUTTON label="Calendar"            path="/CoachCalendar"  icon={Icons.calendar}  />
                        <SIDEBAR_BUTTON label="Players"             path="/PlayerProfile"  icon={Icons.players}   />
                        <SIDEBAR_BUTTON label="Drill Library"       path="/DrillLibrary"   icon={Icons.drills}    />
                        <SIDEBAR_BUTTON label="Performance Testing" path="/Testing"        icon={Icons.testing}   />
                        <SIDEBAR_BUTTON label="Other Users"         path="/OtherUsers"     icon={Icons.users}     />
                        <PREVIEW_BTN />
                    </div>

                    <div id="sidebar-bottom">
                        <USER_CARD />
                    </div>
                </div>
            )}
        </>
    );
}

// ── PLAYER SIDEBAR ────────────────────────────────────────────────────────────
export function PLAYER_SIDEBAR() {
    const [mobileOpen, setMobileOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const sidebarRef = useRef(null);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 768);
        };

        window.addEventListener('resize', handleResize);
    
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return (
        <>
            <button className="sidebar-hamburger" onClick={() => setMobileOpen(true)} aria-label="Open menu">
                {Icons.hamburger}
            </button>

            {mobileOpen && isMobile && (
                <div 
                    className="sidebar-overlay" 
                    onClick={(e) => {
                        if (sidebarRef.current && !sidebarRef.current.contains(e.target)) {
                            setMobileOpen(false);
                        }
                    }}
                >
                    <div className="mobile-sidebar" ref={sidebarRef}>
                        <div className="mobile-sidebar-top">
                            <div id="sidebar-logo">
                            <img src="/logo.png" alt="HPT" className="sidebar-logo-img"
                                onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                            />
                            <div className="sidebar-logo-fallback" style={{ display: 'none' }}>
                                <div className="sidebar-logo-icon">HPT</div>
                                <div className="sidebar-logo-text-wrap">
                                    <div className="sidebar-logo-name">HPT</div>
                                    <div className="sidebar-logo-sub">MANAGEMENT BASE</div>
                                </div>
                            </div>
                            <button className="sidebar-close-btn" onClick={() => setMobileOpen(false)} aria-label="Close menu">
                                {Icons.close}
                            </button>
                        </div>
                        </div>

                        <div className="mobile-sidebar-nav">
                            <SIDEBAR_BUTTON label="Dashboard"       path="/PlayerDashboard" icon={Icons.dashboard} closeMobileSidebar={setMobileOpen}/>
                            <SIDEBAR_BUTTON label="Session Feedback" path="/SessionFeedback" icon={Icons.testing}  closeMobileSidebar={setMobileOpen}/>
                            <SIDEBAR_BUTTON label="Calendar"        path="/PlayerCalendar"  icon={Icons.calendar}  closeMobileSidebar={setMobileOpen}/>
                        </div>

                        <div className="mobile-sidebar-bottom">
                            <USER_CARD />
                        </div>
                    </div>
                </div>
            )}

            {!isMobile && (
                <div id="sidebar" className={mobileOpen ? 'sidebar-mobile-open' : ''}>
                    <div id="sidebar-logo">
                        <img src="/logo.png" alt="HPT" className="sidebar-logo-img"
                            onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                        />
                        <div className="sidebar-logo-fallback" style={{ display: 'none' }}>
                            <div className="sidebar-logo-icon">HPT</div>
                            <div className="sidebar-logo-text-wrap">
                                <div className="sidebar-logo-name">HPT</div>
                                <div className="sidebar-logo-sub">MANAGEMENT BASE</div>
                            </div>
                        </div>
                        <button className="sidebar-close-btn" onClick={() => setMobileOpen(false)}>
                            {Icons.close}
                        </button>
                    </div>

                    <div id="sidebar-nav">
                        <SIDEBAR_BUTTON label="Dashboard"       path="/PlayerDashboard" icon={Icons.dashboard} />
                        <SIDEBAR_BUTTON label="Session Feedback" path="/SessionFeedback" icon={Icons.testing}  />
                        <SIDEBAR_BUTTON label="Calendar"        path="/PlayerCalendar"  icon={Icons.calendar}  />
                    </div>

                    <div id="sidebar-bottom">
                        <USER_CARD />
                    </div>
                </div>
            )}
        </>
    );
}

// ── TOPBAR ────────────────────────────────────────────────────────────────────
export function TOPBAR() {
    return <div id="topbar"></div>;
}

// ── TYPING INPUT ──────────────────────────────────────────────────────────────
export function TYPING_INPUT({ label, num_rows, input_id, box_w, box_h, sample_txt, value, onChange, maxLength, isNumber }) {
    const multiline = num_rows > 1;
    const size = { width: box_w, height: box_h };
    return (
        <div className="input-container">
            <span className="input-container-label">{label}</span>
            <div className="input-box-wrapper" style={size}>
                {multiline ? (
                    <textarea className="typing-textarea-box" id={input_id} rows={num_rows}
                        placeholder={sample_txt} value={value}
                        onChange={(e) => onChange(e.target.value)} maxLength={maxLength} />
                ) : (
                    <input className="typing-input-box" id={input_id}
                        placeholder={sample_txt} value={value}
                        onChange={(e) => onChange(e.target.value)} maxLength={maxLength}
                        type={`${isNumber ? 'number' : 'text'}`}
                    />
                )}
            </div>
        </div>
    );
}

// ── DROPDOWN INPUT ────────────────────────────────────────────────────────────
export function DROPDOWN_INPUT({ label, input_id, box_w, box_h, options, value, onChange }) {
    const size = { width: box_w, height: box_h };
    return (
        <div className="input-container">
            <span className="input-container-label">{label}</span>
            <div className="input-box-wrapper" style={size}>
                <select className="select-input-box" id={input_id} value={value}
                    onChange={(e) => onChange(e.target.value)}>
                    {options.map((op) => (
                        <option key={op.val} value={op.val}>{op.label}</option>
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
