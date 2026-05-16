import { DROPDOWN_INPUT, LOADING_OVERLAY, TYPING_INPUT } from '../Components/SharedComponents.jsx';
import { CALENDAR, DRAGGABLE_AVAILABILITY, DRAGGABLE_SESSION, PEOPLE_SELECTOR } from '../Components/CoachCalendarComponents.jsx';
import { USERS_LIST, OTHER_CALENDARS, SESSION_DETAILS_DRILLS } from '../Components/OtherUsersComponents.jsx';
import { useState, useRef, useEffect } from 'react';

import { createClient } from '@supabase/supabase-js';
import { DateTime, Duration } from 'luxon';
const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY);

export default function CoachCalendar() {
    const sessionEditorRef = useRef(null);
    const calendarRef = useRef(null);
    const [showSessionDetails, setShowSessionDetails] = useState(false);
    const [selectedSession, setSelectedSession] = useState(null);

    const [calendarEvents, setCalendarEvents] = useState([]);

    const [coaches, setCoaches] = useState([]);
    const [players, setPlayers] = useState([]);

    const [selectedSessionPeople, setSelectedSessionPeople] = useState([]);
    const [selectedSessionPlayers, setSelectedSessionPlayers] = useState([]);
    const [selectedSessionCoaches, setSelectedSessionCoaches] = useState([]);
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

    const [tempSession, setTempSession] = useState(null);

    useEffect(() => {
    const loadSessionData = async () => {
        if (selectedSession) {
            setIsDataLoading(true);

            fetchSelectedSessionPeople();
            fetchSelectedSessionDrills();

            setTempSession({
                id: selectedSession.id,
                name: selectedSession.title,
                duration: selectedSession.extendedProps.duration,
                notes: selectedSession.extendedProps.notes,
                selectedCoaches: selectedSessionCoaches, 
                selectedPlayers: selectedSessionPlayers 
            });
        } else {
            setTempSession(null);
        }
        setIsDataLoading(false);
    };

    loadSessionData();
}, [selectedSession]);

    const handleDateChange = (start, end) => { 
        setWeekStart(DateTime.fromJSDate(start));
        setWeekEnd(DateTime.fromJSDate(end));
    };

    async function fetchCalendarData() {
        if (!selectedUser) return;
        setIsDataLoading(true);

        let sessionEvents = [];
        
        const { data, error } = await supabase
            .from('sessions')
            .select(`
                *,
                session_people!inner(user_id)
            `)
            .eq('session_people.user_id', selectedUser);

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
                        notes: ses.notes
                    }
                }
            });
        }

        // set copies of the events to the calendar
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
            
            {/* User selector */}
            <div class="content-box" id="details-box">
                <h2 class="content-header">Users</h2>
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
                                    className={`user-filter-btn ${searchFilter === 'coaches' ? 'active' : ''}`}
                                >Coach</button>
                                <button 
                                    onClick={() => setSearchFilter("players")}
                                    className={`user-filter-btn ${searchFilter === 'players' ? 'active' : ''}`}
                                >Player</button>
                                <button
                                    class="user-filter-btn"
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

            {/* Calendar */}
            <div class="content-box" id="calendar-box">
                <CALENDAR 
                    events={calendarEvents}
                    activeStart={weekStart} activeEnd={weekEnd}
                    onDateChange={handleDateChange}
                    onSessionClick = {(eventData) => {
                        setSelectedSession(eventData);
                        setShowSessionDetails(true);
                    }}

                    selectedSession={selectedSession}

                    isMobile={isMobile}

                    ref={calendarRef}
                />
            </div>
            
            {/* Session editor */}
            { selectedSession && showSessionDetails && !isMobile && (
                <div 
                    id="session-details-container" 
                    onClick={(e) => {
                        if (sessionEditorRef.current && !sessionEditorRef.current.contains(e.target)) {
                            setShowSessionDetails(false);
                            setSelectedSession(null);
                        }
                    }}
                >
                    <div id="session-details" ref={sessionEditorRef}>
                            <div id="session-details-top-left">
                                <h2 id="session-details-header">Session Details</h2>
                            </div>
                            <div id="session-details-top-right">
                                <button id="close-session-details" onClick={() => {
                                    setShowSessionDetails(false);
                                    setSelectedSession(null);
                                }}>Close</button>
                            </div>

                            <div id="session-details-middle-left">
                                <div class="input-container">
                                    <span class="input-container-label">NAME</span>
                                    <div class="input-box-wrapper">{selectedSession.title}</div>
                                </div>
                                <div class="input-container">
                                    <span class="input-container-label">NOTES</span>
                                    <div class="input-box-wrapper">{selectedSession.extendedProps.notes}</div>
                                </div>
                            </div>

                            <div id="session-details-middle-middle">
                                <div class="input-container" id="session-details-people-container">
                                    <span class="input-container-label">PEOPLE</span>
                                    <div id="session-details-people">
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

                            <div id="session-details-middle-right">
                                <div class="input-container" id="session-details-drills-container">
                                    <span class="input-container-label">DRILLS</span>
                                    <div id="session-details-drills">
                                        <SESSION_DETAILS_DRILLS
                                            selectedDrills={selectedSessionDrills}
                                        />
                                    </div>
                                </div>
                            </div>
                    </div>
                </div>
            )}

            {isMobile && showSessionDetails && selectedSession && (
                <div id="mobile-session-editor-container">
                    <div id="mobile-session-editor">
                        <h2 class="content-header">Session Details</h2>
                        <TYPING_INPUT 
                            label="NAME *" 
                            num_rows="1" 
                            input_id="session-name-creator" 
                            box_w="100%" box_h="30px" 
                            sample_txt="Session name"
                            value={tempSession?.name || ""}
                            onChange={(val) => 
                                setTempSession({ ...tempSession, name: val })
                            }
                            id="session-editor-name"
                        />

                        <TYPING_INPUT 
                            label="NOTES" 
                            num_rows="6" 
                            input_id="session-notes-creator" 
                            box_w="100%" box_h="80px" 
                            sample_txt="Session notes" 
                            value={tempSession?.notes || ""}
                            onChange={(val) => 
                                setTempSession({ ...tempSession, notes: val })
                            }
                            id="session-editor-notes"
                        />

                        <div class="input-container">
                            <span class="input-container-label">TIMES *</span>
                            <div id="mobile-session-editor-times">
                                <div class="mobile-session-creator-times-container">
                                    <p>Start</p>
                                    <select
                                        value={selectedSession.start}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            setMobileSessionStart(val);
                                            updateSessionField('sessionStart', val);
                                        }}
                                    >
                                        {mobileSessionCreatorTimes.map(time => (
                                            <option
                                                key={time.name}
                                                value={time.val}
                                            >
                                                {time.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div class="mobile-session-creator-times-container">
                                    <p>End</p>
                                    <select
                                        value={selectedSession.end}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            setMobileSessionEnd(val);
                                            updateSessionField('sessionEnd', val);
                                        }}
                                    >
                                        {validEndTimes.map(time => (
                                            <option
                                                key={time.name}
                                                value={time.val}
                                            >
                                                {time.name}
                                            </option>
                                            
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
            
                        <div class="input-container" >
                            <span class="input-container-label">PEOPLE *</span>
                            <div id="session-editor-people">
                                <PEOPLE_SELECTOR 
                                    role="COACHES" people={coaches} 
                                    selectedPeople={editedSessionCoaches} 
                                    setSelectedPeople={setEditedSessionCoaches}  
                                />
                                <PEOPLE_SELECTOR 
                                    role="PLAYERS" people={players} 
                                    selectedPeople={editedSessionPlayers} 
                                    setSelectedPeople={setEditedSessionPlayers} 
                                />
                            </div>
                        </div>

                        <div class="input-container">
                            <span class="input-container-label">DRILLS</span>
                            <div id="session-editor-drills">
                                <SESSION_CREATOR_DRILLS
                                    selectedDrills={selectedSessionDrills}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}