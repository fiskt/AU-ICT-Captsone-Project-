import '../App.css'
import '../pages/CoachCalendar.css'
import '../pages/OtherUsers.css'

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

export function USERS_LIST({ coaches = [], players = [], selectedUser, setSelectedUser }) {
    return (
        <div class="input-container">
            <div class="input-box-wrapper session-people">
                {(coaches.length > 0) &&
                    <div class="people-selector">
                        <span class="people-selector-title">COACHES</span>
                        {
                            <ul class="user-list">
                                {coaches.map((coach) => {
                                    const isActive = selectedUser === coach.id;

                                    return (
                                        <li 
                                        key={coach.id}
                                        className={`${isActive ? 'active' : ''}`}
                                        onClick={() => {
                                            setSelectedUser(coach.id);
                                            console.log(coach.id);
                                        }}
                                    >
                                        <span>{coach.first_name} {coach.last_name}</span>
                                    </li>
                                    );
                                })}
                            </ul>
                        }
                    </div>
                }

                {(players.length > 0) && 
                    <div class="people-selector">
                        <span class="people-selector-title">PLAYERS</span>
                        {
                            <ul class="user-list">
                                {players.map((player) => {
                                    const isActive = selectedUser === player.id;

                                    return (
                                    <li 
                                        key={player.id}
                                        className={`${isActive ? 'active' : ''}`}
                                        onClick={() => {
                                            setSelectedUser(player.id);
                                            console.log(player.id);
                                        }}
                                    >
                                        <span>{player.first_name} {player.last_name}</span>
                                    </li>
                                    );
                                })}
                            </ul>
                        }
                    </div>
                }
            </div>
        </div>
    );
}


export const OTHER_CALENDARS = forwardRef(({ 
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
    showOtherUserAvail, setShowOtherUserAvail
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
                end_datetime: end.toISO()
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
        } else {
            console.log(error);
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
                    displayEventTime={!isMobile}
                    displayEventEnd={false}
                    editable={false}
                />
            </div>
        </div>
    );
});
