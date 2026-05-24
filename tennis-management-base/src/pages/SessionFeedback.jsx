import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { PLAYER_SIDEBAR} from "../Components/SharedComponents";
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

    async function fetchMySessions() {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            console.log("No user logged in");
            return;
        }

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
    }

    async function fetchFeedback() {
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
    }

    useEffect(() => {
        fetchMySessions();
        fetchFeedback();
    }, []);

    function durationToMinutes(duration) {
        if (!duration) return 0;

        const [hours, minutes, seconds] = duration.split(":").map(Number);
        return hours * 60 + minutes + Math.round(seconds / 60);
    }

    async function handleSave() {
        const { data: { user } } = await supabase.auth.getUser();

        if (!selectedSession) {
            alert("Please select a session first.");
            return;
        }

        const rpeLoad = Number(intensity) * Number(durationMinutes);
        const intensityZone = getIntensityZone(Number(intensity));

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

        console.log("Saving payload:", payload);

        const { error } = await supabase
            .from("session_feedback")
            .insert([payload]);

        if (error) {
            console.log("SAVE ERROR", error);
            alert("Failed to save: " + error.message);
        }
        else {
            alert("Feedback saved!");
            setSelectedSession(null);
            setIntensity("");
            setDurationMinutes("");
            setNotes("");
            fetchFeedback();
        }
    }

    return (
        <div id="layout">
            <PLAYER_SIDEBAR />

            <div id="main-content-wrapper">
                <div id="main-content">
                    <div id="sf-page">
                        <div className="sf-header">
                            <div>
                                <h2 className="content-header">Session Feedback</h2>
                                <p className="sf-subtitle">
                                    Rate your completed sessions and trach your training load.
                                </p>
                            </div>
                        </div>

                        <div className="sf-grid">
                            {sessions.map(session => {
                                const isRated = feedback.some(f => f.session_id === session.id);

                                return (
                                    <div
                                        key={session.id}
                                        className={`sf-card ${isRated ? "rated" : "not-rated"}`}
                                        onClick={() => {
                                            if (!isRated) {
                                                setSelectedSession(session);
                                                setDurationMinutes(durationToMinutes(session.duration));
                                            }
                                        }}
                                    >
                                        <span className="sf-card-date">
                                            {new Date(session.start_datetime).toLocaleString("en-AU")}
                                        </span>

                                        <h3 className="sf-card-title">{session.name}</h3>

                                        <p className="sf-card-info">
                                            Duration: {session.duration}
                                        </p>

                                        <span className={`sf-status ${isRated ? "rated" : "not-rated"}`}>
                                            {isRated ? "Rated" : "Not Rated"}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>

                        {selectedSession && (
                            <div className="sf-form-box">
                                <h3 className="sf-form-title">
                                    Give Feedback for {selectedSession.name}
                                </h3>

                                <p>
                                    Planned Duration: {durationToMinutes(selectedSession.duration) + " minutes"}
                                </p>

                                <div className="sf-form-group">
                                    <label className="sf-label">Intensity</label>
                                    <select
                                        className="sf-input"
                                        value={intensity}
                                        onChange={(e) => setIntensity(e.target.value)}
                                    >
                                        <option value="">Select Intensity</option>

                                        <option value="1">1</option>
                                        <option value="2">2</option>
                                        <option value="3">3</option>

                                        <option value="4">4</option>
                                        <option value="5">5</option>
                                        <option value="6">6</option>

                                        <option value="7">7</option>
                                        <option value="8">8</option>
                                        <option value="9">9</option>
                                        <option value="10">10</option>
                                    </select>
                                </div>

                                <div className="sf-form-group">
                                    <label className="sf-label">Actual Duration</label>
                                    <input
                                        className="sf-input"
                                        type="number"
                                        placeholder="Actual training duration in minutes"
                                        value={durationMinutes}
                                        onChange={(e) => setDurationMinutes(e.target.value)}
                                    />
                                </div>

                                <div className="sf-form-group">
                                    <label className="sf-label">Notes</label>
                                    <textarea
                                        className="sf-textarea"
                                        placeholder="Notes"
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                    />
                                </div>

                                <div className="sf-form-actions">
                                    <button
                                        className="sf-btn sf-btn-ghost"
                                        onClick={() => setSelectedSession(null)}
                                    >
                                        Cancel
                                    </button>

                                    <button className="sf-btn sf-btn-primary" onClick={handleSave}>
                                        Save Feedback
                                    </button>
                                </div>

                            </div>
                        )}
                    </div>
                </div>
            </div></div>
    );
}