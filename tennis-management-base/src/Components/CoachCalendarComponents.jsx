import '../App.css'
import '../pages/CoachCalendar.css'

import { DateTime, Info, Interval, Duration } from 'luxon'
import React, { useState, useEffect, useRef, forwardRef } from 'react';

import { ContextMenu } from 'primereact/contextmenu'
import "primereact/resources/themes/lara-light-indigo/theme.css"; 
import "primereact/resources/primereact.min.css";

import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid' 
import timeGridPlugin from '@fullcalendar/timegrid' 
import { Draggable } from '@fullcalendar/interaction'
import interactionPlugin from '@fullcalendar/interaction'

import 'tippy.js/dist/tippy.css'
import tippy from 'tippy.js';

import { createClient } from '@supabase/supabase-js';
const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY);

function TICKBOX_SELECTOR({ people, selectedPeople, onToggle }) {
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

export function PEOPLE_SELECTOR({ role, people, selectedPeople, setSelectedPeople }) {

    const handleToggle = (id) => {
        setSelectedPeople((prev) =>
            prev.includes(id) 
                ? prev.filter((p) => p !== id) 
                : [...prev, id]
        )
    }
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

export function DRAGGABLE_SESSION({ sessionSettings }) {
    const sessionRef = useRef(null);

    useEffect(() => {
        let session = new Draggable(sessionRef.current, {
            eventData: () => {
                return {
                    title: sessionSettings.sessionName,
                    duration: sessionSettings.sessionDuration,
                    extendedProps: {
                        notes: sessionSettings.sessionNotes,
                        people: sessionSettings.sessionPeople
                    }
                };
            }
        })
        return () => session.destroy();
    }, [sessionSettings]);

    return (
        <div class="input-container">
            <span class="input-container-label">SESSION</span>
            <div class="input-box-wrapper" id="draggable-session-container">
                <div ref={sessionRef} class="draggable-icon session-icon">
                    <span>{sessionSettings.sessionName}</span>
                    <span>{sessionSettings.sessionDuration}</span>
                </div>
            </div>
        </div>
    );
}

export function DRAGGABLE_AVAILABILITY({ availSettings }) {
    const availRef = useRef(null);

    useEffect(() => {
        let avail = new Draggable(availRef.current, {
            eventData: () => {
                return {
                    title: availSettings.availNotes,
                    duration: availSettings.availDuration,
                    start: availSettings.availStart,
                    end: availSettings.availEnd,
                    extendedProps: {
                        type: 'availability'
                    }
                };
            }
        })
        return () => avail.destroy();
    }, [availSettings]);

    return (
        <div class="input-container">
            <span class="input-container-label">UNAVAILABLE</span>
            <div class="input-box-wrapper" id="draggable-session-container">
                <div ref={availRef} class="draggable-icon session-icon">
                    <span>{availSettings.availNotes}</span>
                </div>
            </div>
        </div>
    );
}

export function DRAGGABLE_DRILL({ drillSettings }) {
    const drillRef = useRef(null);

    useEffect(() => {
        let drill = new Draggable(drillRef.current, {
            eventData: () => {
                return {
                    drillName: drillSettings.drillName,
                    drillDuration: drillSettings.drillDuration,
                    drillDescription: drillSettings.drillDescription,
                    drillTags: drillSettings.drillTags
                };
            }
        })
        return () => drill.destroy();
    }, [drillSettings]);

    return (
        <div class="input-container">
            <div ref={drillRef} class="draggable-icon session-icon">
                <span>{drillSettings.drillName}</span>
                <span>{drillSettings.drillDuration}</span>
            </div>
        </div>
    );
}

export const CALENDAR = forwardRef(({ 
    onSessionClick, 
    events, 
    onTodayClick, 
    onDateChange, 
    activeStart, activeEnd, 
    selectedSession, 
    toggleTooltips, tooltipsEnabled, 
    selectedCoaches, setSelectedCoaches,
    selectedPlayers, setSelectedPlayers,
    handleDelete
    }, ref) => {

        const cm = useRef(null);
    const [targetEvent, setTargetEvent] = useState(null);

    // Define your menu items
    const menuModel = [
        { 
            label: 'Edit Session', 
            icon: 'pi pi-pencil', 
            command: () => onSessionClick(targetEvent) 
        },
        { 
            label: 'Delete', 
            icon: 'pi pi-trash', 
            className: 'text-red-500',
            command: () => handleDelete(targetEvent) 
        }
    ];
    const todayStart = DateTime.now().startOf('week').minus({ days: 1 });
    const currentWeekStart = activeStart || todayStart;

    const onCurrentWeek = currentWeekStart.hasSame(todayStart, 'day');
    const currentWeekEnd = activeEnd ? activeEnd.minus({ days: 1 }) : currentWeekStart.endOf('week');

    const weekStartStr = currentWeekStart.toFormat('MMM d');
    const weekEndStr = (currentWeekStart.month === currentWeekEnd.month) 
        ? currentWeekEnd.toFormat('d, yyyy') 
        : currentWeekEnd.toFormat('MMM d, yyyy');

    const [isAnimating, setIsAnimating] = useState(false);

    async function pushSession({ event, sessionSettings }) {
        const { data: session, error: sessionError } = await supabase
            .from('sessions')
            .insert([{ 
                name: sessionSettings.name, 
                duration: sessionSettings.duration, 
                notes: sessionSettings.notes, 
                time: sessionSettings.time 
            }])
            .select()
            .single();

        if (session) {
            const sessionID = session.id;

            const sessionCoaches = selectedCoaches.map(coachID => ({
                session_id: sessionID,
                coach_id: coachID
            }));

            const sessionPlayers = selectedPlayers.map(playerID => ({
                session_id: sessionID,
                player_id: playerID
            }));

            await Promise.all([
                sessionCoaches.length > 0 && supabase.from('session_coaches').insert(sessionCoaches),
                sessionPlayers.length > 0 && supabase.from('session_players').insert(sessionPlayers)
            ]);

            event.setProp('id', sessionID);
        } else {
            console.log(sessionError);
        }
    }

    async function updateAvailability(event) {
        if (!event.id || !event.start || !event.end) return;

        // get start and end
        const start = DateTime.fromJSDate(event.start);
        const end = DateTime.fromJSDate(event.end);

        // difference of end and start time to get the duration
        const newDuration = end.diff(start).toFormat('hh:mm:ss');

        const { error } = await supabase
            .from('coach_availability')
            .update({
                start_datetime: start.toISO(),
                end_datetime: end.toISO(),
                duration: newDuration
            })
            .eq('avail_id', event.id);

        if (error) console.error(error.message);
    }

    async function pushAvailability({ event, coachId }) {
        if (!event || !event.start) return;

        // start and end times, default availability slot is 1h
        const start = DateTime.fromJSDate(event.start);
        const end = event.end 
            ? DateTime.fromJSDate(event.end) 
            : start.plus({ hours: 1 });

        // calculate duration with end - start
        const durationStr = end.diff(start).toFormat('hh:mm:ss');

        const { data, error } = await supabase
            .from('coach_availability')
            .insert([{
                coach_id: coachId,
                start_datetime: start.toISO(),
                end_datetime: end.toISO(),
                duration: durationStr,
                notes: event.title || ""
            }])
            .select()
            .single();

        if (data) {
            event.setProp('id', data.avail_id);
        }
    }

    return (
        <div id="calendar-container">
            <ContextMenu model={menuModel} ref={cm} />
            <div id="calendar-date-container">
                <h1 id="calendar-date" class="calendar-title-fade" key={activeStart?.toISODate()} >{weekStartStr} - {weekEndStr}</h1>
                <div id="calendar-date-middle">
                    <button onClick={toggleTooltips} class="calenar-title-fade btn">toggle tooltips</button>
                </div>
                {!onCurrentWeek && (
                    <button onClick={onTodayClick} class="calendar-title-fade btn">Back to current week</button>
                )}
            </div>
            <div class="calendar-fade" className={isAnimating ? "calendar-fade" : ""}>
                <FullCalendar
                    plugins={[ dayGridPlugin, timeGridPlugin, interactionPlugin ]}
                    ref={ref}
                    events={events}
                    eventOverlap={false}
                    selectOverlap={false}
                    initialView="timeGridWeek"
                    eventClick={(info) => {
                        if (info.event.extendedProps.type === 'availability') return;
                        onSessionClick(info.event);
                    }}
                    headerToolbar={{
                        start: 'prev,next', 
                        end: 'dayGridMonth,timeGridWeek'
                    }}
                    eventClassNames={(arg) => {
                        if (arg.event.extendedProps.type === 'availability') {
                            return ['availability-event'];
                        } 

                        if (selectedSession && arg.event.id === selectedSession.id) {
                            return ['selected-session'];
                        } 
                        
                        return [];
                    }}
                    datesSet={(dateInfo) => {
                        setIsAnimating(false);
                        
                        setTimeout(() => {
                            setIsAnimating(true);
                            onDateChange(dateInfo.start, dateInfo.end);
                        }, 10);
                    }}
                    eventDidMount={(info) => {
                        info.el.addEventListener("contextmenu", (e) => {
        e.preventDefault();

        setTargetEvent(info.event);

        cm.current.show(e);
    });
                        if (tooltipsEnabled && info.event.extendedProps.type !== 'availability') {
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
                    displayEventTime={true}
                    displayEventEnd={true}
                    editable={true}
                    eventReceive = {(info) => {    
                        if (info.event.extendedProps.type === 'availability') {
                            pushAvailability({ event: info.event, coachId: null});
                        } else {
                            const startTime = info.event.start.toISOString();
                            const tempID = "temp-" + Date.now();
                            info.event.setProp("id", tempID);
                            const sessionData = {
                                id: tempID,
                                name: info.event.title,
                                duration: Interval.fromDateTimes(info.event.start, info.event.end).toDuration().toFormat('hh:mm'),
                                notes: info.event.extendedProps.notes || "",
                                time: startTime
                            }
                            pushSession({ event: info.event, sessionSettings: sessionData });
                        }
                    }}
                    eventDrop={(info) => {
                        if (info.event.extendedProps.type === 'availability') {
                            updateAvailability(info.event);
                        }
                    }}
                    eventResize={(info) => {
                        if (info.event.extendedProps.type === 'availability') {
                            updateAvailability(info.event);
                        }
                    }}
                />
            </div>
        </div>
    );
});
