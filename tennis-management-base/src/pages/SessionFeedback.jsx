import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { LOADING_OVERLAY } from "../Components/SharedComponents";
import { useLocation } from "react-router-dom";

import "./SessionFeedback.css";

// Benchmark Logic RPE Session Intensity.
function getIntensityZone(intensity) {
    if (intensity >= 1 && intensity <= 3) return "easy";
    if (intensity >= 4 && intensity <= 6) return "medium";
    if (intensity >= 7 && intensity <= 10) return "hard";
}

// Save feeedback to database
export default function SessionFeedback() {

    const [sessions, setSessions] = useState([]);
    const [feedback, setFeedback] = useState([]);
    const [selectedSession, setSelectedSession] = useState(null);

    const [intensity, setIntensity] = useState("");
    const [durationMinutes, setDurationMinutes] = useState("");
    const [notes, setNotes] = useState("");

    // LOADING STATE
    const [isLoading, setIsLoading] = useState(true);

    // EDIT FEEDBACK STATE
    const [selectedFeedback, setSelectedFeedback] = useState(null);

    // REACTIVE/LOCATION STATE
    const location = useLocation();
    const selectedSessionId = location.state?.selectedSessionId;

    // FETCH SESSIONS DATA
    async function fetchMySessions() {
        setIsLoading(true);
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) { console.log("No user logged in"); return; }

        const { data, error } = await supabase
            .from("sessions")
            .select(`
                *,
                session_people!inner(user_id)
            `)
            .eq("session_people.user_id", user.id);

        if (error) {
            console.log("Error fetching sessions:", error.message);
            setSessions([]);
        } else {
            setSessions(data);
        }
        setIsLoading(false);
    }

    // FETCH SESSION FEEDBACKS
    async function fetchFeedback() {
        setIsLoading(true);
        const { data: { user } } = await supabase.auth.getUser();

        const { data, error } = await supabase
            .from("session_feedback")
            .select("*")
            .eq("player_id", user.id);

        if (error) {
            console.log("Error fetching feedback:", error.message);
            setFeedback([]);
        } else {
            setFeedback(data);
        }
        setIsLoading(false);
    }

    useEffect(() => {
        fetchMySessions();
        fetchFeedback();
    }, []);

    useEffect(() => {
        if (!selectedSessionId || sessions.length === 0) return;

        const session = sessions.find(
            s => s.id === selectedSessionId
        );

        if (!session) return;

        const existingFeedback = feedback.find(
            f => f.session_id === session.id
        );

        setSelectedSession(session);
        setSelectedFeedback(existingFeedback || null);

        if (existingFeedback) {
            setIntensity(existingFeedback.intensity);
            setDurationMinutes(existingFeedback.duration_minutes);
            setNotes(existingFeedback.feedback_notes || "");
        }
    }, [selectedSessionId, sessions, feedback]);

    function durationToMinutes(duration) {
        if (!duration) return 0;
        const [hours, minutes, seconds] = duration.split(":").map(Number);
        return hours * 60 + minutes + Math.round(seconds / 60);
    }

    // FILTER SESSIONS
    const now = new Date();

    // RATED FILTER
    const ratedSessions = sessions.filter(session =>
        feedback.some(f => f.session_id === session.id)
    );
    // SORT NEWEST TO OLDEST, AND TAKING 5 RECENT SESSIONS
    const recentRatedSessions = [...ratedSessions]
        .sort((a, b) => new Date(b.end_datetime) - new Date(a.end_datetime))
        .slice(0, 5);

    // UNRATED FILTER
    const unratedSessions = sessions.filter(session =>
        new Date(session.end_datetime) < now &&
        !feedback.some(f => f.session_id === session.id)
    );

    // UPCOMING SESSIONS FILTER
    const upcomingSessions = sessions.filter(session =>
        new Date(session.end_datetime) >= now
    );

    // SAVING INPUT TO SESSION_FEEDBACK
    async function handleSave() {
        const { data: { user } } = await supabase.auth.getUser();

        const intensityNum = Number(intensity);
        const durationMins = Number(durationMinutes);

        const payload = {
            session_id: selectedSession.id,
            player_id: user.id,
            intensity: intensityNum,
            duration_minutes: durationMins,
            rpe_load: intensityNum * durationMins,
            intensity_zone: getIntensityZone(intensityNum),
            feedback_notes: notes
        };

        let error;

        // Saves Updates
        if (selectedFeedback) {
            const result = await supabase
                .from("session_feedback")
                .update(payload)
                .eq("id", selectedFeedback.id);

            error = result.error;
        } else {
            const result = await supabase
                .from("session_feedback")
                .insert([payload]);

            error = result.error;
        }

        if (error) {
            console.log("SAVE ERROR", error);
            alert("Failed to save: " + error.message);
        }
        else {
            alert(selectedFeedback ? "Feedback updated!" : "Feedback saved!");
            setSelectedSession(null);
            setSelectedFeedback(null);
            setIntensity("");
            setDurationMinutes("");
            setNotes("");
            fetchFeedback();
        }
    }

    // HELPER FUNCTION FOR RENDERING SESSIONS
    function renderSessionCard(session) {
        const isCompleted = new Date(session.end_datetime) < new Date();
        const existingFeedback = feedback.find(
            f => f.session_id === session.id
        );
        const isRated = !!existingFeedback;

        return (
            <div
                key={session.id}
                className={`sf-card ${isRated ? "rated" : "not-rated"}`}
                onClick={() => {
                    if (!isCompleted) return;

                    setSelectedSession(session);
                    setSelectedFeedback(existingFeedback || null);

                    if (existingFeedback) {
                        setIntensity(existingFeedback.intensity);
                        setDurationMinutes(existingFeedback.duration_minutes);
                        setNotes(existingFeedback.feedback_notes || "");
                    } else {
                        setIntensity("");
                        setDurationMinutes(durationToMinutes(session.duration));
                        setNotes("");
                    }
                }}>

                <div className="sf-card-content">
                    <h3>{session.name}</h3>
                    <p> {new Date(session.start_datetime).toLocaleDateString("en-AU", { weekday: "short", day: "numeric", month: "short" })} </p>
                    <p> Duration: {session.duration} </p>
                    <span className={`sf-status ${isRated ? "rated" : "not-rated"}`}> {isRated ? "Rated" : "Not Rated"}</span>

                </div>
            </div>
        );
    }

    return (
        <div id="layout">
            {/* Loading overlay */}
            {isLoading && <LOADING_OVERLAY caption={"session feedbacks"} />}

            <div id="main-content-wrapper">
                <div id="main-content">
                    <div id="sf-page">
                        <div className="sf-header">
                            <div>
                                <h2 className="content-header" style={{ padding: 0, marginBottom: '4px' }}>Session Feedback</h2>
                                <p className="sf-subtitle">
                                    Rate your completed sessions and track your training load.
                                </p>
                            </div>
                        </div>

                        {/* Sessions Grid */}
                        <div id="sf-main-panel">
                            <div className="sf-panel-header"> <h3> RATED SESSIONS </h3> </div>
                            <div className="sf-grid"> {recentRatedSessions.map(renderSessionCard)} </div>
                        </div>

                        <div id="sf-main-panel">
                            <div className="sf-panel-header"> <h3> SESSIONS TO BE RATED </h3> </div>
                            <div className="sf-grid"> {unratedSessions.map(renderSessionCard)} </div>
                        </div>

                        {selectedSession && (
                            <div id="drill-modal-overlay">
                                <div className="drill-modal" style={{ maxWidth: '620px' }}>
                                    <div className="drill-modal-header">
                                        <span className="drill-modal-title"> Give Session Feedback </span>
                                    </div>

                                    <div className="drill-modal-body">
                                        <div className="drill-form-group">
                                            <p className="drill-modal-title" style={{ color: "var(--accent-color)" }} >{selectedSession.name} - {new Date(selectedSession.start_datetime).toLocaleDateString("en-AU", { weekday: "short", day: "numeric", month: "short" })}</p>
                                            <p className="drill-form-label"> Planned Duration: {durationToMinutes(selectedSession.duration) + " minutes"} </p>

                                            <label className="drill-form-label">Session Intensity</label>
                                            <select className="drill-form-select" value={intensity} onChange={(e) => setIntensity(e.target.value)}>
                                                <option value="">Select intensity</option>
                                                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => <option key={n} value={n}>{n}</option>)}
                                            </select>

                                            <label className="drill-form-label">Actual Duration (minutes)</label>
                                            <input className="drill-form-input" type="number" value={durationMinutes} onChange={(e) => setDurationMinutes(e.target.value)} />

                                            <label className="drill-form-label">Comment</label>
                                            <textarea className="drill-form-textarea" placeholder="How was the session?" value={notes} onChange={(e) => setNotes(e.target.value)} />

                                            <div className="sf-form-actions">
                                                <button className="sf-btn sf-btn-ghost" onClick={() => setSelectedSession(null)}> Cancel </button>
                                                <button className="sf-btn active" onClick={handleSave}> Save Feedback </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div >
        </div >
    );
}