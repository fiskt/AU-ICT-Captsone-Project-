import { DROPDOWN_INPUT, LOADING_OVERLAY, TYPING_INPUT } from '../Components/SharedComponents.jsx';
import { CALENDAR, DRAGGABLE_AVAILABILITY, DRAGGABLE_DRILL, DRAGGABLE_SESSION, PEOPLE_SELECTOR } from '../Components/CoachCalendarComponents.jsx';
import { useState, useRef, useEffect } from 'react';


import { createClient } from '@supabase/supabase-js';
import { DateTime, Duration } from 'luxon';
import { useSearchParams } from 'react-router-dom';
const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY);

export default function CoachCalendar() {
    const calendarRef = useRef(null);
    const [showSessionEditor, setShowSessionEditor] = useState(false);
    const [selectedSession, setSelectedSession] = useState(null);

    const [showAvailabilityCreator, setShowAvailabilityCreator] = useState(false);

    const [calendarEvents, setCalendarEvents] = useState([]);

    const [coaches, setCoaches] = useState([]);
    const [players, setPlayers] = useState([]);

    const [selectedCoaches, setSelectedCoaches] = useState([]);
    const [selectedPlayers, setSelectedPlayers] = useState([]);

    const [selectedSessionCoaches, setSelectedSessionCoaches] = useState([]);
    const [selectedSessionPlayers, setSelectedSessionPlayers] = useState([]);
    const [editedSessionCoaches, setEditedSessionCoaches] = useState([]);
    const [editedSessionPlayers, setEditedSessionPlayers] = useState([]);

    // confirmation popup for deleting sessions
    const sessionDeleteConfirmation = () => {
        const confirmed = window.confirm("Are you sure you want to delete this session? This action cannot be undone.");

        if (confirmed) {
            deleteSession();
            setShowSessionEditor(false);
            setSelectedSession(null);
        }
    }

    async function deleteSession() {
        setIsDataLoading(true);
        const { error } = await supabase
            .from('sessions')
            .delete()
            .eq('id', selectedSession.id);

        if (error) {
            console.log("Error when deleting session. Please try again.");
            setIsDataLoading(false);
        } else {
            selectedSession.remove();
            fetchCalendarData();
        }
    }

    async function fetchPlayers() {
        const { data, error } = await supabase
            .from('players')
            .select('*')

        if (error) {
            console.log("Error when fetching players: ", error.message);
            setPlayers([]);
        } else {
            setPlayers(data);
            console.log(players);
        }
    }

    async function fetchCoaches() {
        const { data, error } = await supabase
            .from('coaches')
            .select('*')

        if (error) {
            console.log("Error when fetching coaches: ", error.message);
            setCoaches([]);
        } else {
            setCoaches(data);
            console.log(coaches);
        }
    }

    async function fetchSessionCoaches(sessionId) {
        const { data, error } = await supabase
            .from('session_coaches')
            .select('coach_id')
            .eq('session_id', sessionId);

        if (error) {
            console.log("Error when fetching selected session coaches: ", error.message);
            return [];
        } else {
            return data.map(item => item.coach_id);
        }
    }

    async function fetchSessionPlayers(sessionId) {
        const { data, error } = await supabase
            .from('session_players')
            .select('player_id')
            .eq('session_id', sessionId);

        if (error) {
            console.log("Error when fetching selected session players: ", error.message);
            return [];
        } else {
            return data.map(item => item.player_id);
        }
    }

    async function deleteAvail( event ) {
        setIsDataLoading(true);

        const { error } = await supabase
            .from('coach_availability')
            .delete()
            .eq('avail_id', event.id);

        if (!error) {
            event.remove();
        } else {
            console.log("Could not delete event: ", error.message);
        }
        setIsDataLoading(false);
    }

    const renameAvail = () => {
        // this will be an async funcion for changing the notes in the event
        console.log("rename avail event");
    }
    // toggle for event tooltips
    const [toggleEventTooltips, setToggleEventTooltips] = useState(true);

    const toggleTooltips = () => {
        toggleEventTooltips ? setToggleEventTooltips(false) : setToggleEventTooltips(true);
        console.log(toggleEventTooltips);
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


            setEditedSessionCoaches(sessionCoaches);
            setEditedSessionPlayers(sessionPlayers);


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
            setEditedSessionCoaches([]);
            setEditedSessionPlayers([]);
        }
        setIsDataLoading(false);
    };

    loadSessionData();
}, [selectedSession]);

useEffect(() => {
    if (tempSession) {
        setTempSession(prev => ({
            ...prev,
            selectedCoaches: editedSessionCoaches,
            selectedPlayers: editedSessionPlayers
        }));
    }
}, [editedSessionCoaches, editedSessionPlayers]);



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

    useEffect(() => {
        fetchCalendarData();
        fetchPlayers();
        fetchCoaches();
    }, []);

    async function fetchCalendarData() {
        setIsDataLoading(true);
        
        // fetch data from the database
        const sessionData = await supabase
            .from('sessions')
            .select('*');

        const availData = await supabase
            .from('coach_availability')
            .select('*');

        // set the session data for the calendar events
        const session = (sessionData.data || []).map(ses => {
            const startTime = DateTime.fromISO(ses.time);
            const duration = Duration.fromISOTime(ses.duration);
            return {
                id: ses.id,
                title: ses.name,
                start: startTime.toISO(),
                end: startTime.plus(duration).toISO(),
                extendedProps: {
                    type: 'session',
                    duration: duration.toISO(),
                    people: ses.people,
                    notes: ses.notes
                }
            };
        })

        // set data for availability events
        const availability = (availData.data || []).map(ava => {
            const startTime = DateTime.fromISO(ava.start_datetime);
            const endTime = DateTime.fromISO(ava.end_datetime);
            const duration = Duration.fromISOTime(ava.duration);
            return {
                id: ava.avail_id,
                title: ava.notes || "",
                start: startTime.toISO(),
                end: endTime.toISO(),
                extendedProps: {
                    type: 'availability',
                    duration: duration,
                    notes: ava.notes
                }
            };
        })

        // set copies of the events to the calendar
        setCalendarEvents([...session, ...availability]);
        setIsDataLoading(false);
    }

    async function saveSessionChanges() {
        setIsDataLoading(true);
        const { error } = await supabase
            .from('sessions')
            .update({ 
                name: tempSession.name, 
                duration: tempSession.duration, 
                notes: tempSession.notes 
            })
            .eq('id', tempSession.id);

        await Promise.all([
            supabase.from('session_coaches').delete().eq('session_id', tempSession.id),
            supabase.from('session_players').delete().eq('session_id', tempSession.id)
        ]);

        const newCoaches = (tempSession.selectedCoaches || []).map(coachId => ({
            session_id: tempSession.id,
            coach_id: coachId
        }));

        const newPlayers = (tempSession.selectedPlayers || []).map(playerId => ({
            session_id: tempSession.id,
            player_id: playerId
        }));

        await Promise.all([
            newCoaches.length > 0 && supabase.from('session_coaches').insert(newCoaches),
            newPlayers.length > 0 && supabase.from('session_players').insert(newPlayers)
        ]);


        if (!error) {
            fetchCalendarData();
            setSelectedSession(null);
            setShowSessionEditor(false);
        }
    }

    // session creator/editor duration dropdown options
    const durationOptions = [
        { label: "30 mins", val: "00:30:00" },
        { label: "60 mins", val: "00:60:00" },
        { label: "90 mins", val: "01:30:00" },
        { label: "120 mins", val: "02:00:00" },
        { label: "150 mins", val: "02:30:00" },
        { label: "180 mins", val: "03:00:00" },
    ];

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

    const [availSettings, setAvailSettings] = useState({
            availNotes: "",
            availStart: "",
            availEnd: "",
            availDuration: "01:00:00"
    })

    useEffect(() => {
        localStorage.setItem('session_creator_draft', JSON.stringify(sessionSettings));
    }, [sessionSettings]);

    // temp drill settings
    const [drillSettings, setDrillSettings] = useState({
        drillName: "Right hand serve",
        drillDuration: "30m",
        drillDescription: "Practice serves with right hand",
        drillTags: ["Right hand", "Serving"]
    });

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

    return (
        <>
            {/* Loading overlay */}
            {isDataLoading && <LOADING_OVERLAY caption={"session data"}/>}

            {/* Calendar */}
            <div class="content-box" id="calendar-box">
                <CALENDAR 
                    events={calendarEvents}
                    activeStart={weekStart} activeEnd={weekEnd}
                    onTodayClick={handleShowToday}
                    onDateChange={handleDateChange}
                    onSessionClick = {(eventData) => {
                        setSelectedSession(eventData);
                        setShowSessionEditor(true);
                    }}

                    selectedSession={selectedSession}

                    toggleTooltips={toggleTooltips} tooltipsEnabled={toggleEventTooltips}
                    
                    selectedCoaches={selectedCoaches} setSelectedCoaches={setSelectedCoaches}
                    selectedPlayers={selectedPlayers} setSelectedPlayers={setSelectedPlayers}
                    
                    handleDelete={sessionDeleteConfirmation}

                    ref={calendarRef}
                />
            </div>

            {/* Session creator */}
            { !showAvailabilityCreator && (
                <div class="content-box editor-box" id="session-creator">
                    <h2 class="content-header" onClick={() => setShowAvailabilityCreator(true)}>Session Creator</h2>
                    <div id="session-creator-input-container">
                        <TYPING_INPUT 
                            label="NAME" 
                            num_rows="1" 
                            input_id="session-name-creator" 
                            box_w="100%" box_h="30px" 
                            sample_txt="Session name"
                            value={sessionSettings.sessionName}
                            onChange={(val) => {
                                updateSessionField('sessionName', val);
                            }}
                        />
                        <DROPDOWN_INPUT 
                            label="DURATION" 
                            input_id="session-duration-creator" 
                            box_w="100%" box_h="30px" 
                            options={durationOptions}
                            value={sessionSettings.sessionDuration}
                            onChange={(val) => {
                                updateSessionField('sessionDuration', val);
                            }}
                        />
                        <TYPING_INPUT 
                            label="NOTES" 
                            num_rows="6" 
                            input_id="session-notes-creator" 
                            box_w="100%" box_h="80px" 
                            sample_txt="Session notes" 
                            value={sessionSettings.sessionNotes}
                            onChange={(val) => updateSessionField('sessionNotes', val)}
                        />
                        <div class="input-container">
                            <span class="input-container-label">PEOPLE</span>
                            <div class="input-box-wrapper session-people">
                                <PEOPLE_SELECTOR role="COACHES" people={coaches} selectedPeople={selectedCoaches} setSelectedPeople={setSelectedCoaches} />
                                <PEOPLE_SELECTOR role="PLAYERS" people={players} selectedPeople={selectedPlayers} setSelectedPeople={setSelectedPlayers} />
                            </div>
                        </div>
                        <div class="input-container">
                            <span class="input-container-label">DRILLS</span>
                            <div class="input-box-wrapper session-drills">
                            </div>
                        </div>
                    </div>
                    <DRAGGABLE_SESSION sessionSettings={sessionSettings} />
                </div>
            )}

            {/* Availability creator */}
            { showAvailabilityCreator && (
                <div class="content-box editor-box" id="avail-creator">
                    <h2 class="content-header" onClick={() => setShowAvailabilityCreator(false)}>Availability Creator</h2>
                    <div id="session-creator-input-container">
                        <TYPING_INPUT 
                            label="NAME" 
                            num_rows="1" 
                            input_id="availibility-notes-creator" 
                            box_w="100%" box_h="30px" 
                            sample_txt="Notes"
                            value={availSettings.availNotes}
                            onChange={(val) => {
                                updateAvailField('availNotes', val);
                            }}
                        />
                    </div>
                    <DRAGGABLE_AVAILABILITY availSettings={availSettings} />
                </div>
            )}
            
            {/* Session editor */}
            { selectedSession && showSessionEditor && (
                <div id="session-editor-container">
                    <button 
                onClick={() => {
                    console.log(tempSession);
                    console.log(selectedSessionCoaches, selectedSessionPlayers);
                }}
                >show selected people</button>
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
                                <DROPDOWN_INPUT 
                                    label="DURATION" 
                                    input_id="session-duration-creator" 
                                    box_w="100%" box_h="30px" 
                                    options={durationOptions}
                                    value={tempSession?.duration || ""}
                                    onChange={(val) => 
                                        setTempSession({ ...tempSession, duration: val })
                                    }
                                    id="session-editor-duration"
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

            {/* Drill Library */}
            <div class="content-box editor-box" id="drill-library">
                <h2 class="content-header">Drills</h2>
                <div class="input-container">
                    <span class="input-container-label">LIBRARY</span>
                    <div class="input-box-wrapper" id="drill-library-container">
                        <DRAGGABLE_DRILL drillSettings={drillSettings} />
                    </div>
                </div>
            </div>
        </>
    );
}