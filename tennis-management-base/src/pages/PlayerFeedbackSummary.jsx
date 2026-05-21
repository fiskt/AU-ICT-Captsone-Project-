import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { useLocation } from "react-router-dom";
import "./PlayerFeedbackSummary.css";

export default function FeedbackSummary() {
    const location = useLocation();

    const selectedZone = location.state?.zone || "";

    const [players, setPlayers] = useState([]);
    const [selectedPlayerId, setSelectedPlayerId] = useState("");
    const [feedback, setFeedback] = useState([]);
    const [loading, setLoading] = useState(false);

    const filteredFeedback = feedback.filter((item) => {
        if (!selectedZone) return true;
        return item.intensity_zone === selectedZone;
    });

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
        fetchPlayerFeedback("");
    }, []);

    useEffect(() => {
        fetchPlayerFeedback(selectedPlayerId);
    }, [selectedPlayerId]);

    return (
        <div className="content-box">
            <div className="content-box-top">
                <div className="content-box-top-left">
                    <h2 className="content-header">
                        Player Feedback Summary
                    </h2>
                </div>

                <div className="content-box-top-right">
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
                </div>
            </div>

            {selectedZone && (
                <p className="feedback-filter-label">
                    Showing {selectedZone.toUpperCase()} feedback
                </p>
            )}

            <div className="feedback-summary-list">
                {loading ? (
                    <p>Loading feedback...</p>
                ) : filteredFeedback.length > 0 ? (
                    filteredFeedback.map((item) => (
                        <div className="feedback-summary-item" key={item.id}>
                            <div className="feedback-summary-top">
                                <div>
                                    <h3 className="feedback-session-name">
                                        {item.sessions?.name || "Unnamed Session"}
                                    </h3>

                                    <p className="feedback-session-date">
                                        {item.sessions?.start_datetime
                                            ? new Date(item.sessions.start_datetime).toLocaleDateString("en-AU")
                                            : "No date"}
                                    </p>
                                </div>

                                <div className={`feedback-zone ${item.intensity_zone}`}>
                                    {item.intensity}/10
                                </div>
                            </div>

                            <div className="feedback-meta">
                                <span>
                                    Zone: {item.intensity_zone}
                                </span>

                                <span>
                                    Duration: {item.duration_minutes} mins
                                </span>

                                <span>
                                    Load: {item.rpe_load}
                                </span>
                            </div>

                            <p className="feedback-note">
                                {item.feedback_notes || "No notes submitted"}
                            </p>
                        </div>
                    ))
                ) : (
                    <p>No feedback found.</p>
                )}
            </div>
        </div>
    );
}