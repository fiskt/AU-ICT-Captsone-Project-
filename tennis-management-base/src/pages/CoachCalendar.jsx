import { DROPDOWN_INPUT, LOADING_OVERLAY, TYPING_INPUT } from '../Components/SharedComponents.jsx';
import { CALENDAR, DRAGGABLE_SESSION, PEOPLE_SELECTOR, SIMPLE_DRILL_CARD, SESSION_CREATOR_DRILLS, DELETE_CONFIRM, SEND_CONFIRM, MOBILE_DURATION_INPUT } from '../Components/CoachCalendarComponents.jsx';
import { useState, useRef, useEffect } from 'react';

import { useCurrentUser } from '../hooks/useCurrentUser.jsx';
import { useLocation } from "react-router-dom";

import { DateTime, Duration } from 'luxon';

import { supabase } from '../supabaseClient'

export default function CoachCalendar() {
    /* CURRENT USER ------------------------------------------------------------------------ */ 
    const { userId: currentUserID, isLoading: authLoading } = useCurrentUser();
    const location = useLocation();
    const openSessionId = location.state?.openSessionId;



    /* LOADING SCREEN STATE ------------------------------------------------------------------------ */ 
    const [isDataLoading, setIsDataLoading] = useState(true);



    /* SESSION CREATOR STATE ------------------------------------------------------------------------ */ 
    const [showSessionCreator, setShowSessionCreator] = useState(false);



    /* CALENDAR ------------------------------------------------------------------------ */ 
    const [calendarEvents, setCalendarEvents] = useState([]);   // array of events for the calendar

    const [weekStart, setWeekStart] = useState(DateTime.now().startOf('week'));
    const [weekEnd, setWeekEnd] = useState(DateTime.now().endOf('week'));

     const handleDateChange = (start, end) => { 
        setWeekStart(DateTime.fromJSDate(start));
        setWeekEnd(DateTime.fromJSDate(end));
    };

    async function fetchCalendarData() {
        if (!currentUserID) return;
        setIsDataLoading(true);
        
        // fetch data from the database
        const { data, error } = await supabase
            .from('sessions')
            .select(`
                *,
                session_people!inner(user_id)
            `)
            .eq('session_people.user_id', currentUserID);

        // set the session data for the calendar events
        const session = (data || []).map(ses => {
            const startTime = DateTime.fromISO(ses.start_datetime);
            const endTime = DateTime.fromISO(ses.end_datetime);
            const duration = Duration.fromISOTime(ses.duration);
            return {
                id: ses.id,
                title: ses.name,
                start: startTime.toISO(),
                end: endTime.toISO(),
                extendedProps: {
                    type: 'session',
                    duration: duration,
                    rpe: ses.rpe,
                    notes: ses.notes
                }
            };
        })
        setCalendarEvents(session);
        setIsDataLoading(false);
    }



    /* REFS ------------------------------------------------------------------------ */ 
    const calendarRef = useRef(null);
    const sessionEditorRef = useRef(null);
    const drillLibraryRef = useRef(null);
    const mobileSessionEditorRef = useRef(null);
    const mobileSessionCreatorRef = useRef(null);
    const deleteConfirmRef = useRef(null);
    const sendEmailRef = useRef(null);



    /* EMAIL NOTIFICATION ------------------------------------------------------------------------ */ 
    const [showSendEmail, setShowSendEmail] = useState(false);  // show state for sending popup
    const [isSending, setIsSending] = useState(false);  

    const [unsentSessions, setUnsentSessions] = useState([]);   // array of session IDs with unsent notifs

    async function fetchUnsentSessions() {
        // fetch all sessions with unsent notifs
        const { data, error } = await supabase
            .from('sessions')
            .select('id')
            .eq('sent_notify', false);

        if (error) {
            console.log("Error fetching session IDs for email invites: ", error.message);
            setUnsentSessions([]);
        } else {
            if (data.length === 0) {
                setUnsentSessions([]);
                return;
            }
            const ids = data.map(ses => ses.id);    // store the ids in an array
            setUnsentSessions(ids);
        }
    }

    async function sendEmail() {
        setIsSending(true);

        // send out the emails in parallel
        await Promise.allSettled(
            unsentSessions.map(id =>
                fetch('/api/notify-session-created', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ sessionId: id })
                })
            )
        );

        // update database, change sent status to true
        const { error: sent_update_error } = await supabase
            .from('sessions')
            .update({ sent_notify: true })
            .in('id', unsentSessions);

        if (sent_update_error) {
            console.log("Error updating sent_notify:", sent_update_error.message);
        }

        fetchUnsentSessions();      // re-fetch unsent sessions
        setIsSending(false);        
        setShowSendEmail(false);    // close the popup
    }



    /* SESSION SETTINGS ------------------------------------------------------------------------ */ 
    const [sessionSettings, setSessionSettings] = useState(() => {
        // save a draft of the name, notes, rpe in local storage
        // apply the draft if there is one
        const savedDraft = localStorage.getItem('session_creator_draft');
        return savedDraft ? JSON.parse(savedDraft) : {
            sessionName: "Session Name",
            sessionRPE: "",
            sessionDuration: "01:00:00",
            sessionNotes: "",
            sessionStart: "",
            sessionEnd: ""
        };
    });

    // update function for session settings const
    const updateSessionField = (field, value) => {
        setSessionSettings({
            ...sessionSettings,
            [field]: value 
        });
    }

    useEffect(() => {
        localStorage.setItem('session_creator_draft', JSON.stringify(sessionSettings));
    }, [sessionSettings]);


    
    /* MOBILE DETECTION ------------------------------------------------------------------------ */ 
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768); 
    const [currentCalendarView, setCurrentCalendarView] = useState(
            isMobile 
            ? 'timeGridDay' 
            : 'timeGridWeek'
        );

    useEffect(() => {
        // change the isMobile state depending on the active window size
        const handleResize = () => {
            setIsMobile(window.innerWidth < 768);
        };

        window.addEventListener('resize', handleResize);
    
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    
    useEffect(() => {
        // update the current calendar view to make sure week view doesnt show on mobile
        const calendarApi = calendarRef.current?.getApi();
        if (!calendarApi) return;

        calendarApi.changeView(isMobile ? "timeGridDay" : "timeGridWeek");
        calendarApi.updateSize();
        
    }, [isMobile]);



    /* USERS ------------------------------------------------------------------------ */ 
    const [coaches, setCoaches] = useState([]); 
    const [players, setPlayers] = useState([]); 

    // holds the coaches/players that are currently selected in the tickboxes
    // stores only id
    const [selectedCoaches, setSelectedCoaches] = useState([]);
    const [selectedPlayers, setSelectedPlayers] = useState([]);

    // holds the edited selected users from tickboxes
    const [editedSessionCoaches, setEditedSessionCoaches] = useState([]);
    const [editedSessionPlayers, setEditedSessionPlayers] = useState([]);

    async function fetchCoaches() {
        // fetches all coaches
        const { data, error } = await supabase
            .from('signin_details')
            .select('*')
            .eq('role', 'coach');

        if (error) {
            console.log("Error when fetching coaches: ", error.message);
            setCoaches([]);
        } else {
            setCoaches(data);
            console.log("coaches", coaches);
        }
    }

    async function fetchPlayers() {
        // fetches all players
        const { data, error } = await supabase
            .from('signin_details')
            .select('*')
            .eq('role', 'player');

        if (error) {
            console.log("Error when fetching players: ", error.message);
            setPlayers([]);
        } else {
            setPlayers(data);
            console.log("players", players);
        }
    }

    async function fetchSessionCoaches(sessionId) {
        // fetches coaches that are in the selected session
        const { data, error } = await supabase
            .from('session_people')
            .select(`
                user_id,
                signin_details!inner ( role )    
            `)
            .eq('session_id', sessionId)
            .eq('signin_details.role', 'coach');

        if (error) {
            console.log("Error when fetching selected session coaches: ", error.message);
            return [];
        } else {
            return data.map(item => item.user_id);  
        }
    }

    async function fetchSessionPlayers(sessionId) {
        // fetches coaches that are in the selected session
        const { data, error } = await supabase
            .from('session_people')
            .select(`
                user_id,
                signin_details!inner ( role )
            `)
            .eq('session_id', sessionId)
            .eq('signin_details.role', 'player');

        if (error) {
            console.log("Error when fetching selected session players: ", error.message);
            return [];
        } else {
            return data.map(item => item.user_id);
        }
    }



    /* MOBILE SESSION CREATOR/EDITOR ------------------------------------------------------------------------ */ 
    const [showMobileSessionCreator, setShowMobileSessionCreator] = useState(false);

    const mobileHours = [
        { name: "05", val: "05" },
        { name: "06", val: "06" },
        { name: "07", val: "07" },
        { name: "08", val: "08" },
        { name: "09", val: "09" },
        { name: "10", val: "10" },
        { name: "11", val: "11" },
        { name: "12", val: "12" },
        { name: "13", val: "13" },
        { name: "14", val: "14" },
        { name: "15", val: "15" },
        { name: "16", val: "16" },
        { name: "17", val: "17" },
        { name: "18", val: "18" },
        { name: "19", val: "19" },
        { name: "20", val: "20" },
        { name: "21", val: "21" },
    ];

    const mobileMinutes = [
        { name: "00", val: "00" },
        { name: "10", val: "10" },
        { name: "20", val: "20" },
        { name: "30", val: "30" },
        { name: "40", val: "40" },
        { name: "50", val: "50" },
    ];

    const mobileDurationHours = [
        { name: "0h", val: "00" },
        { name: "1h", val: "01" },
        { name: "2h", val: "02" },
        { name: "3h", val: "03" },
        { name: "4h", val: "04" },
        { name: "5h", val: "05" },
        { name: "6h", val: "06" },
        { name: "7h", val: "07" },
        { name: "8h", val: "08" },
        { name: "9h", val: "09" },
        { name: "10h", val: "10" },
        { name: "11h", val: "11" },
        { name: "12h", val: "12" },
        { name: "13h", val: "13" },
        { name: "14h", val: "14" },
        { name: "15h", val: "15" },
        { name: "16h", val: "16" },
    ];

    const mobileDurationMinutes = [
        { name: "00m", val: "00" },
        { name: "10m", val: "10" },
        { name: "20m", val: "20" },
        { name: "30m", val: "30" },
        { name: "40m", val: "40" },
        { name: "50m", val: "50" },
    ];

    const CALENDAR_END_HOUR = 22;

    function getMaxDurationFromStart(startHour, startMin) {
        const startTotalMin = parseInt(startHour) * 60 + parseInt(startMin);
        const endTotalMin = CALENDAR_END_HOUR * 60;
        const remainingMin = endTotalMin - startTotalMin;
        return remainingMin;  // max duration in minutes
    }

    const [mobileStartHour, setMobileStartHour] = useState("06");
    const [mobileStartMin, setMobileStartMin] = useState("00");

    const [mobileDurationHour, setMobileDurationHour] = useState("01");
    const [mobileDurationMin, setMobileDurationMin] = useState("00");

    const maxDurationMin = getMaxDurationFromStart(mobileStartHour, mobileStartMin);
    const maxHours = Math.floor(maxDurationMin / 60);
    const maxMinAtCurrentHour = maxDurationMin - (parseInt(mobileDurationHour) * 60);

    const validDurationHours = mobileDurationHours.filter(h => parseInt(h.val) <= maxHours);
    const validDurationMinutes = mobileDurationMinutes.filter(m => parseInt(m.val) <= maxMinAtCurrentHour);

    useEffect(() => {
        const maxMin = getMaxDurationFromStart(mobileStartHour, mobileStartMin);
        const currentDurationMin = parseInt(mobileDurationHour) * 60 + parseInt(mobileDurationMin);
        
        if (currentDurationMin > maxMin) {
            // Snap to max valid duration
            const newHour = Math.floor(maxMin / 60).toString().padStart(2, '0');
            const newMin = (maxMin % 60).toString().padStart(2, '0');
            setMobileDurationHour(newHour);
            setMobileDurationMin(newMin);
        } else {
            // Within the hour boundary, just check the minutes
            const maxMinAtHour = maxMin - (parseInt(mobileDurationHour) * 60);
            if (parseInt(mobileDurationMin) > maxMinAtHour) {
                setMobileDurationMin(maxMinAtHour.toString().padStart(2, '0'));
            }
        }
    }, [mobileStartHour, mobileStartMin, mobileDurationHour]);


    async function mobilePushSession({ currentDay, sessionSettings, startHour, startMin, durationStr }) {
        if (
            !sessionSettings ||
            sessionSettings.name.length === 0 || 
            sessionSettings.rpe <= 0 || 
            sessionSettings.selectedCoaches.length === 0 ||
            sessionSettings.selectedPlayers.length === 0
        ) return;

        // combine the currently displayed day and the selected times 
        const start = DateTime.fromISO(`${currentDay.toISODate()}T${startHour}:${startMin}:00`);
        const durationParts = durationStr.split(':');
        const durationObj = Duration.fromObject({
            hours: parseInt(durationParts[0]),
            minutes: parseInt(durationParts[1]),
            seconds: parseInt(durationParts[2])
        });
        const end = start.plus(durationObj);

        const { data, error } = await supabase
            .from('sessions')
            .insert([{ 
                name: sessionSettings.sessionName, 
                duration: durationStr, 
                notes: sessionSettings.sessionNotes, 
                start_datetime: start.toISO(),
                end_datetime: end.toISO(),
                rpe: sessionSettings.sessionRPE
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
            
            // insert the users and drills into the database tables
            await Promise.all([
                sessionCoaches.length > 0 && supabase.from('session_people').insert(sessionCoaches),
                sessionPlayers.length > 0 && supabase.from('session_people').insert(sessionPlayers),
                sessionDrills.length > 0 && supabase.from('session_drills').insert(sessionDrills)
            ]);

            const updateRows = selectedPlayers.map(playerId => ({
                player_id: playerId,
                session_id: data.id,
                type: "Session Added",
                message: `${sessionSettings.sessionName} was added for your schedule.`
            }));

            if (updateRows.length > 0) {
                const { error: updateError } = await supabase
                    .from("coach_updates")
                    .insert(updateRows);

                if (updateError) {
                    console.log("Error saving coach update:", updateError.message);
                }
            }
            fetchCalendarData();
            setShowMobileSessionCreator(false);
        } else {
            console.log(error);
        }
    }


    /* DRILLS ------------------------------------------------------------------------ */ 

    const [drills, setDrills] = useState([]);
    const [showAddDrill, setShowAddDrill] = useState(false);

    // Drill filters
    const [filteredDrills, setFilteredDrills] = useState([]);           // Array of filtered drills
    const [drillSearchQuery, setDrillSearchQuery] = useState("");       // Search bar filters
    const [drillSearchFilter, setDrillSearchFilter] = useState("ALL");  // Tag filters

    const [selectedDrills, setSelectedDrills] = useState([]);               // Drills selected in the session creator
    const [editedSessionDrills, setEditedSessionDrills] = useState([]);     // Edited drills

    async function fetchDrills() {
        const { data, error } = await supabase
            .from('drill_library')
            .select('*');

        if (error) {
            console.log("Error when fetching drills: ", error.message);
            setDrills([]);
        } else {
            setDrills(data);
        }
    }

    async function fetchSessionDrills(sessionId) {
        // Fetch drills that are used in the current session
        const { data } = await supabase
            .from('session_drills')
            .select('drill_id, order')
            .eq('session_id', sessionId)
            .order('order', { ascending: true });
        
        return data || [];
    }

    const addDrillToSession = (drill) => {
        // give the drills a unique id for ordering them
        const newInstance = { 
            ...drill, 
            instanceId: Date.now() + Math.random()
        };
        setSelectedDrills(prev => [...prev, newInstance]);
        setShowAddDrill(false);
    };

    const removeDrillFromSession = (instanceIdToRemove) => {
        // remove the drill and maintain the ordering
        setSelectedDrills(prev => {
            const updatedList = prev.filter(drill => drill.instanceId !== instanceIdToRemove);
            
            return updatedList.map((drill, index) => ({
                ...drill,
                sort_order: index
            }));
        });
    };

    const addDrillToSelectedSession = (drill) => {
        const newInstance ={
            ...drill,
            instanceId: Date.now() + Math.random()
        };
        setEditedSessionDrills(prev => [...prev, newInstance]);
        setShowAddDrill(false);
    };

    const removeDrillFromSelectedSession = (instanceIdToRemove) => {
        setEditedSessionDrills(prev => {
            const updatedList = prev.filter(drill => drill.instanceId !== instanceIdToRemove);
            
            return updatedList.map((drill, index) => ({
                ...drill,
                sort_order: index
            }));
        });
    };

    const [drillTags, setDrillTags] = useState([]);
    const [drillLibraryTags, setDrillLibraryTags] = useState([]);

    async function fetchDrillTags() {
        // Fetches all the drill tags
        const { data, error } = await supabase
            .from('drill_tags')
            .select('*');

        if (error) {
            console.log("Error fetching drill tags: ", error.message);
            setDrillTags([]);
        } else {
            setDrillTags(data);
        }
    }

    async function fetchDrillLibraryTags() {
        // Fetches the tags and the drill they are attached to
        const { data, error } = await supabase
            .from('drill_library_tags')
            .select('*');

        if (error) {
            console.log("Error fetching drill library tags: ", error.message);
            setDrillLibraryTags([]);
        } else {
            setDrillLibraryTags(data);
        }
    }

    useEffect(() => {
        const q = drillSearchQuery.toLowerCase().trim();

        let drillTagsLink = null;
        if (drillSearchFilter !== "ALL") {
            drillTagsLink = new Set(
                drillLibraryTags
                    .filter(tag => tag.tag_id === drillSearchFilter)
                    .map(tag => tag.drill_id)
            );
        }

        const filtered = drills.filter(drill => {
            const matchesQuery = q === "" || drill.name.toLowerCase().includes(q);
            const matchesFilter = drillTagsLink === null || drillTagsLink.has(drill.id);
            return matchesQuery && matchesFilter;
        });

        setFilteredDrills(filtered);
    }, [drills, drillSearchQuery, drillSearchFilter, drillLibraryTags]);
    


    /* DELETE SESSION ------------------------------------------------------------------------ */
    const [isDeleting, setIsDeleting] = useState(false);
    const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);

    async function deleteSession() {
        setIsDeleting(true);
        await supabase
            .from("coach_updates")
            .delete()
            .eq("session_id", selectedSession.id);

        await supabase
            .from("session_drills")
            .delete()
            .eq("session_id", selectedSession.id);

        await supabase
            .from("session_feedback")
            .delete()
            .eq("session_id", selectedSession.id);

        await supabase
            .from("session_people")
            .delete()
            .eq("session_id", selectedSession.id);

        const { error } = await supabase
            .from('sessions')
            .delete()
            .eq('id', selectedSession.id);

        if (error) {
            console.log("Error when deleting session. Please try again.");
            setIsDeleting(false);
            setShowDeleteConfirmation(false);
        } else {
            selectedSession.remove();           // remove session from calendar
            setIsDeleting(false);
            setShowDeleteConfirmation(false);   // close delete confirm popup
            setShowSessionEditor(false);        // close session editor for current session
            setSelectedSession(null);
            fetchCalendarData();                // re-fetch calendar data
        }
    }

    /* SESSION EDITOR ------------------------------------------------------------------------ */ 
    const [showSessionEditor, setShowSessionEditor] = useState(false);
    const [selectedSession, setSelectedSession] = useState(null);

    const [tempSession, setTempSession] = useState(null);

    useEffect(() => {
        const loadSessionData = async () => {
            if (selectedSession) {
                setIsDataLoading(true);

                const [sessionCoaches, sessionPlayers, sessionDrillIDs] = await Promise.all([
                    fetchSessionCoaches(selectedSession.id),
                    fetchSessionPlayers(selectedSession.id),
                    fetchSessionDrills(selectedSession.id),
                ]);

                const sessionDrills = sessionDrillIDs.map((drill, index) => {
                    const masterDrill = drills.find(d => d.id === drill.drill_id);
                    console.log("drill id: ", drill.drill_id);
                    console.log("master drill: ", masterDrill);
                    return {
                        ...masterDrill,
                        instanceId: `saved-${selectedSession.id}-${index}`, 
                        order: drill.sort_order
                    };
                });
                setEditedSessionCoaches(sessionCoaches);
                setEditedSessionPlayers(sessionPlayers);
                setEditedSessionDrills(sessionDrills);

                const startDT = DateTime.fromJSDate(selectedSession.start);
                const endDT = DateTime.fromJSDate(selectedSession.end);
                const sessionDuration = endDT.diff(startDT).toFormat('hh:mm:ss');


                setTempSession({
                    id: selectedSession.id,
                    name: selectedSession.title,
                    notes: selectedSession.extendedProps.notes,
                    startTime: startDT.toFormat('HH:mm:ss'),
                    endTime: endDT.toFormat('HH:mm:ss'),
                    duration: sessionDuration,
                    selectedCoaches: sessionCoaches, 
                    selectedPlayers: sessionPlayers,
                    selectedDrills: sessionDrills,
                    rpe: selectedSession.extendedProps.rpe
                });
            } else {
                setTempSession(null);
                setEditedSessionCoaches([]);
                setEditedSessionPlayers([]);
                setEditedSessionDrills([]);
            }
            setIsDataLoading(false);
        };
        loadSessionData();
    }, [selectedSession]);

    useEffect(() => {
        if (tempSession) {
            setTempSession(prev => ({
                ...prev,
                selectedCoaches: editedSessionCoaches,
                selectedPlayers: editedSessionPlayers,
                selectedDrills: editedSessionDrills
            }));
        }
    }, [editedSessionCoaches, editedSessionPlayers, editedSessionDrills]);

    async function saveSessionChanges() {
        if (
            tempSession.name.length === 0 || 
            tempSession.rpe <= 0 || 
            tempSession.selectedCoaches.length === 0 ||
            tempSession.selectedPlayers.length === 0
        ) return;

        setIsDataLoading(true);

        const sessionDate = DateTime.fromJSDate(selectedSession.start).toISODate();
        const newStart = tempSession.startTime
            ? DateTime.fromISO(`${sessionDate}T${tempSession.startTime}`)
            : DateTime.fromJSDate(selectedSession.start);
        
        let newEnd;
        let newDuration;
        if (tempSession.duration) {
            const [h, m, s] = tempSession.duration.split(':').map(Number);
            const durationObj = Duration.fromObject({ hours: h, minutes: m, seconds: s });
            newEnd = newStart.plus(durationObj);
            newDuration = tempSession.duration;
        } else {
            newEnd = DateTime.fromJSDate(selectedSession.end);
            newDuration = newEnd.diff(newStart).toFormat('hh:mm:ss');
        }
        
        const { error } = await supabase
            .from('sessions')
            .update({ 
                name: tempSession.name, 
                notes: tempSession.notes ,
                rpe: tempSession.rpe,
                start_datetime: newStart.toISO(),
                end_datetime: newEnd.toISO(),
                duration: newDuration
            })
            .eq('id', tempSession.id);

        await Promise.all([
            supabase.from('session_people').delete().eq('session_id', tempSession.id),
            supabase.from('session_drills').delete().eq('session_id', tempSession.id)
        ]);

        const newCoaches = (tempSession.selectedCoaches || []).map(coachId => ({
            session_id: tempSession.id,
            user_id: coachId
        }));
        const newPlayers = (tempSession.selectedPlayers || []).map(playerId => ({
            session_id: tempSession.id,
            user_id: playerId
        }));
        const newDrills = (tempSession.selectedDrills || []).map((drill, index) => ({
            session_id: tempSession.id,
            drill_id: drill.id,
            order: index
        }));

        await Promise.all([
            newCoaches.length > 0 && supabase.from('session_people').insert(newCoaches),
            newPlayers.length > 0 && supabase.from('session_people').insert(newPlayers),
            newDrills.length > 0 && supabase.from('session_drills').insert(newDrills)
        ]);

        const oldName = selectedSession.title;
        const newName = tempSession.name;

        const oldNotes = selectedSession.extendedProps.notes;
        const newNotes = tempSession.notes;

        let updateType = "Session Updated";
        let updateMessage = `${tempSession.name} session details were updated.`;

        if (oldName !== newName) {
            updateType = "Session Name Updated";
            updateMessage = `Session name was changed from ${oldName} to ${newName}.`;
        }

        if (oldNotes !== newNotes) {
            updateType = "Session Notes Updated";
            updateMessage = `${tempSession.name} session notes were updated.`;
        }

        const updateRows = newPlayers.map(player => ({
            player_id: player.user_id,
            session_id: tempSession.id,
            type: updateType,
            message: updateMessage
        }));

        if (updateRows.length > 0) {
            const { error: updateError } = await supabase
                .from("coach_updates")
                .insert(updateRows);

            if (updateError) {
                console.log("Error saving coach update:", updateError.message);
            }
        }

        if (!error) {
            fetchCalendarData();
            setSelectedSession(null);
            setShowSessionEditor(false);
        }
    }

    useEffect(() => {
        if (openSessionId && calendarEvents.length > 0) {

            const targetSession = calendarEvents.find(
                event => event.id === openSessionId
            );

            if (targetSession) {
                setSelectedSession(targetSession);
                setShowSessionEditor(true);
            }
        }
    }, [openSessionId, calendarEvents]);



    /* START UP ------------------------------------------------------------------------ */ 
    useEffect(() => {
        fetchDrills();
        fetchDrillTags();
        fetchDrillLibraryTags();
        fetchPlayers();
        fetchCoaches();
        fetchUnsentSessions();
    }, []);

    useEffect(() => {
        // Fetch calendar data once it has the current user id
        if (currentUserID) fetchCalendarData();
    }, [currentUserID]);


    /* OTHERS -------------------------------------------------------------------------- */
    useEffect(() => {
        if (!tempSession?.startTime || !tempSession?.duration) return;
        
        const [startHour, startMin] = tempSession.startTime.split(':');
        const [durHour, durMin] = tempSession.duration.split(':');
        const maxMin = getMaxDurationFromStart(startHour, startMin);
        const currentDurMin = parseInt(durHour) * 60 + parseInt(durMin);
        
        if (currentDurMin > maxMin) {
            const newH = Math.floor(maxMin / 60).toString().padStart(2, '0');
            const newM = (maxMin % 60).toString().padStart(2, '0');
            setTempSession(prev => ({ ...prev, duration: `${newH}:${newM}:00` }));
        }
    }, [tempSession?.startTime]);

    return (
        <>
            {/* Loading overlay */}
            {isDataLoading && <LOADING_OVERLAY caption={"session data"}/>}

            {/* Delete confirmation popup */}
            {showDeleteConfirmation && selectedSession && showSessionEditor && (
                <DELETE_CONFIRM
                    deleteRef={deleteConfirmRef}
                    setShowDelete={setShowDeleteConfirmation}
                    selectedSession={selectedSession}
                    deleteSession={deleteSession}
                    isDeleting={isDeleting}
                />
            )}

            {/* Send email popup */}
            {showSendEmail && (
                <SEND_CONFIRM
                    sendRef={sendEmailRef}
                    setShowSend={setShowSendEmail}
                    unsentSessions={unsentSessions}
                    send={sendEmail}
                    isSending={isSending}
                />
            )}

            {/* Calendar */}
            <div className="content-box" id="calendar-box">
                <CALENDAR 
                    events={calendarEvents}
                    activeStart={weekStart} activeEnd={weekEnd}
                    onDateChange={handleDateChange}
                    onSessionClick = {(eventData) => {
                        setSelectedSession(eventData);
                        setShowSessionEditor(true);
                    }}
                    selectedSession={selectedSession}
                    selectedCoaches={selectedCoaches} selectedPlayers={selectedPlayers}
                    selectedDrills={selectedDrills}
                    isMobile={isMobile}
                    setShowMobileSessionCreator={setShowMobileSessionCreator}
                    currentCalendarView={currentCalendarView} setCurrentCalendarView={setCurrentCalendarView}
                    setShowSendEmail={setShowSendEmail} fetchUnsentSessions={fetchUnsentSessions}
                    unsentSessions={unsentSessions}

                    ref={calendarRef}
                />
            </div>
            
            {/* Show/hide session creator*/}
            {!showSessionCreator && !isMobile && (
                <button
                    id="show-session-creator"
                    onClick={() => setShowSessionCreator(true)}
                >
                    <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
                    </svg>
                </button>
            )}

            {/* Session creator */}
            {showSessionCreator && !isMobile && (
                <div id="session-creator">
                    <div id="session-creator-top">
                        <h2 className="content-header">Session Creator</h2>
                        <button
                            className='drill-btn drill-btn-primary'
                            onClick={() => setShowSessionCreator(false)}
                        >
                            Less
                        </button>
                    </div>

                    <div id="session-creator-middle-left-top">
                        <TYPING_INPUT 
                            label="NAME *" 
                            num_rows="1" 
                            input_id="session-name-creator" 
                            box_w="100%" box_h="30px" 
                            sample_txt="Name..."
                            value={sessionSettings.sessionName}
                            onChange={(val) => {
                                updateSessionField('sessionName', val);
                            }}
                            maxLength={20}
                            isNumber={false}
                        />

                        <TYPING_INPUT 
                            label="RPE *" 
                            num_rows="1" 
                            input_id="session-rpe-creator" 
                            box_w="100%" box_h="30px" 
                            sample_txt="200..."
                            value={sessionSettings.sessionRPE}
                            onChange={(val) => {
                                updateSessionField('sessionRPE', val);
                            }}
                            maxLength={5}
                            isNumber={true}
                        />
                    </div>  

                    <div id="session-creator-middle-right-top">
                        <TYPING_INPUT 
                            label="NOTES" 
                            num_rows="6" 
                            input_id="session-notes-creator" 
                            box_w="100%" box_h="80%" 
                            sample_txt="Notes..." 
                            value={sessionSettings.sessionNotes}
                            onChange={(val) => updateSessionField('sessionNotes', val)}
                            maxLength={200}
                            isNumber={false}
                        />  
                    </div>

                    <div id="session-creator-middle-left-bottom">
                        <div className="input-container" id="session-creator-people-container">
                            <span className="input-container-label">PEOPLE *</span>
                            <div id="session-creator-people">
                                <PEOPLE_SELECTOR role="Coaches" people={coaches} selectedPeople={selectedCoaches} setSelectedPeople={setSelectedCoaches} />
                                <PEOPLE_SELECTOR role="Players" people={players} selectedPeople={selectedPlayers} setSelectedPeople={setSelectedPlayers} />
                            </div>
                        </div>
                    </div>

                    <div id="session-creator-middle-right-bottom">
                        <div className="input-container" id="session-creator-drills-container">
                            <span className="input-container-label">DRILLS</span>
                            <div id="session-creator-drills">
                                <SESSION_CREATOR_DRILLS
                                    selectedDrills={selectedDrills}
                                    removeDrillFromSession={removeDrillFromSession}
                                />
                                <button 
                                    className='drill-btn'
                                    onClick={() => setShowAddDrill(true)}
                                >
                                    <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
                                    </svg>
                                    Add Drill
                                </button>
                            </div>
                        </div>
                    </div>
                    <div id="session-creator-bottom">
                        <DRAGGABLE_SESSION 
                            sessionSettings={sessionSettings}
                            sessionCoaches={selectedCoaches}
                            sessionPlayers={selectedPlayers}
                            currentCalendarView={currentCalendarView}
                        />
                    </div>
                </div>
            )}
            

            {/* Mobile session creator */}
            {isMobile && showMobileSessionCreator && (
                <div id="mobile-session-creator-container"
                    onClick={(e) => {
                        if (mobileSessionCreatorRef.current && !mobileSessionCreatorRef.current.contains(e.target)) {
                            setShowMobileSessionCreator(false);
                        }
                    }}
                >
                    <div id="mobile-session-creator" ref={mobileSessionCreatorRef}>
                        <h2 className="content-header">Session Creator</h2>
                        <TYPING_INPUT 
                            label="NAME *" 
                            num_rows="1" 
                            input_id="session-name-creator" 
                            box_w="100%" box_h="30px" 
                            sample_txt="Name..."
                            value={sessionSettings.sessionName}
                            onChange={(val) => {
                                updateSessionField('sessionName', val);
                            }}
                            maxLength={20}
                            isNumber={false}
                        />

                        <TYPING_INPUT 
                            label="RPE *" 
                            num_rows="1" 
                            input_id="session-rpe-creator" 
                            box_w="100%" box_h="30px" 
                            sample_txt="200..."
                            value={sessionSettings.sessionRPE}
                            onChange={(val) => {
                                updateSessionField('sessionRPE', val);
                            }}
                            maxLength={10}
                            isNumber={true}
                        />

                        <TYPING_INPUT 
                                label="NOTES" 
                                num_rows="6" 
                                input_id="session-notes-creator" 
                                box_w="100%" box_h="80px" 
                                sample_txt="Notes..." 
                                value={sessionSettings.sessionNotes}
                                onChange={(val) => updateSessionField('sessionNotes', val)}
                                maxLength={200}
                                isNumber={false}
                        />  

                        <div className="input-container">
                            <span className="input-container-label">START TIME *</span>
                            <div id="mobile-session-creator-times">
                                <div className="mobile-session-creator-times-container">
                                    <p>Hour</p>
                                    <select
                                        className='mobile-time-dropdown'
                                        value={mobileStartHour}
                                        onChange={(e) => setMobileStartHour(e.target.value)}
                                    >
                                        {mobileHours.map(h => (
                                            <option key={h.val} value={h.val}>{h.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="mobile-session-creator-times-container">
                                    <p>Minute</p>
                                    <select
                                        className='mobile-time-dropdown'
                                        value={mobileStartMin}
                                        onChange={(e) => setMobileStartMin(e.target.value)}
                                    >
                                        {mobileMinutes.map(m => (
                                            <option key={m.val} value={m.val}>{m.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="input-container">
                            <span className="input-container-label">DURATION *</span>
                            <div id="mobile-session-creator-times">
                                <div className="mobile-session-creator-times-container">
                                    <p>Hours</p>
                                    <select
                                        className='mobile-time-dropdown'
                                        value={mobileDurationHour}
                                        onChange={(e) => setMobileDurationHour(e.target.value)}
                                    >
                                        {validDurationHours.map(h => (
                                            <option key={h.val} value={h.val}>{h.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="mobile-session-creator-times-container">
                                    <p>Minutes</p>
                                    <select
                                        className='mobile-time-dropdown'
                                        value={mobileDurationMin}
                                        onChange={(e) => setMobileDurationMin(e.target.value)}
                                    >
                                        {validDurationMinutes.map(m => (
                                            <option key={m.val} value={m.val}>{m.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
            
                        <div className="input-container" >
                            <span className="input-container-label">PEOPLE *</span>
                            <div id="session-creator-people">
                                <PEOPLE_SELECTOR role="Coaches" people={coaches} selectedPeople={selectedCoaches} setSelectedPeople={setSelectedCoaches} />
                                <PEOPLE_SELECTOR role="Players" people={players} selectedPeople={selectedPlayers} setSelectedPeople={setSelectedPlayers} />
                            </div>
                        </div>

                        <div className="input-container">
                            <span className="input-container-label">DRILLS</span>
                            <div id="session-creator-drills">
                                <SESSION_CREATOR_DRILLS
                                    selectedDrills={selectedDrills}
                                    removeDrillFromSession={removeDrillFromSession}
                                />
                                <button 
                                    className='drill-btn'
                                    onClick={() => setShowAddDrill(true)}
                                >
                                    <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
                                    </svg>
                                    Add Drill
                                </button>
                            </div>
                        </div>
                        
                        <div id="mobile-session-creator-bottom">
                            <button 
                                className="drill-btn drill-btn-ghost"
                                onClick={() => setShowMobileSessionCreator(false)}
                            >
                                Cancel
                            </button>
                            <button 
                                className="drill-btn drill-btn-primary"
                                onClick={() => mobilePushSession({
                                    sessionSettings: sessionSettings,
                                    currentDay: weekStart,
                                    startHour: mobileStartHour,
                                    startMin: mobileStartMin,
                                    durationStr: `${mobileDurationHour}:${mobileDurationMin}:00`
                                })}   
                            >
                                <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                                </svg>
                                Add to Calendar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Drill library popup */}
            { showAddDrill && (
                <div 
                    id="add-drill-container"
                    onClick={(e) => {
                        if (drillLibraryRef.current && !drillLibraryRef.current.contains(e.target)) {
                            setShowAddDrill(false);
                        }
                    }}
                >
                    <div className="content-box" id="session-drill-library" ref={drillLibraryRef}>
                        <div className="content-box-top">
                            <div className="content-box-top-left">
                                <h2 className="content-header">Drill Library</h2>
                            </div>
                            <div className="content-box-top-middle"></div>
                            <div className="content-box-top-right">
                                <button
                                    className="drill-icon-btn"
                                    onClick={() => setShowAddDrill(false)}
                                >
                                    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                        <div className="content-box-middle">
                            <div id="session-drill-library-filter">
                                <input
                                    className="typing-input-box"
                                    placeholder='Search drill...'
                                    type="text"
                                    value={drillSearchQuery}
                                    onChange={(e) => setDrillSearchQuery(e.target.value)}
                                />
                                <select
                                    value={drillSearchFilter}
                                    onChange={(e) => setDrillSearchFilter(e.target.value)}
                                >
                                    <option
                                        key={"ALL"}
                                        value={"ALL"}
                                    >
                                        ALL
                                    </option>
                                    {drillTags.map(tag => (
                                        <option
                                            key={tag.id}
                                            value={tag.id}
                                        >
                                            {tag.name.toUpperCase()}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div id="session-drill-library-grid-container">
                                {filteredDrills.length > 0 && (
                                    <div id="session-drill-grid">
                                        {filteredDrills.map(drill => (
                                            <SIMPLE_DRILL_CARD 
                                                drill={drill}
                                                addDrillToSession={showSessionEditor ? addDrillToSelectedSession : addDrillToSession}
                                                removeDrillFromSession={null}
                                                isSelectedDrill={false}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Session editor */}
            { selectedSession && showSessionEditor && !isMobile && (
                <div 
                    id="session-editor-container" 
                    onClick={(e) => {
                        if (sessionEditorRef.current && !sessionEditorRef.current.contains(e.target)) {
                            setShowSessionEditor(false);
                            setSelectedSession(null);
                        }
                    }}
                >   
                    <div id="session-editor" ref={sessionEditorRef}>
                            <div id="session-editor-top-left">
                                <h2 id="session-editor-header">Session Editor</h2>
                            </div>
                            <div id="session-editor-top-right">
                                <button 
                                    className="drill-icon-btn"
                                    onClick={() => {
                                        setShowSessionEditor(false);
                                        setSelectedSession(null);
                                    }}
                                >
                                    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            <div id="session-editor-middle-left">
                                <TYPING_INPUT 
                                    label="NAME *" 
                                    num_rows="1" 
                                    input_id="session-name-creator" 
                                    box_w="100%" box_h="30px" 
                                    sample_txt="Name..."
                                    value={tempSession?.name || ""}
                                    onChange={(val) => 
                                        setTempSession({ ...tempSession, name: val })
                                    }
                                    id="session-editor-name"
                                    isNumber={false}
                                />

                                <TYPING_INPUT 
                                    label="RPE *" 
                                    num_rows="1" 
                                    input_id="session-rpe-creator" 
                                    box_w="100%" box_h="30px" 
                                    sample_txt="200..."
                                    value={tempSession?.rpe}
                                    onChange={(val) => {
                                        setTempSession({ ...tempSession, rpe: val});
                                    }}
                                    maxLength={5}
                                    isNumber={true}
                                />
                                <TYPING_INPUT 
                                    label="NOTES" 
                                    num_rows="6" 
                                    input_id="session-notes-creator" 
                                    box_w="100%" box_h="80px" 
                                    sample_txt="Notes..." 
                                    value={tempSession?.notes || ""}
                                    onChange={(val) => 
                                        setTempSession({ ...tempSession, notes: val })
                                    }
                                    id="session-editor-notes"
                                    isNumber={false}
                                />
                            </div>

                            <div id="session-editor-middle-middle">
                                <div className="input-container" id="session-editor-people-container">
                                    <span className="input-container-label">PEOPLE *</span>
                                    <div id="session-editor-people">
                                        <PEOPLE_SELECTOR 
                                            role="Coaches" people={coaches} 
                                            selectedPeople={editedSessionCoaches} 
                                            setSelectedPeople={setEditedSessionCoaches}  
                                        />
                                        <PEOPLE_SELECTOR 
                                            role="Players" people={players} 
                                            selectedPeople={editedSessionPlayers} 
                                            setSelectedPeople={setEditedSessionPlayers} 
                                        />
                                    </div>
                                </div>
                            </div>

                            <div id="session-editor-middle-right">
                                <div className="input-container" id="session-editor-drills-container">
                                    <span className="input-container-label">DRILLS</span>
                                    <div id="session-editor-drills">
                                        <SESSION_CREATOR_DRILLS
                                            selectedDrills={editedSessionDrills}
                                            removeDrillFromSession={removeDrillFromSelectedSession}
                                        />
                                        <button 
                                            className='drill-btn'
                                            onClick={() => setShowAddDrill(true)}
                                        >
                                            <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
                                            </svg>
                                            Add Drill
                                        </button>
                                    </div>
                                </div>
                            </div>
                            
                            <div id="session-editor-bottom-left">
                                <button 
                                    className="drill-btn drill-btn-danger" 
                                    id="delete-session" 
                                    onClick={() => setShowDeleteConfirmation(true)}
                                >
                                    <svg width="15" height="15" fill="none" stroke="#dc2626" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                    Delete
                                </button>
                            </div>
                            <div id="session-editor-bottom-middle"></div>
                            <div id="session-editor-bottom-right">
                                <button 
                                    className="drill-btn drill-btn-primary"
                                    onClick={saveSessionChanges}
                                >
                                    <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                                    </svg>
                                    Save Changes
                                </button>
                            </div>
                    </div>
                </div>
            )}

            {/* Mobile session editor */}
            {isMobile && showSessionEditor && selectedSession && (
                <div id="mobile-session-editor-container"
                    onClick={(e) => {
                        if (mobileSessionEditorRef.current && !mobileSessionEditorRef.current.contains(e.target)) {
                            setShowSessionEditor(false);
                            setSelectedSession(null);
                        }
                    }}
                >
                    <div id="mobile-session-editor" ref={mobileSessionEditorRef}>
                        <h2 className="content-header">Session Editor</h2>
                        <TYPING_INPUT 
                            label="NAME *" 
                            num_rows="1" 
                            input_id="session-name-creator" 
                            box_w="100%" box_h="30px" 
                            sample_txt="Name..."
                            value={tempSession?.name || ""}
                            onChange={(val) => 
                                setTempSession({ ...tempSession, name: val })
                            }
                            id="session-editor-name"
                            isNumber={false}
                        />

                         <TYPING_INPUT 
                            label="RPE *" 
                            num_rows="1" 
                            input_id="session-rpe-creator" 
                            box_w="100%" box_h="30px" 
                            sample_txt="200..."
                            value={tempSession?.rpe}
                            onChange={(val) => {
                                setTempSession({ ...tempSession, rpe: val});
                            }}
                            maxLength={10}
                            isNumber={true}
                        />

                        <TYPING_INPUT 
                            label="NOTES" 
                            num_rows="6" 
                            input_id="session-notes-creator" 
                            box_w="100%" box_h="80px" 
                            sample_txt="Notes..." 
                            value={tempSession?.notes || ""}
                            onChange={(val) => 
                                setTempSession({ ...tempSession, notes: val })
                            }
                            id="session-editor-notes"
                            isNumber={false}
                        />

                        <div className="input-container">
                            <span className="input-container-label">START TIME *</span>
                            <div id="mobile-session-editor-times">
                                <div className="mobile-session-creator-times-container">
                                    <p>Hour</p>
                                    <select
                                        className='mobile-time-dropdown'
                                        value={tempSession?.startTime?.split(':')[0] || "06"}
                                        onChange={(e) => {
                                            const newHour = e.target.value;
                                            const currentMin = tempSession?.startTime?.split(':')[1] || "00";
                                            setTempSession({ 
                                                ...tempSession, 
                                                startTime: `${newHour}:${currentMin}:00` 
                                            });
                                        }}
                                    >
                                        {mobileHours.map(h => (
                                            <option key={h.val} value={h.val}>{h.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="mobile-session-creator-times-container">
                                    <p>Minute</p>
                                    <select
                                        className='mobile-time-dropdown'
                                        value={tempSession?.startTime?.split(':')[1] || "00"}
                                        onChange={(e) => {
                                            const newMin = e.target.value;
                                            const currentHour = tempSession?.startTime?.split(':')[0] || "06";
                                            setTempSession({ 
                                                ...tempSession, 
                                                startTime: `${currentHour}:${newMin}:00` 
                                            });
                                        }}
                                    >
                                        {mobileMinutes.map(m => (
                                            <option key={m.val} value={m.val}>{m.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="input-container">
                            <span className="input-container-label">DURATION *</span>
                            <div id="mobile-session-editor-times">
                                <MOBILE_DURATION_INPUT 
                                    tempSession={tempSession} 
                                    setTempSession={setTempSession}
                                    mobileDurationHours={mobileDurationHours}
                                    mobileDurationMinutes={mobileDurationMinutes}
                                    getMaxDurationFromStart={getMaxDurationFromStart}
                                />
                            </div>
                        </div>
            
                        <div className="input-container" >
                            <span className="input-container-label">PEOPLE *</span>
                            <div id="session-editor-people">
                                <PEOPLE_SELECTOR 
                                    role="Coaches" people={coaches} 
                                    selectedPeople={editedSessionCoaches} 
                                    setSelectedPeople={setEditedSessionCoaches}  
                                />
                                <PEOPLE_SELECTOR 
                                    role="Players" people={players} 
                                    selectedPeople={editedSessionPlayers} 
                                    setSelectedPeople={setEditedSessionPlayers} 
                                />
                            </div>
                        </div>

                        <div className="input-container">
                            <span className="input-container-label">DRILLS</span>
                            <div id="session-editor-drills">
                                <SESSION_CREATOR_DRILLS
                                    selectedDrills={editedSessionDrills}
                                    removeDrillFromSession={removeDrillFromSelectedSession}
                                />
                                <button 
                                    className='drill-btn'
                                    onClick={() => setShowAddDrill(true)}
                                >
                                    <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
                                    </svg>
                                    Add Drill
                                </button>
                            </div>
                        </div>
                        
                        <div id="mobile-editor-creator-bottom">
                            <button 
                                className="drill-btn drill-btn-danger" 
                                id="delete-session" 
                                onClick={() => setShowDeleteConfirmation(true)}
                            >
                                <svg width="15" height="15" fill="none" stroke="#dc2626" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                Delete
                            </button>
                            <button 
                                className="drill-btn drill-btn-primary"
                                onClick={saveSessionChanges}
                            >
                                <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                                </svg>
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}