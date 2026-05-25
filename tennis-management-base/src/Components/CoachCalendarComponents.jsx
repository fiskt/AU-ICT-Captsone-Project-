import '../App.css'
import '../pages/CoachCalendar.css'
import '../pages/DrillLibrary.css'

import '../pages/CalendarStyle.css'

import { DateTime, Info, Interval, Duration } from 'luxon'
import { useState, useEffect, useRef, forwardRef } from 'react';

import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid' 
import timeGridPlugin from '@fullcalendar/timegrid' 
import { Draggable } from '@fullcalendar/interaction'
import interactionPlugin from '@fullcalendar/interaction'

import 'tippy.js/dist/tippy.css'
import tippy from 'tippy.js';

import { createClient } from '@supabase/supabase-js';
const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY);

function Stars({ level, size = '' }) {
    const levelMap = { Beginner: 1, Intermediate: 2, Advanced: 3, Elite: 5 };
    const filled = levelMap[level] ?? 2;
    return (
        <div className={`drill-stars ${size}`}>
            {[1, 2, 3, 4, 5].map(i => (
                <svg
                    key={i}
                    className={`drill-star ${i <= filled ? 'filled' : 'empty'}`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
            ))}
        </div>
    );
}

// ── TYPE BADGE ────────────────────────────────────────────────────────────────
function TypeBadge({ type }) {
    if (!type) return null;
    return (
        <span className={`drill-type-badge badge-${type.toLowerCase()}`}>
            {type}
        </span>
    );
}

function TICKBOX_SELECTOR({ people = [], selectedPeople = [], onToggle }) {
    return (
        <div>
            {people.map((person) => (
                <div class="people-selector-tickbox" key={person.id}>
                        <input
                            className="people-tickbox"
                            type="checkbox"
                            checked={selectedPeople.includes(person.id)}
                            onChange={() => onToggle(person.id)}
                        />
                        <span>{person.first_name} {person.last_name}</span>
                </div>
            ))}
        </div>
    );
}

export function PEOPLE_SELECTOR({ role, people = [], selectedPeople = [], setSelectedPeople }) {

    const handleToggle = (id) => {
        setSelectedPeople((prev) =>
            prev.includes(id) 
                ? prev.filter((p) => p !== id) 
                : [...prev, id]
        )
    };

    return (
        <div class="people-selector">
            <span class="people-selector-title">{role}</span>
            <TICKBOX_SELECTOR 
                people={people}
                selectedPeople={selectedPeople}
                onToggle={handleToggle}
            />
        </div>
    );
}

export function DELETE_CONFIRMATION({ session, onConfirm, onClose, deleting }) {
    const sessionName = session.title.length > 0
        ? session.title
        : "this session";
    return (
        <div id="drill-modal-overlay">
            <div className="drill-modal">
                <div className="drill-modal-header">
                    <span className="drill-modal-title">Delete Session</span>
                    <button className="drill-icon-btn" onClick={onClose} style={{ border: 'none', background: 'transparent' }}>
                        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <div className="drill-modal-body">
                    <div className="drill-delete-title">Delete "{sessionName}"?</div>
                    <div className="drill-delete-body">
                        This session will be permanently removed.
                    </div>
                </div>
                <div className="drill-modal-footer">
                    <button className="drill-btn drill-btn-danger-solid" onClick={onConfirm} disabled={deleting}>
                        {deleting ? 'Deleting...' : 'Delete Drill'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export function DRAGGABLE_SESSION({ sessionSettings, sessionCoaches, sessionPlayers }) {
    const sessionRef = useRef(null);

    // ensure session has a name
    const sessionHasName = sessionSettings.sessionName?.trim().length > 0;

    const sessionHasRPE = sessionSettings.sessionRPE > 0;

    // ensure session has at least 1 person selected
    const sessionHasPeople = sessionCoaches.length > 0 || sessionPlayers.length > 0;

    const sessionIsValid = sessionHasName && sessionHasPeople && sessionHasRPE;

    let sessionWarningText = "Drag into the calendar to schedule the session.";

    if (!sessionHasName) sessionWarningText = "Invalid: Name";
    if (!sessionHasPeople) sessionWarningText = "Invalid: People";
    if (!sessionHasRPE) sessionWarningText = "Invalid: RPE";
    if (!sessionHasName && !sessionHasPeople) sessionWarningText = "Invalid: Name, People";
    if (!sessionHasName && !sessionHasRPE) sessionWarningText = "Invalid: Name, RPE";
    if (!sessionHasRPE && !sessionHasPeople) sessionWarningText = "Invalid: RPE, People";
    if (!sessionHasName && !sessionHasRPE && !sessionHasPeople) sessionWarningText = "Invalid: Name, RPE, People";

    useEffect(() => {
        if (!sessionIsValid) return;
        let session = new Draggable(sessionRef.current, {
            eventData: () => {
                return {
                    title: sessionSettings.sessionName,
                    duration: sessionSettings.sessionDuration,
                    start: sessionSettings.sessionStart,
                    end: sessionSettings.sessionEnd,
                    extendedProps: {
                        notes: sessionSettings.sessionNotes,
                        people: sessionSettings.sessionPeople,
                        rpe: sessionSettings.sessionRPE,
                        type: 'session'
                    }
                };
            }
        })
        return () => session.destroy();
    }, [sessionSettings, sessionHasName, sessionHasPeople, sessionIsValid]);

    return (
        <div class="input-container" id="draggable-session-container">
            <span class={`input-container-label ${sessionIsValid ? '' : 'draggable-session-warning'}`}>{sessionWarningText}</span>
            <div class="input-box-wrapper" id="draggable-session">
                <div ref={sessionRef} class={`draggable-icon ${sessionIsValid ? 'session-icon' : 'invalid-session-icon'}`}>
                    <span>NAME: {`${sessionHasName ? sessionSettings.sessionName : "_"}`}</span>
                    <span>RPE: {`${sessionHasRPE ? sessionSettings.sessionRPE : "_"}`}</span>
                </div>
            </div>
        </div>
    );
}

export function SESSION_CREATOR_DRILLS({ selectedDrills, removeDrillFromSession }) {
    return (
        <>
            {selectedDrills.map((drill, index) => (
                <div key={drill.instanceId || `${drill.id}-${index}`}>
                    <SIMPLE_DRILL_CARD 
                        drill={drill} 
                        removeDrillFromSession={removeDrillFromSession}
                        isSelectedDrill={true}
                    />
                </div>
            ))}
        </>
    );
}

export function SIMPLE_DRILL_CARD({ drill, addDrillToSession, removeDrillFromSession, isSelectedDrill }) {
    return (
        <div 
            className="drill-card" 
            onClick={() => addDrillToSession && addDrillToSession(drill)}
            key={drill.id}
        >
            <div className="drill-card-top">
                {!isSelectedDrill && (
                    <TypeBadge type={drill.type} />
                )}
            </div>
            <div className="drill-card-name">{drill.name}</div>
            {!isSelectedDrill && (
                <div className="drill-card-name">{drill.description}</div>
            )}
            <div className="drill-card-footer">
                <Stars level={drill.level} />
                {isSelectedDrill && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation;
                            removeDrillFromSession(drill.instanceId);
                        }}
                    >
                        Remove
                    </button>
                )}
            </div>
        </div>
    );
}

export const CALENDAR = forwardRef(({ 
    onSessionClick, 
    events, 
    onDateChange, 
    activeStart, activeEnd, 
    selectedSession, 
    toggleTooltips, tooltipsEnabled, 
    selectedCoaches, setSelectedCoaches,
    selectedPlayers, setSelectedPlayers,
    selectedDrills,
    currentUser,
    setIsDraggingEvent,
    isMobile,
    setShowMobileSessionCreator,
    }, ref) => {

    const initialView = isMobile ? 'timeGridDay' : 'timeGridWeek';
    const headerToolBar = isMobile 
        ? {
            start: 'prev,next today', 
            end: 'dayGridMonth,timeGridDay'
        } : {
            start: 'prev,next today', 
            end: 'dayGridMonth,timeGridWeek'
        }   
    
    const todayStart = DateTime.now().startOf('week').minus({ days: 1 });
    const currentWeekStart = activeStart || todayStart;

    const currentWeekEnd = activeEnd ? activeEnd.minus({ days: 1 }) : currentWeekStart.endOf('week');


    const isSingleDay = currentWeekStart.hasSame(currentWeekEnd, 'day');

    const calendarTitle = isSingleDay 
        ? currentWeekStart.toFormat('MMMM d, yyyy') // Single Day: "May 9, 2026"
        : `${currentWeekStart.toFormat('MMM d')} - ${
            currentWeekStart.month === currentWeekEnd.month 
                ? currentWeekEnd.toFormat('d, yyyy') 
                : currentWeekEnd.toFormat('MMM d, yyyy')
            }`;

    const [isAnimating, setIsAnimating] = useState(false);

    async function pushSession({ event, sessionSettings }) {
        if (!event || !event.start) return;

        const start = DateTime.fromJSDate(event.start);
        const end = event.end
            ? DateTime.fromJSDate(event.end)
            : start.plus({ hours: 1 });

        const durationStr = end.diff(start).toFormat('hh:mm:ss');

        const { data, error } = await supabase
            .from('sessions')
            .insert([{ 
                name: sessionSettings.name, 
                duration: durationStr, 
                notes: sessionSettings.notes, 
                start_datetime: start.toISO(),
                end_datetime: end.toISO(),
                rpe: sessionSettings.rpe
            }])
            .select()
            .single();

        if (data) {
            const sessionCoaches = selectedCoaches.map(coachID => ({
                session_id: data.id,
                user_id: coachID
            }));

            const sessionPlayers = selectedPlayers.map(playerID => ({
                session_id: data.id,
                user_id: playerID
            }));

            const sessionDrills = selectedDrills.map((drill, index) => ({
                session_id: data.id,
                drill_id: drill.id,
                order: index
            }));

            await Promise.all([
                sessionCoaches.length > 0 && supabase.from('session_people').insert(sessionCoaches),
                sessionPlayers.length > 0 && supabase.from('session_people').insert(sessionPlayers),
                sessionDrills.length > 0 && supabase.from('session_drills').insert(sessionDrills)
            ]);

            event.setProp('id', data.id);

            fetch('/api/notify-session-created', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionId: data.id })
            }).catch(err => console.error('Email notification failed:', err));
        } else {
            console.log(error);
        }
    }

    async function updateSessionTimes(event) {
        if (!event.id) return;

        const start = DateTime.fromJSDate(event.start);
        const end = DateTime.fromJSDate(event.end);

        const newDuration = end.diff(start).toFormat('hh:mm:ss');

        const { error } = await supabase
            .from('sessions')
            .update({
                duration: newDuration,
                start_datetime: start.toISO(),
                end_datetime: end.toISO()                
            })
            .eq('id', event.id);

        if (error) console.error(error.message);
    }

    return (
        <div id="calendar-container">
            <div id="calendar-date-container" >
                <h1 id="calendar-date" class="calendar-title-fade" key={activeStart?.toISODate()}>
                    {calendarTitle} 
                </h1>
                {isMobile && (
                    <button
                        onClick={() => setShowMobileSessionCreator(true)}
                    >Add Session</button>
                )}
            </div>
            <div className={`calendar-fade isAnimating ? "calendar-fade" : ""`}>
                <FullCalendar
                    plugins={[ dayGridPlugin, timeGridPlugin, interactionPlugin ]}
                    ref={ref}
                    events={events}
                    allDaySlot={false}
                    eventOverlap={false}
                    selectOverlap={false}
                    initialView={initialView}
                    showNonCurrentDates={false}
                    height="auto"
                    slotMinTime={"05:00:00"}
                    slotMaxTime={"22:00:00"}
                    expandRows={true}
                    eventClick={(info) => {
                        onSessionClick(info.event);
                    }}
                    headerToolbar={headerToolBar}
                    eventClassNames={(arg) => {
                        const classes = [];

                        const duration = arg.event.end - arg.event.start;
                        if (duration === 1800000) {
                            classes.push('short-event');
                        }

                        if (
                            selectedSession 
                            && arg.event.id === selectedSession.id 
                            && arg.event.extendedProps.type === 'session'
                        ) {
                            classes.push('selected-session');
                        } 
                        
                        return classes;
                    }}
                    datesSet={(dateInfo) => {
                        setIsAnimating(false);
                        
                        setTimeout(() => {
                            setIsAnimating(true);
                            onDateChange(dateInfo.start, dateInfo.end);
                        }, 10);
                    }}
                    eventDidMount={(info) => {
                        if (isMobile) return;

                        if (tooltipsEnabled && info.event.extendedProps.type === 'session') {
                            const duration = info.event.extendedProps.duration || "-";
                            const notes = info.event.extendedProps.notes || "No notes";
                            tippy(info.el, {
                                content: `
                                    <div class="calendar-event-tooltip">
                                        <span class="calendar-event-tooltip-title">${info.event.title}</span>
                                        <div class="calendar-event-tooltip-divider"></div>
                                        <span>DURATION: ${duration}</span>
                                        <span>NOTES:</span>
                                        <span class="calendar-event-tooltip-notes-area">${notes}</span>
                                    </div>
                                `,
                                allowHTML: true,
                                placement: 'top-start',
                                theme: 'light'
                            })
                        }
                        }
                    }
                    displayEventTime={!isMobile}
                    displayEventEnd={false}
                    editable={true}
                    eventReceive = {(info) => {    
                        const sessionData = {
                            name: info.event.title,
                            notes: info.event.extendedProps.notes || "",
                            rpe: info.event.extendedProps.rpe || 0
                        }
                        pushSession({ event: info.event, sessionSettings: sessionData });
                    }}
                    eventDrop={(info) => {
                        if (isMobile) return;

                        if (info.event.extendedProps.type === 'session') {
                            updateSessionTimes(info.event);
                        }
                    }}
                    eventResize={(info) => {
                        console.log("event resized");
                        if (isMobile) return;

                        if (info.event.extendedProps.type === 'session') {
                            console.log("update session times ran");
                            updateSessionTimes(info.event);
                        }
                    }}
                    eventDragStart={(info) => {
                        if (isMobile) return;

                        if (info.event.extendedProps.type === 'session') return;

                        setIsDraggingEvent(true);
                    }}
                    eventDragStop={(info) => {
                        if (isMobile) return;

                        setIsDraggingEvent(false);
                        if (info.event.extendedProps.type === 'session') return;

                        const delArea = document.getElementById('calendar-del-area');
                        if (!delArea) return;
                        const rect = delArea.getBoundingClientRect();

                        const inDelArea = 
                            info.jsEvent.clientX >= rect.left &&
                            info.jsEvent.clientX <= rect.right &&
                            info.jsEvent.clientY >= rect.top &&
                            info.jsEvent.clientY <= rect.bottom;
                    }}
                />
            </div>
        </div>
    );
});
