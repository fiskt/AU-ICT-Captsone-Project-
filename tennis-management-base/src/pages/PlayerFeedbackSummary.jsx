import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

import { useLocation, useNavigate } from "react-router-dom";

import "./PlayerFeedbackSummary.css";

export default function FeedbackSummary() {
    // ROUTER STATE
    const location = useLocation();
    const navigate = useNavigate();

    const [selectedZone, setSelectedZone] = useState(location.state?.zone || "");

    const [players, setPlayers] = useState([]);
    const [selectedPlayerId, setSelectedPlayerId] = useState("");
    const [feedback, setFeedback] = useState([]);
    const [loading, setLoading] = useState(false);

    // WEEK OFFSET STATE
    const [weekOffset, setWeekOffset] = useState(0);

    // WEEKLY NAVIGATION
    const today = new Date();

    const startOfSelectedWeek = new Date(today);
    startOfSelectedWeek.setDate(today.getDate() - today.getDay() + weekOffset * 7);
    startOfSelectedWeek.setHours(0, 0, 0, 0);

    const endOfSelectedWeek = new Date(startOfSelectedWeek);
    endOfSelectedWeek.setDate(startOfSelectedWeek.getDate() + 6);
    endOfSelectedWeek.setHours(23, 59, 59, 999);

    // FILTER FEEDBACK ACORDING TO ZONE, WEEK
    const filteredFeedback = feedback.filter((item) => {
        if (selectedZone && item.intensity_zone !== selectedZone) {
            return false;
        }

        const sessionDate = item.sessions?.start_datetime
            ? new Date(item.sessions.start_datetime)
            : null;

        if (!sessionDate) return false;

        return sessionDate >= startOfSelectedWeek && sessionDate <= endOfSelectedWeek;
    });

    // HELPER FUNCTION TO CHANGE DURATION (00:00:00) TO MINUTES
    function durationToMinutes(duration) {
        if (!duration) return 0;
        const [hours, minutes, seconds] = duration.split(":").map(Number);
        return hours * 60 + minutes + Math.round(seconds / 60);
    }

    async function fetchPlayers() {
        const { data, error } = await supabase
            .from("signin_details")
            .select("*")
            .eq("role", "player");

        if (error) {
            console.log("Error fetching players:", error.message);
            setPlayers([]);
        } else {
            setPlayers(data || []);
        }
    }

    async function fetchPlayerFeedback(playerId = "") {
        setLoading(true);

        let query = supabase
            .from("session_feedback")
            .select(`
            *,
            sessions (
                id,
                name,
                start_datetime,
                duration
            ),
            signin_details!session_feedback_player_id_fkey (
                first_name,
                last_name
            )
        `)
            .order("created_at", { ascending: false });

        if (playerId) {
            query = query.eq("player_id", playerId);
        }

        const { data, error } = await query;

        if (error) {
            console.log("Error fetching feedback:", error.message);
            setFeedback([]);
        } else {
            console.log("Feedback data:", data);
            setFeedback(data || []);
        }

        setLoading(false);
    }

    useEffect(() => {
        fetchPlayers();
    }, []);

    // READ PASSED PLAYER NAME FROM NAVIGATE
    const selectedPlayerFromDashboard = location.state?.player || "All Athletes";

    useEffect(() => {
        if (!players.length) return;

        if (
            selectedPlayerFromDashboard &&
            selectedPlayerFromDashboard !== "All Athletes"
        ) {
            const matchedPlayer = players.find(
                p => `${p.first_name} ${p.last_name}` === selectedPlayerFromDashboard
            );

            if (matchedPlayer) {
                setSelectedPlayerId(matchedPlayer.id);
            }
        }
    }, [players, selectedPlayerFromDashboard]);

    useEffect(() => {
        fetchPlayerFeedback(selectedPlayerId);}, [selectedPlayerId]);

    return (
        <div id="drill-modal-overlay">
            <div className="drill-modal">
                <div className="drill-modal-header">
                    <span className="drill-modal-title">Player Feedback Summary</span>
                </div>
                <select
                    className="drill-form-select"
                    value={selectedPlayerId}
                    onChange={(e) => setSelectedPlayerId(e.target.value)}
                >
                    <option value="">All Players</option>

                    {players.map((player) => (
                        <option key={player.id} value={player.id}>
                            {player.first_name} {player.last_name}
                        </option>
                    ))}
                </select>
                <div className="feedbackLabel">
                    <button className={`weekButton ${selectedZone === "" ? "active" : ""}`} onClick={() => setSelectedZone("")}>All</button>
                    <button className={`weekButton ${selectedZone === "easy" ? "active" : ""}`} onClick={() => setSelectedZone("easy")}>Easy</button>
                    <button className={`weekButton ${selectedZone === "medium" ? "active" : ""}`} onClick={() => setSelectedZone("medium")}>Medium</button>
                    <button className={`weekButton ${selectedZone === "hard" ? "active" : ""}`} onClick={() => setSelectedZone("hard")}>Hard</button>
                </div>
                {selectedZone && (
                    <p className="feedbackLabel">Showing {selectedZone.toUpperCase()} feedback</p>
                )}
                {/* WEEK NAVIGATION BUTTON */}
                <div className="feedbackLabel">
                    <button className="weekButton" onClick={() => setWeekOffset(weekOffset - 1)}> Previous Week </button>
                    <button className={`weekButton ${weekOffset === 0 ? "active" : ""}`} onClick={() => setWeekOffset(0)}> This Week </button>
                    <button className="weekButton" onClick={() => setWeekOffset(weekOffset + 1)}> Next Week </button>
                </div>

                {/* WEEK DATE LABEL */}
                <p class="feedbackLabel"> {startOfSelectedWeek.toLocaleDateString("en-AU")} - {endOfSelectedWeek.toLocaleDateString("en-AU")} </p>

                <div className="drill-modal-body">
                    <div className="feedback-summary-grid">
                        {loading ? (
                            <p>Loading feedback...</p>
                        ) : filteredFeedback.length > 0 ? (
                            filteredFeedback.map((item) => (
                                <div className="feedback-summary-card" key={item.id}
                                    onClick={() =>
                                        navigate("/SessionFeedback", {
                                            state: {
                                                selectedSessionId: item.session_id,
                                                selectedFeedbackId: item.id,
                                                isCoachPreview: true,
                                            },
                                        })
                                    }>
                                    <div className="feedback-summary-top">
                                        <h3>{item.sessions?.name || "Unnamed Session"}</h3>
                                    </div>

                                    <div className="feedback-summary-content">
                                        <span>{item.signin_details?.first_name} {item.signin_details?.last_name}</span>
                                        <span className={`feedback-status ${item.intensity_zone}`}>{item.intensity}/10</span>
                                        <p>{item.sessions?.start_datetime ? new Date(item.sessions.start_datetime).toLocaleDateString("en-AU", { weekday: "short", day: "numeric", month: "short" }) : "No date"}</p>
                                        <p>Planned Duration: {durationToMinutes(item.sessions?.duration)}  mins</p>
                                        <p>Actual Duration: {item.duration_minutes} mins</p>
                                        <p>RPE Load: {item.rpe_load}</p>

                                        <p className="feedback-note">{item.feedback_notes || "No notes submitted"}</p>
                                    </div>

                                </div>
                            ))
                        ) : (
                            <p className="feedbackLabel" style={{ gridColumn: "1 / -1", justifySelf: "center" }}>No feedback found.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}