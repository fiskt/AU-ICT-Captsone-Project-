import '../App.css'
import '../pages/CoachCalendar.css'
import { DateTime, Info, Interval } from 'luxon'
import { useState } from 'react';
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid' 
import timeGridPlugin from '@fullcalendar/timegrid' 

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