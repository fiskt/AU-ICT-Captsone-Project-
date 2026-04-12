import '../App.css'
import '../pages/CoachCalendar.css'
import { DateTime, Info, Interval } from 'luxon'
import { useState, useEffect, useRef } from 'react';
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid' 
import timeGridPlugin from '@fullcalendar/timegrid' 
import { Draggable } from '@fullcalendar/interaction'

function CALENDAR_DATE({ firstDayOfActiveWeek, daysInWeek }) {
    const weekStart = firstDayOfActiveWeek.toFormat('MMM d');
    const weekEnd = (daysInWeek[0].month == daysInWeek[6].month) ?
        firstDayOfActiveWeek.endOf('week').toFormat('d, yyyy') :
        firstDayOfActiveWeek.endOf('week').toFormat('MMM d, yyyy');

    return (
        <h1 id="calendar-date">{weekStart} - {weekEnd}</h1>
    );
}

function CALENDAR_GRID() {
  return (
    <FullCalendar
        plugins={[ dayGridPlugin, timeGridPlugin ]}
        initialView="timeGridWeek"
        headerToolbar={{
            start: 'prev,next', 
            end: 'dayGridMonth,timeGridWeek'
        }}
    />
  )
}

export function DRAGGABLE_SESSION({ sessionSettings }) {
    const sessionRef = useRef(null);

    useEffect(() => {
        let session = new Draggable(sessionRef.current, {
            eventData: () => {
                return {
                    sessionName: sessionSettings.sessionName,
                    sessionDuration: sessionSettings.sessionDuration,
                    sessionNotes: sessionSettings.sessionNotes,
                    sessionPeople: sessionSettings.sessionPeople
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

export function CALENDAR() {
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
            <CALENDAR_GRID />
        </div>
    );
}