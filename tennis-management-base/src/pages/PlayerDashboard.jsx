import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import '../App.css';
import "./Dashboard.css";

const strengths = [
    "Consistent forehand rally",
    "Good court coverage",
    "Strong reaction speed",
];

const weaknesses = [
    "Second serve accuracy",
    "Backhand under pressure",
    "Recovery after long rallies",
];

const coachUpdates = [
    { type: "Session Added", message: "Coach Daniel added Serve Accuracy Training for 12 May.", time: "Today, 9:15 AM" },
    { type: "Time Moved",    message: "Footwork session moved from 2:00 PM to 3:00 PM.",        time: "Yesterday, 4:40 PM" },
    { type: "Session Rated", message: "Coach rated your last Match Simulation session: 8/10.",  time: "2 days ago" },
];

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

    const isCoachPreview  = location.state?.isCoachPreview  ?? false;
    const previewPlayer   = location.state?.previewPlayer   ?? null;
    const previewPlayerId = location.state?.previewPlayerId ?? null;

    const [sessions, setSessions] = useState([]);
    const [nextSessionData, setNextSessionData] = useState(null);
    const [pendingSession, setPendingSession] = useState(null);
    const [intensity, setIntensity] = useState("");
    const [durationMinutes, setDurationMinutes] = useState("");
    const [notes, setNotes] = useState("");
    const [latestFeedback, setLatestFeedback] = useState(null);
    const [weeklySessions, setWeeklySessions] = useState([]);

    async function fetchData() {
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

        const today = new Date();
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay() + 1);
        startOfWeek.setHours(0, 0, 0, 0);
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);
        setWeeklySessions(sessionData.filter(s => {
            const d = new Date(s.start_datetime);
            return d >= startOfWeek && d <= endOfWeek;
        }));

        const { data: feedbackData, error: feedbackError } = await supabase
            .from("session_feedback").select("*").eq("player_id", userId);

        if (feedbackError) { console.log("Error fetching feedback:", feedbackError.message); return; }

        const latest = [...feedbackData].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];
        setLatestFeedback(latest || null);

        const ratedSessionIDs = feedbackData.map(f => f.session_id);
        const unrated = sessionData.find(s => new Date(s.end_datetime) < now && !ratedSessionIDs.includes(s.id));
        setPendingSession(unrated || null);
        if (unrated) setDurationMinutes(durationToMinutes(unrated.duration));
    }

    useEffect(() => { fetchData(); }, []);

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

    return (
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
                        👁 Previewing <strong>{previewPlayer}</strong>'s dashboard — <em style={{ fontSize: '12px' }}>read-only</em>
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
                    <p className="dashboardLabel">PLAYER OVERVIEW</p>
                    <h1 className="dashboardTitle">
                        {isCoachPreview ? `${previewPlayer}'s Dashboard` : 'Player Dashboard'}
                    </h1>
                </div>
            </div>

            {/* TOP STATS */}
            <div className="statsGrid">
                <div className="statCard">
                    <p className="cardLabel">THIS WEEK</p>
                    <h2 className="cardValue">{weeklySessions.length}</h2>
                </div>
                <div className="statCard">
                    <p className="cardLabel">NEXT SESSION</p>
                    <h2 className="cardValue">
                        {nextSessionData
                            ? new Date(nextSessionData.start_datetime).toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit" })
                            : "—"}
                    </h2>
                </div>
                <div className="statCard">
                    <p className="cardLabel">LAST RATING</p>
                    <h2 className="cardValue">{latestFeedback ? `${latestFeedback.intensity}/10` : "—"}</h2>
                </div>
                <div className="statCard">
                    <p className="cardLabel">FOCUS AREA</p>
                    <h2 className="cardValue">SERVE</h2>
                </div>
            </div>

            {/* MAIN GRID */}
            <div className="dashboardGrid">

                {/* LEFT COLUMN */}
                <div className="leftColumn">

                    <div className="chartBox">
                        <div className="sectionHeader">
                            <p className="dashboardLabel">NEXT SESSION</p>
                            <h3>{nextSessionData?.name || "No upcoming session"}</h3>
                        </div>
                        {nextSessionData ? (
                            <div className="playerSessionHighlight">
                                <p><strong>Date:</strong> {new Date(nextSessionData.start_datetime).toLocaleDateString("en-AU")}</p>
                                <p><strong>Time:</strong> {new Date(nextSessionData.start_datetime).toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit" })}</p>
                                <p><strong>Duration:</strong> {nextSessionData.duration}</p>
                                <p><strong>Notes:</strong> {nextSessionData.notes || "No notes"}</p>
                            </div>
                        ) : (
                            <p>No upcoming session found.</p>
                        )}
                    </div>

                    <div className="chartBox">
                        <div className="sectionHeader">
                            <p className="dashboardLabel">THIS WEEK</p>
                            <h3>Weekly Activity</h3>
                        </div>
                        <div className="sessionList">
                            {weeklySessions.length > 0 ? weeklySessions.map((session) => (
                                <div className="sessionItem" key={session.id}>
                                    <div className="sessionMain">
                                        <p className="sessionClient">{session.name}</p>
                                        <p className="sessionName">{new Date(session.end_datetime) < new Date() ? "Completed" : "Upcoming"}</p>
                                    </div>
                                    <div className="sessionInfo">
                                        <span>{new Date(session.start_datetime).toLocaleDateString("en-AU", { weekday: "short", day: "numeric", month: "short" })}</span>
                                        <span>{new Date(session.start_datetime).toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit" })}</span>
                                    </div>
                                </div>
                            )) : <p>No sessions this week.</p>}
                        </div>
                    </div>

                    {/* Hide feedback form in preview mode */}
                    {!isCoachPreview && (
                        <div className="chartBox">
                            <div className="sectionHeader">
                                <p className="dashboardLabel">PLAYER FEEDBACK</p>
                                <h3>Session Feedback</h3>
                            </div>
                            {!pendingSession ? <p>No pending feedback!</p> : (
                                <div className="feedbackForm">
                                    <p><strong>{pendingSession.name}</strong></p>
                                    <p>{new Date(pendingSession.start_datetime).toLocaleString("en-AU")}</p>
                                    <label>Session Intensity</label>
                                    <select value={intensity} onChange={(e) => setIntensity(e.target.value)}>
                                        <option value="">Select intensity</option>
                                        {[1,2,3,4,5,6,7,8,9,10].map(n => <option key={n} value={n}>{n}</option>)}
                                    </select>
                                    <label>Actual Duration (minutes)</label>
                                    <input type="number" value={durationMinutes} onChange={(e) => setDurationMinutes(e.target.value)} />
                                    <label>Comment</label>
                                    <textarea placeholder="How did you feel during the session?" value={notes} onChange={(e) => setNotes(e.target.value)} />
                                    <button className="dashboardBtn" onClick={handleSave}>Submit Feedback</button>
                                </div>
                            )}
                        </div>
                    )}

                </div>

                {/* RIGHT COLUMN */}
                <div className="rightColumn">
                    <div className="chartBox">
                        <div className="sectionHeader">
                            <p className="dashboardLabel">PERFORMANCE</p>
                            <h3>Current Strengths</h3>
                        </div>
                        <div className="tagList">
                            {strengths.map((item, i) => <span className="positiveTag" key={i}>{item}</span>)}
                        </div>
                    </div>

                    <div className="chartBox">
                        <div className="sectionHeader">
                            <p className="dashboardLabel">FOCUS AREA</p>
                            <h3>Current Weaknesses</h3>
                        </div>
                        <div className="tagList">
                            {weaknesses.map((item, i) => <span className="warningTag" key={i}>{item}</span>)}
                        </div>
                    </div>

                    <div className="chartBox">
                        <div className="sectionHeader">
                            <p className="dashboardLabel">LATEST ACTIVITY</p>
                            <h3>Coach Update Board</h3>
                        </div>
                        <div className="updateBoard">
                            {coachUpdates.map((update, i) => (
                                <div className="updateItem" key={i}>
                                    <p className="updateType">{update.type}</p>
                                    <p className="updateMessage">{update.message}</p>
                                    <span className="updateTime">{update.time}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
