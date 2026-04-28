import '../App.css'
import '../pages/CoachCalendar.css'

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

function TICKBOX_SELECTOR({ names, selectedPeople, onToggle }) {
    return (
        <div>
            {names.map((name) => (
                <div class="people-selector-tickbox" key={name}>
                        <input
                            class="people-tickbox"
                            type="checkbox"
                            value={name}
                            checked={selectedPeople.includes(name)}
                            onChange={() => onToggle(name)}
                        />
                        <span>{name}</span>
                </div>
            ))}
        </div>
    );
}

export function PEOPLE_SELECTOR({ role, names }) {
    const [selectedPeople, setSelectedPeople] = useState([]);

    const handleToggle = (name) => {
        setSelectedPeople((prev) =>
            prev.includes(name) 
                ? prev.filter((p) => p !== name) 
                : [...prev, name]
        )
    }
    return (
        <div class="people-selector">
            <span class="people-selector-title">{role}</span>
            <TICKBOX_SELECTOR 
                names={names}
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

export const CALENDAR = forwardRef(({ onSessionClick, events, onTodayClick, onDateChange, activeStart, activeEnd, selectedSession, toggleTooltips, tooltipsEnabled }, ref) => {
    const todayStart = DateTime.now().startOf('week').minus({ days: 1 });
    const currentWeekStart = activeStart || todayStart;

    const onCurrentWeek = currentWeekStart.hasSame(todayStart, 'day');
    const currentWeekEnd = activeEnd ? activeEnd.minus({ days: 1 }) : currentWeekStart.endOf('week');

    const weekStartStr = currentWeekStart.toFormat('MMM d');
    const weekEndStr = (currentWeekStart.month === currentWeekEnd.month) 
        ? currentWeekEnd.toFormat('d, yyyy') 
        : currentWeekEnd.toFormat('MMM d, yyyy');

    const [isAnimating, setIsAnimating] = useState(false);

    async function pushSession({ name, duration, notes, time }) {
        const { data, error } = await supabase
            .from('sessions')
            .insert([{ name: name, duration: duration, notes: notes, time: time }]);
        console.log(data, error);
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
            <div id="calendar-date-container">
                <h1 id="calendar-date" class="calendar-title-fade" key={activeStart?.toISODate()} >{weekStartStr} - {weekEndStr}</h1>
                <div id="calendar-date-middle">
                    <button onClick={toggleTooltips} class="calenar-title-fade">toggle tooltips</button>
                </div>
                {!onCurrentWeek && (
                    <button onClick={onTodayClick} class="calendar-title-fade">Back to current week</button>
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
                        if (info.event.extendedProps.type === 'availability') return;
                        const duration = info.event.extendedProps.duration || "-";
                        const notes = info.event.extendedProps.notes || "No notes";

                        if (tooltipsEnabled) {
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
                    }}
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
                            pushSession(sessionData);
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
