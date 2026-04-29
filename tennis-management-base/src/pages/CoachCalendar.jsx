import { DROPDOWN_INPUT, LOADING_OVERLAY, TYPING_INPUT } from '../Components/SharedComponents.jsx';
import { CALENDAR, CONTEXT_MENU, DRAGGABLE_AVAILABILITY, DRAGGABLE_DRILL, DRAGGABLE_SESSION, PEOPLE_SELECTOR } from '../Components/CoachCalendarComponents.jsx';
import { useState, useRef, useEffect } from 'react';

import { createClient } from '@supabase/supabase-js';
import { DateTime, Duration } from 'luxon';
const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY);

export default function CoachCalendar() {
    const calendarRef = useRef(null);
    const [showSessionEditor, setShowSessionEditor] = useState(false);
    const [selectedSession, setSelectedSession] = useState(null);

    const [showAvailabilityCreator, setShowAvailabilityCreator] = useState(false);

    const [calendarEvents, setCalendarEvents] = useState([]);

    // right click menu for calendar
    const [calendarContextMenuPos, setCalendarContextMenuPos] = useState(null);
    const [showCalendarContextMenu, setShowCalendarContextMenu] = useState(false);

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

    const availContextOptions = [
        { name: "Delete", func: deleteAvail, classes: ["delete-btn"] },
        { name: "Rename", func: renameAvail, classes: ["btn"] }
    ];

    const sessionContextOptions = [
        { name: "Delete", func: null, classes: ["delete-btn"] },
        { name: "Edit", func: null, classes: ["btn"] },
        { name: "Rename", func: null, classes: ["btn"] }
    ];



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
        if (selectedSession) {
            setTempSession({
                id: selectedSession.id,
                name: selectedSession.title,
                duration: selectedSession.extendedProps.duration,
                notes: selectedSession.extendedProps.notes,
                people: selectedSession.extendedProps.people,
            });
        } else {
            setTempSession(null);
        }
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
    useEffect(() => {
        fetchCalendarData();
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

    // temp coach/player arrays for session people 
    const coaches = ["coach 1", "coach 2", "coach 3", "coach 4", "coach 5"];
    const players = ["player 1", "player 2", "player 3", "player 4", "player 5"];

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

    // update fields in session editor
    const updateCalendarSession = (field, value) => {
        if (!calendarRef.current) return;
        const calendarApi = calendarRef.current.getApi();
        const event = calendarApi.getEventById(selectedSession.id);
        if (event) {
            if (field === 'sessionName') {
                event.setProp('title', value);
            } else if (field === 'sessionDuration') {
                event.setProp('duration', value);
            }
        }
    }

    // confirmation popup for deleting sessions
    const sessionDeleteConfirmation = () => {
        const confirmed = window.confirm("Are you sure you want to delete this session? This action cannot be undone.");

        if (confirmed) {
            deleteSession();
            setShowSessionEditor(false);
            setSelectedSession(null);
        }
    }

    return (
        <>
            {/* Context menu */}
            {showCalendarContextMenu && 
                <CONTEXT_MENU
                    availContextOptions={availContextOptions}
                    sessionContextOptions={sessionContextOptions}
                    setShowCalendarContextMenu={setShowCalendarContextMenu}
                    calendarContextMenuPos={calendarContextMenuPos}
                />
            }

            {/* Loading overlay */}
            {isDataLoading && <LOADING_OVERLAY caption={"session data"}/>}

            {/* Calendar */}
            <div class="content-box" id="calendar-box">
                <CALENDAR 
                    ref={calendarRef}
                    events={calendarEvents}
                    activeStart={weekStart}
                    activeEnd={weekEnd}
                    onTodayClick={handleShowToday}
                    onDateChange={handleDateChange}
                    onSessionClick = {(eventData) => {
                        setSelectedSession(eventData);
                        setShowSessionEditor(true);
                    }}
                    selectedSession={selectedSession}
                    toggleTooltips={toggleTooltips}
                    tooltipsEnabled={toggleEventTooltips}
                    setCalendarContextMenuPos={setCalendarContextMenuPos}
                    calendarContextMenuPos={calendarContextMenuPos}
                    setShowCalendarContextMenu={setShowCalendarContextMenu}
                    showCalendarContextMenu={showCalendarContextMenu}
                />
            </div>

            {/* Session creator */}
            { !showAvailabilityCreator && (
                <div class="content-box editor-box" id="session-creator">
                    <h2 class="content-header" onClick={() => setShowAvailabilityCreator(true)} onContextMenu={(e) => handleContextMenu(e)}>Session Creator</h2>
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
                                <PEOPLE_SELECTOR role="COACHES" names={coaches} />
                                <PEOPLE_SELECTOR role="PLAYERS" names={players} />
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
                            <div class="content-box-middle-left">
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
                            />
                            <div class="input-container" id="session-editor-people">
                                <span class="input-container-label">PEOPLE</span>
                                <div class="input-box-wrapper session-people">
                                    <PEOPLE_SELECTOR role="COACHES" names={coaches} />
                                    <PEOPLE_SELECTOR role="PLAYERS" names={players} />
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