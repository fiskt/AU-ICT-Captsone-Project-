import { DROPDOWN_INPUT, LOADING_OVERLAY, TYPING_INPUT } from '../Components/SharedComponents.jsx';
import { CALENDAR, DRAGGABLE_AVAILABILITY, DRAGGABLE_SESSION, PEOPLE_SELECTOR } from '../Components/CoachCalendarComponents.jsx';
import { USERS_LIST, OTHER_CALENDARS } from '../Components/OtherUsersComponents.jsx';
import { useState, useRef, useEffect } from 'react';

import { createClient } from '@supabase/supabase-js';
import { DateTime, Duration } from 'luxon';
const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY);

export default function CoachCalendar() {
    const calendarRef = useRef(null);
    const [showSessionEditor, setShowSessionEditor] = useState(false);
    const [selectedSession, setSelectedSession] = useState(null);

    const [calendarEvents, setCalendarEvents] = useState([]);

    const [coaches, setCoaches] = useState([]);
    const [players, setPlayers] = useState([]);

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

    const [selectedCoaches, setSelectedCoaches] = useState([]);
    const [selectedPlayers, setSelectedPlayers] = useState([]);

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

    async function fetchSessionCoaches(sessionId) {
        const { data, error } = await supabase
            .from('session_people')
            .select(`
                user_id,
                signin_details!user_id ( role )    
            `)
            .eq('session_id', sessionId)
            .eq('signin_details.role', 'coach');

        if (error) {
            console.log("Error when fetching selected session coaches: ", error.message);
            return [];
        } else {
            return data.map(item => item.user_id);
        }
    }

    async function fetchSessionPlayers(sessionId) {
        const { data, error } = await supabase
            .from('session_people')
            .select(`
                user_id,
                signin_details!user_id ( role )
            `)
            .eq('session_id', sessionId)
            .eq('signin_details.role', 'player');

        if (error) {
            console.log("Error when fetching selected session players: ", error.message);
            return [];
        } else {
            return data.map(item => item.user_id);
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

            const [sessionCoaches, sessionPlayers] = await Promise.all([
                fetchSessionCoaches(selectedSession.id),
                fetchSessionPlayers(selectedSession.id)
            ]);

            setTempSession({
                id: selectedSession.id,
                name: selectedSession.title,
                duration: selectedSession.extendedProps.duration,
                notes: selectedSession.extendedProps.notes,
                selectedCoaches: sessionCoaches, 
                selectedPlayers: sessionPlayers 
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

    // handles returning to current week
    const handleShowToday = () => {
        setWeekStart(DateTime.now().startOf('week'));
        setWeekEnd(DateTime.now().endOf('week'));


        if (calendarRef.current) {
            const calendarApi = calendarRef.current.getApi();
            calendarApi.today(); 
        } else {
            console.log("loading calendar....");
        }
    }


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

    // auto save current session inputs in local storage and restore the saved inputs
    const [sessionSettings, setSessionSettings] = useState(() => {
        const savedDraft = localStorage.getItem('session_creator_draft');
        return savedDraft ? JSON.parse(savedDraft) : {
            sessionName: "Session Name",
            sessionDuration: durationOptions[0].val,
            sessionNotes: "",
            sessionPeople: []
        };
    });

    useEffect(() => {
        localStorage.setItem('session_creator_draft', JSON.stringify(sessionSettings));
    }, [sessionSettings]);

    const updateSessionField = (field, value) => {
        setSessionSettings({
            ...sessionSettings,
            [field]: value 
        });
    }

    const updateAvailField = (field, value) => {
        setAvailSettings({
            ...availSettings,
            [field]: value 
        });
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

            <div class="content-box editor-box">
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
                <OTHER_CALENDARS
                    events={calendarEvents}
                    activeStart={weekStart} activeEnd={weekEnd}
                    onTodayClick={handleShowToday}
                    onDateChange={handleDateChange}
                    onSessionClick = {(eventData) => {
                        setSelectedSession(eventData);
                        setShowSessionEditor(true);
                    }}

                    selectedSession={selectedSession}
                    
                    selectedCoaches={selectedCoaches} setSelectedCoaches={setSelectedCoaches}
                    selectedPlayers={selectedPlayers} setSelectedPlayers={setSelectedPlayers}
                    
                    ref={calendarRef}
                />
            </div>

            {/* Session editor */}
            { selectedSession && showSessionEditor && (
                <div id="session-editor-container">
                    <div class="content-box" id="session-editor">
                        <div class="content-box-top">
                            <div class="content-box-top-left">
                                <h2 id="session-editor-header">Session Editor</h2>
                            </div>
                            <div class="content-box-top-middle"></div>
                            <div class="content-box-top-right">
                                <button id="close-session-editor" onClick={() => {
                                    setShowSessionEditor(false);
                                    setSelectedSession(null);
                                }}>Close</button>
                            </div>
                        </div>
                        <div class="content-box-middle">
                            <div class="content-box-middle-left" id="session-editor-middle-left">
                                <TYPING_INPUT 
                                    label="NAME" 
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
                                <div class="input-container" id="session-editor-people">
                                    <span class="input-container-label">PEOPLE</span>
                                    <div class="input-box-wrapper session-people">
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
                            </div>
                            <div class="content-box-middle-right">
                                <div class="input-container" id="session-editor-drills">
                                    <span class="input-container-label">DRILLS</span>
                                    <div class="input-box-wrapper session-drills"></div>
                                </div>
                            </div>
                        </div>
                        <div class="content-box-bottom">
                            <div class="content-box-bottom-left">
                                <button id="save-session-changes btn" onClick={saveSessionChanges}>Save Changes</button>
                            </div>
                            <div class="content-box-bottom-middle"></div>
                            <div class="content-box-bottom-right">
                                <button class="delete-btn" id="delete-session" onClick={sessionDeleteConfirmation}>Delete</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}