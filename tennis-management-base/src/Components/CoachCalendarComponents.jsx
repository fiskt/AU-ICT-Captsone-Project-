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

import { supabase } from '../supabaseClient'

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

export function DRAGGABLE_SESSION({ sessionSettings, sessionCoaches, sessionPlayers, currentCalendarView }) {
    const sessionRef = useRef(null);

    // ensure session has a name
    const sessionHasName = sessionSettings.sessionName?.trim().length > 0;

    const sessionHasRPE = sessionSettings.sessionRPE > 0;

    // ensure session has at least 1 person selected
    const sessionHasCoaches = sessionCoaches.length > 0;
    const sessionHasPlayers = sessionPlayers.length > 0;

    const sessionHasPeople = sessionHasCoaches && sessionHasPlayers;

    const sessionIsValid = 
        sessionHasName && 
        sessionHasPeople && 
        sessionHasRPE && 
        currentCalendarView === 'timeGridWeek';

    let sessionWarningText = "Drag into the calendar to schedule the session";

    if (!sessionHasName) sessionWarningText = "Invalid: Name";
    if (!sessionHasPeople) sessionWarningText = "Please select at least one coach and one player";
    if (!sessionHasRPE) sessionWarningText = "Invalid: RPE";
    if (!sessionHasName && !sessionHasPeople) sessionWarningText = "Invalid: Name, People";
    if (!sessionHasName && !sessionHasRPE) sessionWarningText = "Invalid: Name, RPE";
    if (!sessionHasRPE && !sessionHasPeople) sessionWarningText = "Invalid: RPE, People";
    if (!sessionHasName && !sessionHasRPE && !sessionHasPeople) sessionWarningText = "Invalid: Name, RPE, People";

    if (currentCalendarView !== 'timeGridWeek') sessionWarningText = "Use calendar week view to schedule sessions"

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
                        className='drill-icon-btn'
                        onClick={(e) => {
                            e.stopPropagation;
                            removeDrillFromSession(drill.instanceId);
                        }}
                    >
                        <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                )}
            </div>
        </div>
    );
}

export function DELETE_CONFIRM({
    deleteRef,
    setShowDelete,
    selectedSession,
    deleteSession,
    isDeleting
}) {
    return (
        <div id="drill-modal-overlay"
            onClick={(e) => {
                if (deleteRef.current && !deleteRef.current.contains(e.target)) {
                    setShowDelete(false);
                }
            }}
        >
            <div className="drill-modal" ref={deleteRef}>
                <div className="drill-modal-header">
                    <span className="drill-modal-title">Delete Session</span>
                    <button className="drill-icon-btn" onClick={() => setShowDelete(false)} style={{ border: 'none', background: 'transparent' }}>
                        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <div className="drill-modal-body">
                    <div className="drill-delete-title">
                        {`Delete "${selectedSession.title.length > 0 
                                    ? selectedSession.title 
                                    : 'this session'}" ?
                        `}
                    </div>
                    <div className="drill-delete-body">
                        This session will be permanently removed.
                    </div>
                </div>
                <div className="drill-modal-footer">
                    <button className="drill-btn drill-btn-danger-solid" onClick={deleteSession} disabled={isDeleting}>
                        {isDeleting ? 'Deleting...' : 'Delete Session'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export function SEND_CONFIRM({
    sendRef,
    setShowSend,
    unsentSessions,
    send,
    isSending
}) {
    return (
        <div id="drill-modal-overlay"
            onClick={(e) => {
                if (sendRef.current && !sendRef.current.contains(e.target)) {
                    setShowSend(false);
                }
            }}
        >
            <div className="drill-modal" ref={sendRef}>
                <div className="drill-modal-header">
                    <span className="drill-modal-title">Send Email Calendar Invitations</span>
                    <button className="drill-icon-btn" onClick={() => setShowSend(false)} style={{ border: 'none', background: 'transparent' }}>
                        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <div className="drill-modal-body">
                    <div className="drill-delete-title">
                        {`${unsentSessions.length === 0
                            ? 'You have no unsent calendar invitations.'
                            : 'Send calendar invitations?'
                        }`}
                    </div>
                    <div className="drill-delete-body">
                        You have {unsentSessions.length} sessions with unsent calendar invitations.
                    </div>
                </div>
                <div className="drill-modal-footer">
                    <button className="drill-btn drill-btn-primary" onClick={send} disabled={isSending || unsentSessions.length === 0}>
                        {isSending ? 'Sending...' : 'Send'}
                    </button>
                </div>
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
    selectedCoaches, selectedPlayers,
    selectedDrills,
    isMobile, 
    setShowMobileSessionCreator,
    currentCalendarView, setCurrentCalendarView,
    setShowSendEmail, fetchUnsentSessions,
    unsentSessions = []
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
            fetchUnsentSessions();
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
                <div id="calendar-date-btn-group">
                    <button
                        className='drill-btn drill-btn-secondary'
                        onClick={() => setShowSendEmail(true)}
                    >
                        <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" 
                                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" 
                            />
                        </svg>
                        Notify
                    </button>
                    {isMobile && currentCalendarView === 'timeGridDay' && (
                        <button
                            class="drill-btn drill-btn-primary"
                            onClick={() => setShowMobileSessionCreator(true)}
                        >
                            <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
                            </svg>
                            Add Session
                        </button>
                    )}
                </div>
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
                    datesSet={(info) => {
                        setCurrentCalendarView(info.view.type);
                        setIsAnimating(false);
                        setTimeout(() => {
                            setIsAnimating(true);
                            onDateChange(info.start, info.end);
                        }, 10);
                    }}
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
                    eventContent={(arg) => {
                        const isUnsent = unsentSessions.includes(arg.event.id);
                        const timeText = arg.timeText;
                        const title = arg.event.title;

                        return (
                            <div className='fc-event-main'>
                                <div className='fc-event-main-frame'>
                                    {!isMobile && (
                                        <div className='fc-event-time'>{timeText}</div>
                                    )}
                                    <div className='fc-event-title-container fc-sticky'>
                                        <div className='fc-event-title'>
                                            {isUnsent && (
                                                <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" 
                                                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" 
                                                    />
                                                </svg>
                                            )} {title}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    }}
                />
            </div>
        </div>
    );
});
