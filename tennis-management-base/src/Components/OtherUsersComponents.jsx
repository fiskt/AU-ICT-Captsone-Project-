import '../App.css'
import '../pages/CoachCalendar.css'
import '../pages/OtherUsers.css'
import '../pages/DrillLibrary.css'

import '../pages/CalendarStyle.css'

import { DateTime, Info, Interval, Duration } from 'luxon'
import { useState, forwardRef } from 'react';

import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid' 
import timeGridPlugin from '@fullcalendar/timegrid' 
import { Draggable } from '@fullcalendar/interaction'
import interactionPlugin from '@fullcalendar/interaction'

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

export function USERS_LIST({ coaches = [], players = [], selectedUser, setSelectedUser }) {
    return (
        <div className="input-container" id="users-list-container">
            <div className="input-box-wrapper" id="users-list">
                {(coaches.length > 0) &&
                    <div>
                        <div className="users-role-title">Coaches</div>
                        {
                            <ul className="user-list">
                                {coaches.map((coach) => {
                                    const isActive = selectedUser === coach;

                                    return (
                                        <li 
                                        key={coach.id}
                                        className={`${isActive ? 'active' : ''}`}
                                        onClick={() => {
                                            setSelectedUser(coach);
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
                    <div>
                        <div className="users-role-title">Players</div>
                        {
                            <ul className="user-list">
                                {players.map((player) => {
                                    const isActive = selectedUser === player;

                                    return (
                                    <li 
                                        key={player.id}
                                        className={`${isActive ? 'active' : ''}`}
                                        onClick={() => {
                                            setSelectedUser(player);
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


export function SESSION_DETAILS_DRILLS({ selectedDrills }) {
    return (
        <>
            {selectedDrills.map((drill, index) => (
                <div key={drill.instanceId || `${drill.id}-${index}`}>
                    <DRILL_CARD 
                        drill={drill} 
                    />
                </div>
            ))}
        </>
    );
}

function DRILL_CARD({ drill }) {
    return (
        <div 
            className="drill-card" 
            key={drill.id}
        >
            <div className="drill-card-top">
                <TypeBadge type={drill.type} />
            </div>
            <div className="drill-card-name">{drill.name}</div>
            <div className="drill-card-name">{drill.description}</div>
            <div className="drill-card-footer">
            <Stars level={drill.level} />
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
    selectedUser,
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

    const currentViewText = selectedUser
        ? "Current calendar: " + selectedUser.first_name + " " + selectedUser.last_name
        : 'No user selected.'

    return (
        <div id="calendar-container">
            <div id="calendar-date-container">
                <h1 id="calendar-date" className="calendar-title-fade" key={activeStart?.toISODate()}>
                    {calendarTitle} 
                </h1>
                {!isMobile && (<span>{currentViewText}</span>)}
            </div>
            <div className={`calendar-fade isAnimating ? "calendar-fade" : ""`}>
                <FullCalendar
                    plugins={[ dayGridPlugin, timeGridPlugin, interactionPlugin ]}
                    ref={ref}
                    events={events}
                    slotDuration="00:10:00"
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
                    datesSet={(dateInfo) => {
                        setIsAnimating(false);
                        
                        setTimeout(() => {
                            setIsAnimating(true);
                            onDateChange(dateInfo.start, dateInfo.end);
                        }, 10);
                    }}
                    displayEventTime={!isMobile}
                    displayEventEnd={false}
                    editable={false}
                />
            </div>
        </div>
    );
});
