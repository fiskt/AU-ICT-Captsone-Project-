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
                                    const isActive = selectedUser?.user_id === coach.id && selectedUser?.table === 'session_coaches';

                                    return (
                                        <li 
                                        key={coach.id}
                                        className={`${isActive ? 'active' : ''}`}
                                        onClick={() => {
                                            setSelectedUser({
                                                table: 'session_coaches',
                                                user_id: coach.id
                                            });
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
                                    const isActive = selectedUser?.user_id === player.id && selectedUser?.table === 'session_players';

                                    return (
                                    <li 
                                        key={player.id}
                                        className={`${isActive ? 'active' : ''}`}
                                        onClick={() => {
                                            setSelectedUser({
                                                table: 'session_players',
                                                user_id: player.id
                                            });
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
    onTodayClick, 
    onDateChange, 
    activeStart, activeEnd, 
    selectedSession, 
    toggleTooltips, tooltipsEnabled, 
    selectedCoaches, setSelectedCoaches,
    selectedPlayers, setSelectedPlayers,
    currentUser
    }, ref) => {

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
            <div id="calendar-date-container">
                <h1 id="calendar-date" class="calendar-title-fade" key={activeStart?.toISODate()} >{weekStartStr} - {weekEndStr}</h1>
            </div>
            <div class="calendar-fade" className={isAnimating ? "calendar-fade" : ""}>
                <FullCalendar
                    plugins={[ dayGridPlugin, timeGridPlugin, interactionPlugin ]}
                    ref={ref}
                    events={events}
                    eventOverlap={false}
                    selectOverlap={false}
                    editable={false}
                    initialView="timeGridWeek"
                    eventClick={(info) => {
                        if (info.event.extendedProps.type === 'availability') return;
                        onSessionClick(info.event);
                    }}
                    headerToolbar={{
                        start: 'prev,next today', 
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
                    eventReceive = {(info) => {    
                        if (info.event.extendedProps.type === 'availability') {
                            pushAvailability({ event: info.event, coachId: currentUser.id});
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
