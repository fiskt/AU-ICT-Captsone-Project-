import '../App.css'
import '../pages/CoachCalendar.css'

import { DateTime, Info, Interval } from 'luxon'
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

export function CREATE_SESSION({ onAddClick }) {
    return (
        <div class="input-container">
            <div class="add-new-btn" id="add-session" onClick={onAddClick}>
                <span>New Session</span>
            </div>
        </div>
    );
}

export const CALENDAR = forwardRef(({ onSessionClick, events, onTodayClick, onDateChange, activeStart, activeEnd }, ref) => {
    const currentWeekStart = activeStart || DateTime.now().startOf('week');
    const currentWeekEnd = activeEnd.minus({ days: 1 }) || DateTime.now().endOf('week');
    console.log("current week", currentWeekStart);
    
    const weekStartStr = currentWeekStart.toFormat('MMM d');
    const weekEndStr = (currentWeekStart.month === currentWeekEnd.month) 
        ? currentWeekEnd.toFormat('d, yyyy') 
        : currentWeekEnd.toFormat('MMM d, yyyy');

    async function pushSession({ name, duration, notes, time }) {
        const { data, error } = await supabase
            .from('sessions')
            .insert([{ name: name, duration: duration, notes: notes, time: time }]);
        console.log(data, error);
    }

    return (
        <div id="calendar-grid-container">
            <div id="calendar-date-container">
                <h1 id="calendar-date">{weekStartStr} - {weekEndStr}</h1>
                <button onClick={onTodayClick}>Back to current week</button>
            </div>
            <FullCalendar
                plugins={[ dayGridPlugin, timeGridPlugin, interactionPlugin ]}
                ref={ref}
                events={events}
                initialView="timeGridWeek"
                eventClick={(info) => {
                    onSessionClick(info.event);
                }}
                headerToolbar={{
                    start: 'prev,next', 
                    end: 'dayGridMonth,timeGridWeek'
                }}
                datesSet={(dateInfo) => {
                    console.log("current date: ", dateInfo.start, "-", dateInfo.end);
                    onDateChange(dateInfo.start, dateInfo.end);
                }}
                eventDidMount={(info) => {
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
                }}
                displayEventTime={true}
                displayEventEnd={true}
                editable={true}
                eventReceive = {(info) => {    
                    const startTime = info.event.start.toISOString();
                    const sessionData = {
                        name: info.event.title,
                        duration: Interval.fromDateTimes(info.event.start, info.event.end).toDuration().toFormat('hh:mm'),
                        notes: info.event.extendedProps.notes || "",
                        time: startTime
                    }
                    console.log(startTime);
                    pushSession(sessionData);
                }}
            />
        </div>
    );
});
