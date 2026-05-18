import { DROPDOWN_INPUT, LOADING_OVERLAY, TYPING_INPUT } from '../Components/SharedComponents.jsx';
import { PLAYER_CALENDAR } from '../Components/PlayerCalendarComponents.jsx';
import { useState, useRef, useEffect } from 'react';

import { DateTime, Duration } from 'luxon';
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY);

export default function PlayerCalendar() {
    const sessionEditorRef = useRef(null);

    // auto save current session inputs in local storage and restore the saved inputs
    const [sessionSettings, setSessionSettings] = useState(() => {
        const savedDraft = localStorage.getItem('session_creator_draft');
        return savedDraft ? JSON.parse(savedDraft) : {
            sessionName: "Session Name",
            sessionDuration: "01:00:00",
            sessionNotes: "",
            sessionStart: "",
            sessionEnd: ""
        };
    });

    const updateSessionField = (field, value) => {
        setSessionSettings({
            ...sessionSettings,
            [field]: value 
        });
    }

    // detecting mobile window size
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 768);
        };

        window.addEventListener('resize', handleResize);
    
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // current user
    let currentUserID = 'b8d09d7e-e6cc-4461-a92c-bc5edaa49386';

    const calendarRef = useRef(null);
    const [showSessionDetails, setShowSessionDetails] = useState(false);
    const [selectedSession, setSelectedSession] = useState(null);

    const [calendarEvents, setCalendarEvents] = useState([]);

    const [coaches, setCoaches] = useState([]);
    const [players, setPlayers] = useState([]);

    const [selectedCoaches, setSelectedCoaches] = useState([]);
    const [selectedPlayers, setSelectedPlayers] = useState([]);

    const [selectedSessionCoaches, setSelectedSessionCoaches] = useState([]);
    const [selectedSessionPlayers, setSelectedSessionPlayers] = useState([]);

    const [selectedPeople, setSelectedPeople] = useState([]);
    const [selectedSessionPeople, setSelectedSessionPeople] = useState([]);

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

    // Times for mobile session-details 
    const mobileSessionCreatorTimes = [
        { name: "05:00", val: "05:00:00" },
        { name: "05:30", val: "05:30:00" },
        { name: "06:00", val: "06:00:00" },
        { name: "06:30", val: "06:30:00" },
        { name: "07:00", val: "07:00:00" },
        { name: "07:30", val: "07:30:00" },
        { name: "08:00", val: "08:00:00" },
        { name: "08:30", val: "08:30:00" },
        { name: "09:00", val: "09:00:00" },
        { name: "09:30", val: "09:30:00" },
        { name: "10:00", val: "10:00:00" },
        { name: "10:30", val: "10:30:00" },
        { name: "11:00", val: "11:00:00" },
        { name: "11:30", val: "11:30:00" },
        { name: "12:00", val: "12:00:00" },
        { name: "12:30", val: "12:30:00" },
        { name: "13:00", val: "13:00:00" },
        { name: "13:30", val: "13:30:00" },
        { name: "14:00", val: "14:00:00" },
        { name: "14:30", val: "14:30:00" },
        { name: "15:00", val: "15:00:00" },
        { name: "15:30", val: "15:30:00" },
        { name: "16:00", val: "16:00:00" },
        { name: "16:30", val: "16:30:00" },
        { name: "17:00", val: "17:00:00" },
        { name: "17:30", val: "17:30:00" },
        { name: "18:00", val: "18:00:00" },
        { name: "18:30", val: "18:30:00" },
        { name: "19:00", val: "19:00:00" },
        { name: "19:30", val: "19:30:00" },
        { name: "20:00", val: "20:00:00" },
        { name: "20:30", val: "20:30:00" },
        { name: "21:00", val: "21:00:00" },
    ];

    const [mobileSessionStart, setMobileSessionStart] = useState("05:00:00");
    const [mobileSessionEnd, setMobileSessionEnd] = useState("06:00:00");

    const mobileSessionStartIndex = mobileSessionCreatorTimes.findIndex(time => time.val === mobileSessionStart);

    const validEndTimes = mobileSessionCreatorTimes.slice(mobileSessionStartIndex + 1);

    useEffect(() => {
        if (validEndTimes.length > 0 && !validEndTimes.find(t => t.val === mobileSessionEnd)) {
            setMobileSessionEnd(validEndTimes[0].val);
            updateSessionField('sessionEnd', validEndTimes[0].val);
        }
    }, [mobileSessionStart]);

    // Drill library
    const [drills, setDrills] = useState([]);
    const [selectedDrills, setSelectedDrills] = useState([]);
    const [selectedSessionDrills, setSelectedSessionDrills] = useState([]);

    async function fetchDrills() {
        const { data, error } = await supabase
            .from('drill_library')
            .select('*');

        if (error) {
            console.log("Error when fetching drills: ", error.message);
            setDrills([]);
        } else {
            setDrills(data);
        }
    }

    async function fetchSessionDrills() {
        const { data, error } = await supabase
            .from('session_drills')
            .select('drill_id, order')
            .eq('session_id', selectedSession.id)
            .order('order', { ascending: true });
        
        if (!error) {
            console.log("Error when fetching drills: ", error.message);
            setSelectedDrills([]);
        } else {
            setSelectedDrills(data);
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
        setIsDataLoading(true);
        
        // fetch data from the database
        const { data, error } = await supabase
            .from('sessions')
            .select(`
                *,
                session_people!inner(user_id)
            `)
            .eq('session_people.user_id', currentUserID);

        // set the session data for the calendar events
        const session = (data || []).map(ses => {
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
            };
        })

        setCalendarEvents(session);
        setIsDataLoading(false);
    }

    useEffect(() => {
        fetchDrills();
        fetchPlayers();
        fetchCoaches();
        fetchCalendarData();
    }, []);

    return (
        <>
            {/* Loading overlay */}
            {isDataLoading && <LOADING_OVERLAY caption={"session data"}/>}

            {/* Calendar */}
            <div class="content-box" id="calendar-box">
                <PLAYER_CALENDAR 
                    events={calendarEvents}
                    activeStart={weekStart} activeEnd={weekEnd}
                    onDateChange={handleDateChange}
                    onSessionClick = {(eventData) => {
                        setSelectedSession(eventData);
                        setShowSessionDetails(true);
                    }}

                    selectedSession={selectedSession}
                    
                    selectedCoaches={selectedCoaches}
                    selectedPlayers={selectedPlayers} 

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
                                <div class="input-box-wrapper session-details-name">{selectedSession.title}</div>
                            </div>

                            <div class="input-container">
                                <span class="input-container-label">NOTES</span>
                                <div class="input-box-wrapper session-details-notes">{selectedSession.extendedProps.notes}</div>
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

            { isMobile && showSessionDetails && selectedSession && (
                <div id="mobile-session-details-container">
                    <div id="mobile-session-details">
                        <div id="mobile-session-details-top">
                            <h2 class="content-header">Session Details</h2>
                            <button id="mobile-close-session-details" onClick={() => {
                                setShowSessionDetails(false);
                                setSelectedSession(null);
                            }}>Close</button>
                        </div>

                        <div class="input-container">
                            <span class="input-container-label">NAME</span>
                            <div class="input-box-wrapper session-details-name">{selectedSession.title}</div>
                        </div>

                        <div class="input-container">
                            <span class="input-container-label">NOTES</span>
                            <div class="input-box-wrapper session-details-notes">{selectedSession.extendedProps.notes}</div>
                        </div>

                        <div class="input-container" id="mobile-session-details-people-container">
                            <span class="input-container-label">PEOPLE</span>
                            <div id="mobile-session-details-people">
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
            )}
        </>
    );
}