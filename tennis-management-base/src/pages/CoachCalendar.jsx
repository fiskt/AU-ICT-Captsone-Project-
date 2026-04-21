import { DROPDOWN_INPUT, TYPING_INPUT } from '../Components/SharedComponents.jsx';
import { CALENDAR, CREATE_SESSION, DRAGGABLE_DRILL, DRAGGABLE_SESSION, PEOPLE_SELECTOR } from '../Components/CoachCalendarComponents.jsx';
import { useState, useRef, useEffect } from 'react';

import { createClient } from '@supabase/supabase-js';
import { DateTime, Duration } from 'luxon';
const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY);

export default function CoachCalendar() {
    const calendarRef = useRef(null);
    const [showSessionCreator, setShowSessionCreator] = useState(true);
    const [selectedSession, setSelectedSession] = useState(null);

    const [calendarEvents, setCalendarEvents] = useState([]);

    const [weekStart, setWeekStart] = useState(DateTime.now().startOf('week'));
    const [weekEnd, setWeekEnd] = useState(DateTime.now().endOf('week'));

    const handleDateChange = (start, end) => { 
        setWeekStart(DateTime.fromJSDate(start));
        setWeekEnd(DateTime.fromJSDate(end));
    };

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
        fetchSessions();
    }, []);

    async function fetchSessions() {
        const { data, error } = await supabase
            .from('sessions')
            .select('*');
        
        if (error) {
            console.log("Error fetching session data: ", error.message);
        } else {
            console.log(data);
            const formattedEvents = data.map(session => {
                const startTime = DateTime.fromISO(session.time);
                const duration = Duration.fromISOTime(session.duration);

                return {
                    id: session.id,
                    title: session.name,
                    start: session.time,
                    end: startTime.plus(duration).toISO(),
                    extendedProps: {
                        duration: session.duration,
                        notes: session.notes
                    }
                };
            });
            setCalendarEvents(formattedEvents);   
        }
    }

    const durationOptions = [
        { label: "30 mins", val: "00:30:00" },
        { label: "60 mins", val: "00:60:00" },
        { label: "90 mins", val: "01:30:00" },
        { label: "120 mins", val: "02:00:00" },
        { label: "150 mins", val: "02:30:00" },
        { label: "180 mins", val: "03:00:00" },
    ];

    const coaches = ["coach 1", "coach 2", "coach 3", "coach 4", "coach 5"];
    const players = ["player 1", "player 2", "player 3", "player 4", "player 5"];

    const [sessionSettings, setSessionSettings] = useState({
        sessionName: "Session Name",
        sessionDuration: durationOptions[0].val,
        sessionNotes: "",
        sessionPeople: []
    });


    const [drillSettings, setDrillSettings] = useState({
        drillName: "Right hand serve",
        drillDuration: "30m",
        drillDescription: "Practice serves with right hand",
        drillTags: ["Right hand", "Serving"]
    });

    const updateField = (field, value) => {
        setSessionSettings({
            ...sessionSettings,
            [field]: value 
        });
    }

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

    return (
        <>
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
                        setShowSessionCreator(false);
                    }}
                />
            </div>

            {/* Session creator */}
            {showSessionCreator && (
                <div class="content-box editor-box" id="session-creator">
                    <h2 class="content-header">Session Creator</h2>
                    <div id="session-creator-input-container">
                        <TYPING_INPUT 
                            label="NAME" 
                            num_rows="1" 
                            input_id="session-name-creator" 
                            box_w="100%" box_h="30px" 
                            sample_txt="Session name"
                            value={sessionSettings.sessionName}
                            onChange={(val) => {
                                updateField('sessionName', val);
                            }}
                        />
                        <DROPDOWN_INPUT 
                            label="DURATION" 
                            input_id="session-duration-creator" 
                            box_w="100%" box_h="30px" 
                            options={durationOptions}
                            value={sessionSettings.sessionDuration}
                            onChange={(val) => {
                                updateField('sessionDuration', val);
                            }}
                        />
                        <TYPING_INPUT 
                            label="NOTES" 
                            num_rows="6" 
                            input_id="session-notes-creator" 
                            box_w="100%" box_h="80px" 
                            sample_txt="Session notes" 
                            value={sessionSettings.sessionNotes}
                            onChange={(val) => updateField('sessionNotes', val)}
                        />
                        <div class="input-container">
                            <span class="input-container-label">PEOPLE</span>
                            <div class="input-box-wrapper" id="session-people">
                                <PEOPLE_SELECTOR role="COACHES" names={coaches} />
                                <PEOPLE_SELECTOR role="PLAYERS" names={players} />
                            </div>
                        </div>
                        <div class="input-container">
                            <span class="input-container-label">DRILLS</span>
                            <div class="input-box-wrapper" id="session-drills">
                            </div>
                        </div>
                    </div>
                    <DRAGGABLE_SESSION sessionSettings={sessionSettings} />
                </div>
            )}

            {/* Session editor */}
            { selectedSession && (
                <div class="content-box editor-box" id="session-editor">
                    <h2 class="content-header">Session Editor</h2>
                    <div id="session-editor-input-container">
                        <TYPING_INPUT 
                            label="NAME" 
                            num_rows="1" 
                            input_id="session-name-editor" 
                            box_w="100%" box_h="30px" 
                            sample_txt="Session name"
                            value={sessionSettings.sessionName}
                            onChange={(val) => {
                                updateField('sessionName', val);
                                updateCalendarSession('sessionName', val);
                            }}
                        />
                        <DROPDOWN_INPUT 
                            label="DURATION" 
                            input_id="session-duration-editor" 
                            box_w="100%" box_h="30px" 
                            options={durationOptions}
                            value={sessionSettings.sessionDuration}
                            onChange={(val) => {
                                updateField('sessionDuration', val);
                                updateCalendarSession('sessionDuration', val);
                            }}
                        />
                        <TYPING_INPUT 
                            label="NOTES" 
                            num_rows="6" 
                            input_id="session-notes-editor" 
                            box_w="100%" box_h="80px" 
                            sample_txt="Session notes" 
                            value={sessionSettings.sessionNotes}
                            onChange={(val) => updateField('sessionNotes', val)}
                        />
                        <div class="input-container">
                            <span class="input-container-label">PEOPLE</span>
                            <div class="input-box-wrapper" id="session-people">
                                
                            </div>
                        </div>
                        <div class="input-container">
                            <span class="input-container-label">DRILLS</span>
                            <div class="input-box-wrapper" id="session-drills">
                            </div>
                        </div>
                        <CREATE_SESSION 
                            onAddClick={() =>{
                                setShowSessionCreator(true);
                                setSelectedSession(null);
                            }}
                        />
                    </div>
                </div>
            )}
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