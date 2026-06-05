import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { LOADING_OVERLAY } from '../Components/SharedComponents';

import '../App.css';
import "./Dashboard.css";

function getIntensityZone(intensity) {
    if (intensity >= 1 && intensity <= 3) return "easy";
    if (intensity >= 4 && intensity <= 6) return "medium";
    if (intensity >= 7 && intensity <= 10) return "hard";
}

function durationToMinutes(duration) {
    if (!duration) return 0;
    const [hours, minutes, seconds] = duration.split(":").map(Number);
    return hours * 60 + minutes + Math.round(seconds / 60);
}

export default function PlayerDashboard() {
    const location = useLocation();
    const navigate = useNavigate();

    const isCoachPreview = location.state?.isCoachPreview ?? false;
    const previewPlayer = location.state?.previewPlayer ?? null;
    const previewPlayerId = location.state?.previewPlayerId ?? null;

    const [sessions, setSessions] = useState([]);
    const [nextSessionData, setNextSessionData] = useState(null);
    const [pendingSession, setPendingSession] = useState(null);
    const [intensity, setIntensity] = useState("");
    const [durationMinutes, setDurationMinutes] = useState("");
    const [notes, setNotes] = useState("");
    const [latestFeedback, setLatestFeedback] = useState(null);
    const [weeklySessions, setWeeklySessions] = useState([]);

    // State for Strengths and Weaknesses.
    const [strengths, setStrengths] = useState([]);
    const [weaknesses, setWeaknesses] = useState([]);

    // State for updates
    const [coachUpdates, setCoachUpdates] = useState([]);

    // LOADING STATE
    const [isLoading, setIsLoading] = useState(true);

    // WEEKLY NAVIGATION
    const today = new Date();

    const startOfSelectedWeek = new Date(today);
    startOfSelectedWeek.setDate(today.getDate() - today.getDay());
    startOfSelectedWeek.setHours(0, 0, 0, 0);

    const endOfSelectedWeek = new Date(startOfSelectedWeek);
    endOfSelectedWeek.setDate(startOfSelectedWeek.getDate() + 6);
    endOfSelectedWeek.setHours(23, 59, 59, 999);

    async function fetchData() {
        setIsLoading(true);
        let userId;

        if (isCoachPreview && previewPlayerId) {
            userId = previewPlayerId;
        } else {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) { console.log("No user logged in"); return; }
            userId = user.id;
        }

        const { data: sessionData, error } = await supabase
            .from("sessions")
            .select(`*, session_people!inner(user_id)`)
            .eq("session_people.user_id", userId)
            .order("start_datetime", { ascending: true });

        if (error) { console.log("Error fetching sessions:", error.message); setSessions([]); return; }

        setSessions(sessionData);

        const now = new Date();
        setNextSessionData(sessionData.find(s => new Date(s.end_datetime) >= now) || null);

        setWeeklySessions(sessionData.filter(s => {
            const d = new Date(s.start_datetime);
            return d >= startOfSelectedWeek && d <= endOfSelectedWeek;
        }));

        // Fetch code: Coach Updates.
        const { data: updatesData, error: updatesError } = await supabase
            .from("coach_updates")
            .select("*")
            .eq("player_id", userId)
            .order("created_at", { ascending: false })
            .limit(5);

        if (updatesError) {
            console.log("Error fetching coach updates:", updatesError.message);
        } else {
            setCoachUpdates(updatesData || []);
        }

        // Fetch code: Sessions Feedback.
        const { data: feedbackData, error: feedbackError } = await supabase
            .from("session_feedback").select("*").eq("player_id", userId);

        if (feedbackError) { console.log("Error fetching feedback:", feedbackError.message); return; }

        const latest = [...feedbackData].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];
        const latestSession = sessionData.find(s => s.id === latest?.session_id);
        setLatestFeedback(latest ? { ...latest, session_name: latestSession?.name || "Unknown session" } : null);

        const ratedSessionIDs = feedbackData.map(f => f.session_id);
        const unrated = sessionData.find(s => new Date(s.end_datetime) < now && !ratedSessionIDs.includes(s.id));
        setPendingSession(unrated || null);
        if (unrated) setDurationMinutes(durationToMinutes(unrated.duration));

        // Fetch code: strength and weaknesses.
        const { data: playerProfile, error: profileError } = await supabase
            .from("player_details")
            .select("strengths, weaknesses")
            .eq("id", userId)
            .single();

        if (profileError) {
            console.log("Error fetching player profile:", profileError.message);
        } else {
            setStrengths(playerProfile.strengths || []);
            setWeaknesses(playerProfile.weaknesses || []);
        }
        setIsLoading(false);
    }

    useEffect(() => {
        // Reset all state before fetching new player data
        setSessions([]);
        setNextSessionData(null);
        setPendingSession(null);
        setLatestFeedback(null);
        setWeeklySessions([]);
        setStrengths([]);
        setWeaknesses([]);
        setCoachUpdates([]);
        fetchData();
    }, [previewPlayerId]);

    // Save handler for session feedback
    async function handleSave() {
        const { data: { user } } = await supabase.auth.getUser();
        const intensityNum = Number(intensity);
        const durationMins = Number(durationMinutes);
        const { error } = await supabase.from("session_feedback").insert([{
            session_id: pendingSession.id,
            player_id: user.id,
            intensity: intensityNum,
            duration_minutes: durationMins,
            rpe_load: intensityNum * durationMins,
            intensity_zone: getIntensityZone(intensityNum),
            feedback_notes: notes,
        }]);
        if (error) { alert("Failed to save: " + error.message); }
        else { alert("Feedback saved!"); setIntensity(""); setDurationMinutes(""); setNotes(""); fetchData(); }
    }

    const focusArea = getFocusArea(weaknesses);

    // Helper function for Focus area
    function getFocusArea(weaknesses) {

        if (!weaknesses || weaknesses.length === 0) { return "Balanced Training"; }
        if (weaknesses.includes("5m Sprint") || weaknesses.includes("10m Sprint") || weaknesses.includes("505 Agility Left") || weaknesses.includes("505 Agility Right")) { return "Court Movement"; }
        if (weaknesses.includes("Vertical Jump")) { return "Explosive Power"; }
        if (weaknesses.includes("Front Plank")) { return "Core Strength"; }
        if (weaknesses.includes("Beep Test") || weaknesses.includes("Yo-Yo Test")) { return "Endurance"; }

        return "General Development";
    }

    // To filter out completed and uncomplete session in WeeklySessions.
    const sortedWeeklySessions = [...weeklySessions].sort((a, b) => {
        const aCompleted = new Date(a.end_datetime) < new Date();
        const bCompleted = new Date(b.end_datetime) < new Date();

        if (aCompleted !== bCompleted) {
            return aCompleted ? 1 : -1;
        }

        return new Date(a.start_datetime) - new Date(b.start_datetime);
    });

    return (
        <div id="layout">
            {/* Loading overlay */}
            {isLoading && <LOADING_OVERLAY caption={"athlete dashboard"} />}

            <div id="main-content-wrapper">
                <div id="main-content">
                    <div className="dashboardPage">

                        {/* PREVIEW BANNER */}
                        {isCoachPreview && (
                            <div style={{
                                backgroundColor: '#FFF3EB',
                                border: '2px solid #EC7842',
                                borderRadius: '8px',
                                padding: '10px 16px',
                                marginBottom: '16px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                fontFamily: 'DM Sans Light, sans-serif',
                                flexWrap: 'wrap',
                                gap: '8px',
                            }}>
                                <span style={{ fontSize: '14px', color: '#7C3A1A' }}>
                                    Previewing <strong>{previewPlayer}</strong>'s dashboard <em style={{ fontSize: '12px' }}></em>
                                </span>
                                <button
                                    onClick={() => navigate('/CoachDashboard')}
                                    style={{
                                        backgroundColor: '#EC7842', color: '#fff', border: 'none',
                                        borderRadius: '6px', padding: '6px 14px', fontSize: '13px',
                                        fontFamily: 'DM Mono Light, sans-serif', cursor: 'pointer',
                                    }}
                                >
                                    ✕ Exit Preview
                                </button>
                            </div>
                        )}

                        {/* HEADER */}
                        <div className="dashboardHeader">
                            <div>
                                <h2 className="content-header" style={{ padding: 0, marginBottom: '4px' }}>
                                    {isCoachPreview ? `${previewPlayer}'s Dashboard` : 'Athlete Dashboard'}
                                </h2>
                                <p style={{
                                    fontFamily: "'DM Sans Light', sans-serif",
                                    fontSize: '13px',
                                    color: 'var(--content-subhead-color)'
                                }}>
                                    Overview of your performance.
                                </p>
                            </div>
                        </div>

                        {/* STATS */}
                        <div id="drill-stats-row">

                            <div className="drill-stat-card">
                                <p className="drill-stat-label"> Week Total Sessions</p>
                                <h2 className="drill-stat-value accent">{weeklySessions.length}</h2>
                                <p className="drill-stat-sub"> Sessions logged </p>
                            </div>

                            <div className="drill-stat-card">
                                <p className="drill-stat-label">NEXT SESSION</p>
                                <h2 className="drill-stat-value">
                                    {nextSessionData
                                        ? new Date(nextSessionData.start_datetime).toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit" })
                                        : "—"}
                                </h2>
                                <p className="drill-stat-sub">
                                    {nextSessionData
                                        ? `${new Date(nextSessionData.start_datetime).toLocaleDateString("en-AU", { weekday: "short", day: "numeric", month: "short" })} • ${nextSessionData.name}` 
                                        : "No upcoming session"}
                                </p>
                            </div>

                            <div className="drill-stat-card"
                                onClick={() => {
                                    if (!isCoachPreview) {
                                        navigate("/SessionFeedback", { state: { selectedSessionId: latestFeedback.session_id } });
                                    }
                                }}
                                style={{ cursor: isCoachPreview ? "default" : "pointer" }}>
                                <p className="drill-stat-label">LAST RATING</p>
                                <h2 className="drill-stat-value">{latestFeedback ? `${latestFeedback.intensity}/10` : "—"}</h2>
                                <p className="drill-stat-sub">{latestFeedback ? latestFeedback.session_name : "No feedback yet"}</p>
                            </div>

                            <div className="drill-stat-card">
                                <p className="drill-stat-label">FOCUS AREA</p>
                                <h2 className="drill-stat-value">{focusArea}</h2>
                            </div>
                        </div>

                        {/* MAIN GRID */}
                        <div className="dashboardGrid">

                            {/* LEFT COLUMN */}
                            <div className="leftColumn">

                                {/* UPCOMING SESSION */}
                                <div className="chartBox">
                                    <div className="sectionHeader">
                                        <h3>UPCOMING SESSION</h3>
                                    </div>
                                    {nextSessionData ? (
                                        <div key={nextSessionData.id} className="sessionDetailCard"
                                            onClick={() => {
                                                if (!isCoachPreview) {
                                                    navigate("/PlayerCalendar", { state: { selectedSession: nextSessionData.id } });
                                                }
                                            }}
                                            style={{ cursor: isCoachPreview ? "default" : "pointer" }}>
                                            <div className="sessionTime">
                                                <span className="timeMain" >{new Date(nextSessionData.start_datetime).toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit" })}</span>
                                            </div>

                                            <div className="sessionContent">
                                                <h3>{nextSessionData?.name || "No upcoming session"}</h3>
                                                <p>{new Date(nextSessionData.start_datetime).toLocaleDateString("en-AU", { weekday: "short", day: "numeric", month: "short" })}</p>
                                                <p>Duration: {nextSessionData.duration}</p>
                                                <p>Notes: {nextSessionData.notes || "No notes"}</p>
                                            </div>
                                        </div>
                                    ) : (<p className="dashboardLabel">No upcoming session.</p>)
                                    }
                                </div>
                                
                                {/* WEEKLY ACTIVITY */}
                                <div className="chartBox">
                                    <div className="sectionHeader">
                                        <p className="dashboardLabel">WEEKLY ACTIVIY</p>
                                        <h3>This Week</h3>
                                    </div>
                                    <div className="sessionList">
                                        {sortedWeeklySessions.length > 0 ? (
                                            sortedWeeklySessions.map((session) => {
                                                const isCompleted = new Date(session.end_datetime) < new Date();

                                                return (
                                                    <div key={session.id} className="sessionItem" onClick={() => {
                                                        if (!isCoachPreview) {
                                                            navigate("/PlayerCalendar", { state: { selectedSession: session.id } });
                                                        }
                                                    }}
                                                        style={{ cursor: isCoachPreview ? "default" : "pointer" }}
                                                    >
                                                        <div className="sessionMain">
                                                            <p className="sessionClient">{session.name}</p>
                                                            <p className={`sessionName ${isCompleted ? "completed" : "upcoming"}`}>
                                                                {isCompleted ? "Completed" : "Upcoming"}</p>
                                                        </div>
                                                        <div className="sessionInfo">
                                                            <span>{new Date(session.start_datetime).toLocaleDateString("en-AU", { weekday: "short", day: "numeric", month: "short" })}</span>
                                                            <span>{new Date(session.start_datetime).toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit" })}</span>
                                                            <span>{session.duration}</span>
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        ) : (<p className="dashboardLabel">No sessions this week.</p>
                                        )}
                                    </div>
                                </div>

                                {/* LATEST SESSION FEEDBACK FORM */}
                                {/* HIDES FEEDBACK FORM IN PREVIEW MODE */}
                                {!isCoachPreview && (
                                    <div className="chartBox">
                                        <div className="sectionHeader">
                                            <p className="dashboardLabel">RATE OF PERCEIVED EXERTION (RPE)</p>
                                            <h3>Session Feedback</h3>
                                        </div>
                                        {!pendingSession ? <p className="dashboardLabel">No pending feedback.</p> : (
                                            <div className="sessionList">
                                                <div className="drill-form-group">
                                                    <p className="drill-modal-title" style={{ color: "var(--accent-color)" }} >{pendingSession.name} - {new Date(pendingSession.start_datetime).toLocaleDateString("en-AU", { weekday: "short", day: "numeric", month: "short" })}</p>

                                                    <label className="drill-form-label">Session Intensity</label>
                                                    <select className="drill-form-select" value={intensity} onChange={(e) => setIntensity(e.target.value)}>
                                                        <option value="">Select intensity</option>
                                                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => <option key={n} value={n}>{n}</option>)}
                                                    </select>

                                                    <label className="drill-form-label">Actual Duration (minutes)</label>
                                                    <input className="drill-form-input" type="number" value={durationMinutes} onChange={(e) => setDurationMinutes(e.target.value)} />

                                                    <label className="drill-form-label">Comment</label>
                                                    <textarea className="drill-form-textarea" placeholder="How was the session?" value={notes} onChange={(e) => setNotes(e.target.value)} />

                                                    <button className="weekButton active" onClick={handleSave}>Submit Feedback</button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                            </div>

                            {/* RIGHT COLUMN */}
                            <div className="rightColumn">

                                {/* STRENGTH */}
                                <div className="chartBox">
                                    <div className="sectionHeader">
                                        <p className="dashboardLabel">PERFORMANCE</p>
                                        <h3>Current Strengths</h3>
                                    </div>
                                    <div className="tagList">
                                        {/* EMPTY MESAGGES */}
                                        {strengths.length > 0 ? (
                                            strengths.map((item, i) => <span className="positiveTag" key={i}>{item}</span>)
                                        ) : (
                                            <p className="dashboardLabel">No strengths added.</p>
                                        )}
                                    </div>
                                </div>
                                
                                {/* WEAKNESSES */}
                                <div className="chartBox">
                                    <div className="sectionHeader">
                                        <p className="dashboardLabel">FOCUS AREA</p>
                                        <h3>Current Weaknesses</h3>
                                    </div>
                                    <div className="tagList">
                                        {/* EMPTY MESAGGES */}
                                        {weaknesses.length > 0 ? (
                                            weaknesses.map((item, i) => <span className="warningTag" key={i}>{item}</span>)
                                        ) : (
                                            <p className="dashboardLabel">No focus area added.</p>
                                        )}
                                    </div>
                                </div>
                                
                                {/* UPDATE BOARD */}
                                <div className="chartBox">
                                    <div className="sectionHeader">
                                        <p className="dashboardLabel">LATEST ACTIVITY</p>
                                        <h3>Coach Update Board</h3>
                                    </div>
                                    <div className="updateBoard">
                                        {coachUpdates.length > 0 ? (
                                            coachUpdates.map((update) => (
                                                <div className="updateItem" key={update.id}>
                                                    <p className="updateType">{update.type}</p>
                                                    <p className="updateMessage">{update.message}</p>
                                                    <span className="updateTime">
                                                        {new Date(update.created_at).toLocaleDateString("en-AU")}
                                                    </span>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="dashboardLabel">No coach updates this week.</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
