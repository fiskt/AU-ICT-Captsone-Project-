import { DROPDOWN_INPUT, LOADING_OVERLAY, TYPING_INPUT } from '../Components/SharedComponents.jsx';
import { CALENDAR, DRAGGABLE_SESSION, PEOPLE_SELECTOR } from '../Components/CoachCalendarComponents.jsx';
import { USERS_LIST, OTHER_CALENDARS, SESSION_DETAILS_DRILLS } from '../Components/OtherUsersComponents.jsx';
import { useState, useRef, useEffect } from 'react';

import { useCurrentUser } from '../hooks/useCurrentUser.jsx';
import { useLocation } from "react-router-dom";

import { supabase } from '../supabaseClient'

import { DateTime, Duration } from 'luxon';
import { PLAYER_CALENDAR } from '../Components/PlayerCalendarComponents.jsx';

export default function CoachCalendar() {
    const { userId: currentUserID, isLoading: authLoading } = useCurrentUser();

    const sessionDetailsRef = useRef(null);
    const calendarRef = useRef(null);
    const [showSessionDetails, setShowSessionDetails] = useState(false);
    const [selectedSession, setSelectedSession] = useState(null);

    const [calendarEvents, setCalendarEvents] = useState([]);

    const [coaches, setCoaches] = useState([]);
    const [players, setPlayers] = useState([]);

    const [selectedSessionPeople, setSelectedSessionPeople] = useState([]);
    const [selectedSessionDrills, setSelectedSessionDrills] = useState([]);

    const location = useLocation();
    const selectedSessionIdDashboard = location.state?.selectedSession;

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
    if (!selectedSessionIdDashboard || calendarEvents.length === 0) return;

    const sessionToOpen = calendarEvents.find(
        event => event.id === selectedSessionIdDashboard
    );

    if (sessionToOpen) {
        setSelectedSession(sessionToOpen);
        setShowSessionDetails(true);
    }
}, [selectedSessionIdDashboard, calendarEvents]);

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
        if (!currentUserID) return;
        setIsDataLoading(true);

        let sessionEvents = [];
        
        const { data, error } = await supabase
            .from('sessions')
            .select(`
                *,
                session_people!inner(user_id)
            `)
            .eq('session_people.user_id', currentUserID);

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
        if (currentUserID) {
            fetchCalendarData();
        } else {
            setCalendarEvents([]);
        }
    }, [currentUserID]);

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
            
            {/* Calendar */}
            <div class="content-box player-calendar-box" id="calendar-box">
                <PLAYER_CALENDAR 
                    events={calendarEvents}
                    activeStart={weekStart} activeEnd={weekEnd}
                    onDateChange={handleDateChange}
                    onSessionClick = {(eventData) => {
                        setSelectedSession(eventData);
                        setShowSessionDetails(true);
                    }}

                    selectedSession={selectedSession}

                    selectedUser={currentUserID}

                    isMobile={isMobile}

                    ref={calendarRef}
                />
            </div>
            
            {/* Session details */}
            { selectedSession && showSessionDetails && !isMobile && (
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
                                <span class="input-container-label">PLANNED RPE</span>
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
                            <span class="input-container-label">PLANNED RPE</span>
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
        </>
    );
}