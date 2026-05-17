import '../App.css'
import '../pages/CoachCalendar.css'

import { DateTime, Info, Interval, Duration } from 'luxon';
import { useState, useEffect, useRef, forwardRef } from 'react';

import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import { Draggable } from '@fullcalendar/interaction';
import interactionPlugin from '@fullcalendar/interaction';

import 'tippy.js/dist/tippy.css'
import tippy from 'tippy.js';

import { createClient } from '@supabase/supabase-js';
const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY);

export const PLAYER_CALENDAR = forwardRef(({ 
    onSessionClick, 
    events, 
    onDateChange, 
    activeStart, activeEnd, 
    selectedSession, 
    selectedCoaches,
    selectedPlayers,
    isMobile
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

    return (
        <div id="calendar-container">
            <div id="calendar-date-container" >
                <h1 id="calendar-date" class="calendar-title-fade" key={activeStart?.toISODate()}>
                    {calendarTitle} 
                </h1>
            </div>
            <div className={`calendar-fade isAnimating ? "calendar-fade" : ""`}>
                <FullCalendar
                    plugins={[ dayGridPlugin, timeGridPlugin, interactionPlugin ]}
                    ref={ref}
                    events={events}
                    eventOverlap={false}
                    selectOverlap={false}
                    initialView={initialView}
                    showNonCurrentDates={false}
                    height="auto"
                    slotMinTime={"05:00:00"}
                    slotMaxTime={"22:00:00"}
                    expandRows={true}
                    eventClick={(info) => {
                        if (info.event.extendedProps.type === 'availability') return;
                        onSessionClick(info.event);
                    }}
                    headerToolbar={headerToolBar}
                    eventClassNames={(arg) => {
                        const classes = [];

                        const duration = arg.event.end - arg.event.start;
                        if (duration === 1800000) {
                            classes.push('short-event');
                        }

                        if (arg.event.extendedProps.type === 'availability') {
                            classes.push('availability-event');
                        } 

                        if (arg.event.extendedProps.type === 'other_availability') {
                            classes.push('other-avail-event');
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

                        if (info.event.extendedProps.type !== 'availability') {
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
                    editable={false}
                />
            </div>
        </div>
    );
});
