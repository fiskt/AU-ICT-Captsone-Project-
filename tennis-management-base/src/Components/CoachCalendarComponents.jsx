import '../App.css'
import '../pages/CoachCalendar.css'
import { DateTime, Info, Interval } from 'luxon'
import { useState, useEffect, useRef, forwardRef } from 'react';
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid' 
import timeGridPlugin from '@fullcalendar/timegrid' 
import { Draggable } from '@fullcalendar/interaction'
import interactionPlugin from '@fullcalendar/interaction'

import { createClient } from '@supabase/supabase-js';
const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY);

function CALENDAR_DATE({ firstDayOfActiveWeek, daysInWeek }) {
    const weekStart = firstDayOfActiveWeek.toFormat('MMM d');
    const weekEnd = (daysInWeek[0].month == daysInWeek[6].month) ?
        firstDayOfActiveWeek.endOf('week').toFormat('d, yyyy') :
        firstDayOfActiveWeek.endOf('week').toFormat('MMM d, yyyy');

    return (
        <h1 id="calendar-date">{weekStart} - {weekEnd}</h1>
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

// 1. Wrap CALENDAR_GRID in forwardRef
const CALENDAR_GRID = forwardRef(({ onSessionClick, events }, ref) => {
    async function pushSession({ name, duration, notes, time }) {
        const { data, error } = await supabase
            .from('sessions')
            .insert([{ name: name, duration: duration, notes: notes, time: time }]);
        console.log(data, error);
    }
  return (
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
        displayEventTime={true}
        displayEventEnd={true}
        editable={true}
        eventReceive = {(info) => {
            console.log(info.event.start)

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
  )
});

// 3. Wrap CALENDAR in forwardRef
export const CALENDAR = forwardRef(({ onSessionClick, events }, ref) => {
    const today = DateTime.now();
    const [firstDayOfActiveWeek, setFirstDayOfActiveWeek] = useState(
        today.startOf('week')
    );

    const weekInterval = Interval.fromDateTimes(
        firstDayOfActiveWeek, firstDayOfActiveWeek.endOf('week')
    );
    const daysInWeek = weekInterval.splitBy({ days: 1 }).map(d => d.start);
    
    return (
        <div id="calendar-grid-container">
            <CALENDAR_DATE 
                firstDayOfActiveWeek={firstDayOfActiveWeek} 
                daysInWeek={daysInWeek} 
            />
            <CALENDAR_GRID 
                ref={ref} 
                events={events}
                onSessionClick={onSessionClick}
            />
        </div>
    );
});
