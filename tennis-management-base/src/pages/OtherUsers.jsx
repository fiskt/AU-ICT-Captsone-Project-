import { DROPDOWN_INPUT, LOADING_OVERLAY, TYPING_INPUT } from '../Components/SharedComponents.jsx';
import { CALENDAR, DRAGGABLE_SESSION, PEOPLE_SELECTOR } from '../Components/CoachCalendarComponents.jsx';
import { USERS_LIST, OTHER_CALENDARS, SESSION_DETAILS_DRILLS } from '../Components/OtherUsersComponents.jsx';
import { useState, useRef, useEffect } from 'react';

import { createClient } from '@supabase/supabase-js';
import { DateTime, Duration } from 'luxon';
const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY);

export default function CoachCalendar() {
    const sessionDetailsRef = useRef(null);
    const calendarRef = useRef(null);
    const [showSessionDetails, setShowSessionDetails] = useState(false);
    const [showCollapsedUsers, setShowCollapsedUsers] = useState(false);
    const [selectedSession, setSelectedSession] = useState(null);

    const [calendarEvents, setCalendarEvents] = useState([]);

    const [coaches, setCoaches] = useState([]);
    const [players, setPlayers] = useState([]);

    const [selectedSessionPeople, setSelectedSessionPeople] = useState([]);
    const [selectedSessionDrills, setSelectedSessionDrills] = useState([]);

    // detecting mobile window size
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 768);
        };

        window.addEventListener('resize', handleResize);
    
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        const calendarApi = calendarRef.current?.getApi();
        if (!calendarApi) return;

        calendarApi.changeView(isMobile ? "timeGridDay" : "dayGridMonth");
        calendarApi.updateSize();
    }, [isMobile]);

    useEffect(() => {
        if (!isMobile) {
            setShowCollapsedUsers(false);
        }
    }, [isMobile]);


    // filtering and searching users
    const [searchQuery, setSearchQuery] = useState("");
    const [searchFilter, setSearchFilter] = useState("all");

    const [filteredCoaches, setFilteredCoaches] = useState([]);
    const [filteredPlayers, setFilteredPlayers] = useState([]);

    useEffect(() => {
        const q = searchQuery.toLowerCase().trim();

        if (q === "" && searchFilter === "all") {
            setFilteredCoaches(coaches);
            setFilteredPlayers(players);
            return;
        }

        const showCoaches = searchFilter === "all" || searchFilter === "coaches";
        if (showCoaches) {
            // array for all names that match what the user has searched
            const matchesQuery = coaches.filter(coach => {
                const fullName = `${coach.first_name} ${coach.last_name}`.toLowerCase();
                return fullName.includes(q);
            });
            setFilteredCoaches(matchesQuery);
        } else {
            setFilteredCoaches([]);
        }

        // same thing for players
        const showPlayers = searchFilter === "all" || searchFilter === "players";
        if (showPlayers) {
            const matchesQuery = players.filter(player => {
                const fullName = `${player.first_name} ${player.last_name}`.toLowerCase();
                return fullName.includes(q);
            });
            setFilteredPlayers(matchesQuery);
        } else {
            setFilteredPlayers([]);
        }
    }, [searchQuery, searchFilter, coaches, players]);

    const [selectedUser, setSelectedUser] = useState();

    async function fetchSelectedSessionPeople() {
        const { data, error } = await supabase
            .from('signin_details')
            .select(`
                *,
                session_people!inner(session_id)
            `)
            .eq('session_people.session_id', selectedSession.id);

        if (!error) {
            setSelectedSessionPeople(data);
        }
    }

    async function fetchPlayers() {
        const { data, error } = await supabase
            .from('signin_details')
            .select('*')
            .eq('role', 'player');

        if (error) {
            console.log("Error when fetching players: ", error.message);
            setPlayers([]);
        } else {
            setPlayers(data);
            console.log("players", players);
        }
    }

    async function fetchCoaches() {
        const { data, error } = await supabase
            .from('signin_details')
            .select('*')
            .eq('role', 'coach');

        if (error) {
            console.log("Error when fetching coaches: ", error.message);
            setCoaches([]);
        } else {
            setCoaches(data);
            console.log("coaches", coaches);
        }
    }

    async function fetchSelectedSessionDrills() {
        const { data, error } = await supabase
            .from('drill_library')
            .select(`
                *, 
                session_drills!inner(session_id)
            `)
            .eq('session_drills.session_id', selectedSession.id);

        if (!error) {
            setSelectedSessionDrills(data);
        }
    }

    // loading screen appears when data isnt fully loaded
    const [isDataLoading, setIsDataLoading] = useState(true);

    const [weekStart, setWeekStart] = useState(DateTime.now().startOf('week'));
    const [weekEnd, setWeekEnd] = useState(DateTime.now().endOf('week'));

    const handleDateChange = (start, end) => { 
        setWeekStart(DateTime.fromJSDate(start));
        setWeekEnd(DateTime.fromJSDate(end));
    };

    async function fetchCalendarData() {
        if (!selectedUser) return;
        setIsDataLoading(true);

        let sessionEvents = [];
        console.log("selected user: ", selectedUser);
        
        const { data, error } = await supabase
            .from('sessions')
            .select(`
                *,
                session_people!inner(user_id)
            `)
            .eq('session_people.user_id', selectedUser.id);

        if (!error) {
            sessionEvents = (data || []).map(ses => {
                const startTime = DateTime.fromISO(ses.start_datetime);
                const endTime = DateTime.fromISO(ses.end_datetime);
                const duration = Duration.fromISOTime(ses.duration);
                return {
                    id: ses.id,
                    title: ses.name,
                    start: startTime.toISO(),
                    end: endTime.toISO(),
                    extendedProps: {
                        type: 'session',
                        duration: duration,
                        rpe: ses.rpe,
                        notes: ses.notes
                    }
                }
            });
        }

        setCalendarEvents(sessionEvents);
        setIsDataLoading(false);
    }

    useEffect(() => {
        if (selectedUser) {
            fetchCalendarData();
        } else {
            setCalendarEvents([]);
        }
    }, [selectedUser]);

    useEffect(() => {
        const fetchData = async () => {
            await Promise.all([
                fetchSelectedSessionPeople(),
                fetchSelectedSessionDrills()
            ]);
        };
        if (selectedSession) {
            fetchData();
        }
    }, [fetchSelectedSessionPeople, fetchSelectedSessionDrills]);

    useEffect(() => {
        const initializeUsers = async () => {
            setIsDataLoading(true);
            await Promise.all([
                fetchCoaches(),
                fetchPlayers()
            ]);
            setIsDataLoading(false);
        };

        initializeUsers();
    }, []);

    return (
        <>
            {/* Loading overlay */}
            {isDataLoading && <LOADING_OVERLAY caption={"session data"}/>}
            <div id="other-users-page">
            <div>
                <h2 className="content-header" style={{ padding: 0, marginBottom: '4px' }}>Other Users</h2>
                <p style={{
                    fontFamily: "'DM Sans Light', sans-serif",
                    fontSize: '13px',
                    color: 'var(--content-subhead-color)',
                    textAlign: 'left'
                }}>
                    Calendars and schedules for other users.
                </p>
            </div>

            {/* Session details */}
                { !showCollapsedUsers && selectedSession && showSessionDetails && !isMobile && (
                    <div 
                        class="session-details-container" 
                        onClick={(e) => {
                            if (sessionDetailsRef.current && !sessionDetailsRef.current.contains(e.target)) {
                                setShowSessionDetails(false);
                                setSelectedSession(null);
                            }
                        }}
                    >
                        <div class="session-details" ref={sessionDetailsRef}>
                            <div class="session-details-top-left">
                                <h2 class="session-details-header">Session Details</h2>
                            </div>
                            <div class="session-details-top-right">
                                <button 
                                    class="drill-icon-btn"
                                    onClick={() => {
                                        setShowSessionDetails(false);
                                        setSelectedSession(null);
                                    }}
                                >
                                    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            <div class="session-details-middle-left">
                                <div class="input-container">
                                    <span class="input-container-label">NAME</span>
                                    <div class="input-box-wrapper session-details-name">{selectedSession.title}</div>
                                </div>
                                <div class="input-container">
                                    <span class="input-container-label">RPE</span>
                                    <div class="input-box-wrapper session-details-rpe">{selectedSession.extendedProps.rpe}</div>
                                </div>
                                {selectedSession.extendedProps.notes.length > 0 && (
                                    <div class="input-container">
                                        <span class="input-container-label">NOTES</span>
                                        <div class="input-box-wrapper session-details-notes">{selectedSession.extendedProps.notes}</div>
                                    </div>
                                )}
                            </div>
                            <div class="session-details-middle-middle">
                                <div class="input-container session-details-people-container">
                                    <span class="input-container-label">PEOPLE</span>
                                    <div class="session-details-people">
                                        <div>Coaches</div>
                                        <ul>
                                            {selectedSessionPeople
                                                .filter(coach => coach.role === 'coach')
                                                .map(coach => (
                                                    <li key={coach.id}>{coach.first_name} {coach.last_name}</li>
                                                ))
                                            }
                                        </ul>
                                        <div>Players</div>
                                        <ul>
                                            {selectedSessionPeople
                                                .filter(player => player.role === 'player')
                                                .map(player => (
                                                    <li key={player.id}>{player.first_name} {player.last_name}</li>
                                                ))
                                            }
                                        </ul>
                                    </div>
                                </div>
                            </div>

                            <div class="session-details-middle-right">
                                <div class="input-container session-details-drills-container">
                                    <span class="input-container-label">DRILLS</span>
                                    <div class="session-details-drills">
                                        {selectedSessionDrills.length > 0 && (
                                            <SESSION_DETAILS_DRILLS
                                                selectedDrills={selectedSessionDrills}
                                            />
                                        )} {selectedSessionDrills.length === 0 && (
                                            <span>No drills selected for this session.</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                { isMobile && showSessionDetails && selectedSession && (
                    <div class="mobile-session-details-container"
                        onClick={(e) => {
                            if (sessionDetailsRef.current && !sessionDetailsRef.current.contains(e.target)) {
                                setShowSessionDetails(false);
                                setSelectedSession(null);
                            }
                        }}
                    >
                        <div class="mobile-session-details" ref={sessionDetailsRef}>
                            <div class="mobile-session-details-top">
                                <h2 class="content-header">Session Details</h2>
                            </div>

                            <div class="input-container">
                                <span class="input-container-label">NAME</span>
                                <div class="input-box-wrapper session-details-name">{selectedSession.title}</div>
                            </div>
                            <div class="input-container">
                                <span class="input-container-label">RPE</span>
                                <div class="input-box-wrapper session-details-rpe">{selectedSession.extendedProps.rpe}</div>
                            </div>
                            <div class="input-container">
                                <span class="input-container-label">NOTES</span>
                                <div class="input-box-wrapper session-details-notes">{selectedSession.extendedProps.notes}</div>
                            </div>

                            <div class="input-container mobile-session-details-people-container">
                                <span class="input-container-label">PEOPLE</span>
                                <div class="mobile-session-details-people">
                                    <div>Coaches</div>
                                    <ul>
                                        {selectedSessionPeople
                                            .filter(coach => coach.role === 'coach')
                                            .map(coach => (
                                                <li key={coach.id}>{coach.first_name} {coach.last_name}</li>
                                            ))
                                        }
                                    </ul>
                                    <div>Players</div>
                                    <ul>
                                        {selectedSessionPeople
                                            .filter(player => player.role === 'player')
                                            .map(player => (
                                                <li key={player.id}>{player.first_name} {player.last_name}</li>
                                            ))
                                        }
                                    </ul>
                                </div>
                            </div>

                            <div class="input-container session-details-drills-container">
                                <span class="input-container-label">DRILLS</span>
                                <div class="session-details-drills">
                                    {selectedSessionDrills.length > 0 && (
                                        <SESSION_DETAILS_DRILLS
                                            selectedDrills={selectedSessionDrills}
                                        />
                                    )} {selectedSessionDrills.length === 0 && (
                                        <span>No drills selected for this session.</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

            <div id="other-users-main-panel">
                {/* User selector */}
                { !showCollapsedUsers && (
                    <div class="content-box" id='user-selector'>
                        <div class="user-selector-top">
                            <h2 class="content-header">Users</h2>
                            { isMobile && (
                                <button
                                    className='drill-btn'
                                    onClick={() => setShowCollapsedUsers(true)}
                                >Show Less</button>
                            )}
                        </div>
                        <div class="content-box-top">
                            <div id="user-filter-container">
                                <div class="content-box-middle">
                                    <input
                                        class="typing-input-box"
                                        placeholder='Search user'
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    >
                                    </input>
                                </div>
                                <div class="content-box-bottom" id="users-filter-btn">
                                        <button 
                                            onClick={() => setSearchFilter("coaches")}
                                            className={`user-filter-btn drill-btn drill-btn-secondary ${searchFilter === 'coaches' ? 'active' : ''}`}
                                        >Coach</button>
                                        <button 
                                            onClick={() => setSearchFilter("players")}
                                            className={`user-filter-btn drill-btn drill-btn-secondary ${searchFilter === 'players' ? 'active' : ''}`}
                                        >Player</button>
                                        <button
                                            className="drill-btn user-filter-btn"
                                            onClick={() => {
                                                setSearchFilter("all");
                                                setSearchQuery("");
                                            }}
                                        >Reset</button>
                                </div>
                            </div>
                        </div>
                        <div class="content-box-middle">
                            <USERS_LIST 
                                coaches={filteredCoaches} players={filteredPlayers} 
                                selectedUser={selectedUser}
                                setSelectedUser={setSelectedUser} 
                            />
                        </div>
                    </div> 
                )}

                { showCollapsedUsers && isMobile && (
                    <div class="content-box" id='collapsed-users'>
                        <div class="user-selector-top">
                            <h2 class="content-header">Users</h2>
                                <button
                                    className='drill-btn'
                                    onClick={() => setShowCollapsedUsers(false)}
                                >Show More</button>
                        </div>
                        <ul class="user-list">
                            <li
                                key={selectedUser?.id}
                                className={`${selectedUser ? 'active' : ''}`}
                            >
                                <span>{`
                                    ${selectedUser 
                                        ? `${selectedUser.first_name} ${selectedUser.last_name}`
                                        : 'Select a user'
                                    }
                                `}
                                </span>
                            </li>
                        </ul>
                    </div> 
                )}

                {/* Calendar */}
                <div class="content-box" id="calendar-box">
                    <OTHER_CALENDARS 
                        events={calendarEvents}
                        activeStart={weekStart} activeEnd={weekEnd}
                        onDateChange={handleDateChange}
                        onSessionClick = {(eventData) => {
                            setSelectedSession(eventData);
                            setShowSessionDetails(true);
                        }}

                        selectedSession={selectedSession}

                        selectedUser={selectedUser}

                        isMobile={isMobile}

                        ref={calendarRef}
                    />
                </div>
            </div>
            </div>
        </>
    );
}