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

import { Stars } from '../pages/DrillLibrary'

// make the user lists
// separate coach and players sections
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
        ? currentWeekStart.toFormat('MMMM d, yyyy') // single Day: "May 9, 2026"
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
