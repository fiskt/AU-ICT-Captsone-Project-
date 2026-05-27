import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { COACH_SIDEBAR } from '../Components/SharedComponents';

import '../App.css';
import './Dashboard.css';

import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
    ResponsiveContainer,
    BarChart,
    Bar,
    Legend,
} from "recharts";


export default function Dashboard() {
    // NAVIGATE TO OTHER PAGES
    const navigate = useNavigate();

    // DEFAULT STATE
    const [selectedPlayer, setSelectedPlayer] = useState("All Players");
    const [players, setPlayers] = useState([]);
    const [weeklyData, setWeeklyData] = useState([]);

    // STATE FOR SESSIONS
    const [sessions, setSessions] = useState([]);
    const [upcomingSessions, setUpcomingSessions] = useState([]);

    // PLAYERS STATE
    const activePlayers = new Set(
        sessions.flatMap(session =>
            session.session_people
                ?.filter(p => p.signin_details.role === "player")
                .map(p => p.signin_details.id)
        )
    ).size;

    // FETCH SESSIONS DATA, INCL RPE VALUES
    async function fetchSessions() {
        const { data, error } = await supabase
            .from("sessions")
            .select(`
                *,
                session_people!inner(
                    signin_details!inner(id, first_name, last_name, role)
                ),
                session_feedback(
                session_id, player_id, intensity, rpe_load, intensity_zone)
            `)
            .order("start_datetime", { ascending: true });

        if (error) {
            console.log("Error fetching sessions:", error.message);
            return;
        }

        setSessions(data || []);

        // DATA TO USE IN RPE GRAPH
        const graphRows = [];

        (data || []).forEach(session => {
            const week = new Date(session.start_datetime).toISOString().slice(0, 10);

            const sessionPlayers = session.session_people
                ?.filter(p => p.signin_details.role === "player") || [];

            sessionPlayers.forEach(p => {
                const player = p.signin_details;
                const playerName = `${player.first_name} ${player.last_name}`;

                const feedback = session.session_feedback?.find(f =>
                    f.player_id === player.id &&
                    f.session_id === session.id
                );

                graphRows.push({
                    week,
                    player: playerName,
                    plannedLoad: Number(session.rpe || 0),
                    actualLoad: Number(feedback?.rpe_load || 0),
                });
            });
        });

        setWeeklyData(graphRows);
        const now = new Date();

        const upcoming = (data || []).filter(session =>
            new Date(session.end_datetime) >= now
        );

        setUpcomingSessions(upcoming);
    }

    async function fetchPlayers() {
    const { data, error } = await supabase
        .from("signin_details")
        .select("id, first_name, last_name, role")
        .eq("role", "player");

    if (error) {
        console.log("Error fetching players:", error.message);
        setPlayers([]);
    } else {
        setPlayers(data || []);
    }
}
    useEffect(() => {
        fetchSessions();
        fetchPlayers();
    }, []);

    // FILTERED DATA
    const filteredData =
        selectedPlayer === "All Players"
            ? Object.values(
                weeklyData.reduce((acc, item) => {
                    if (!acc[item.week]) {
                        acc[item.week] = {
                            week: item.week,
                            plannedLoad: 0,
                            actualLoad: 0,
                        };
                    }

                    acc[item.week].plannedLoad += item.plannedLoad;
                    acc[item.week].actualLoad += item.actualLoad;

                    return acc;
                }, {})
            )
            : weeklyData.filter((d) => d.player === selectedPlayer);

    const filteredSessions =
        selectedPlayer === "All Players"
            ? sessions
            : sessions.filter(session =>
                session.session_people?.some(
                    p =>
                        p.signin_details.role === "player" &&
                        `${p.signin_details.first_name} ${p.signin_details.last_name}` === selectedPlayer
                )
            );

    const intensitySummary = {
        easy: 0,
        medium: 0,
        hard: 0,
    };

    filteredSessions.forEach(session => {
        session.session_feedback?.forEach(feedback => {
            const intensity = Number(feedback.intensity || 0);

            if (intensity >= 1 && intensity <= 3) {
                intensitySummary.easy++;
            } else if (intensity >= 4 && intensity <= 6) {
                intensitySummary.medium++;
            } else if (intensity >= 7) {
                intensitySummary.hard++;
            }
        });
    });

    return (
        <div id="layout">
            <COACH_SIDEBAR />

            <div id="main-content-wrapper">
                <div id="main-content">
                    <div className="dashboardPage">

                        {/* HEADER */}
                        <div className="dashboardHeader">
                            <div>
                                <p className="dashboardLabel">PERFORMANCE OVERVIEW</p>
                                <h1 className="dashboardTitle">Coach Dashboard</h1>
                            </div>

                            <select
                                className="playerSelect"
                                value={selectedPlayer}
                                onChange={(e) => setSelectedPlayer(e.target.value)}
                            >
                                <option>All Players</option>

                                {players.map(player => (
                                    <option
                                        key={player.id}
                                        value={`${player.first_name} ${player.last_name}`}
                                    >
                                        {player.first_name} {player.last_name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* STATS */}
                        <div id="drill-stats-row">

                            <div className="drill-stat-card">
                                <span className="drill-stat-label">Total Sessions</span>
                                <span className="drill-stat-value accent">{sessions.length}</span>
                                <span className="drill-stat-sub">Sessions logged</span>
                            </div>

                            <div className="drill-stat-card">
                                <p className="drill-stat-label">ACTIVE PLAYERS</p>
                                <h2 className="drill-stat-value">{activePlayers}</h2>
                            </div>

                            <div className="drill-stat-card">
                                <p className="drill-stat-label">WEEKLY GROWTH</p>
                                <h2 className="drill-stat-value">+18%</h2>
                            </div>

                            <div className="drill-stat-card">
                                <p className="drill-stat-label">AVG RPE</p>
                                <h2 className="drill-stat-value">7.2</h2>
                            </div>
                        </div>

                        {/* MAIN GRID */}
                        <div className="dashboardGrid">

                            {/* LEFT */}
                            <div className="leftColumn">

                                {/* RPE GRAPH */}
                                <div className="chartBox">
                                    <div className="sectionHeader">
                                        <p className="dashboardLabel">
                                            PLAYER DASHBOARD
                                        </p>

                                        <h3>
                                            Planned vs Actual Training Load
                                        </h3>
                                    </div>

                                    <ResponsiveContainer width="100%" height={340}>
                                        <LineChart
                                            data={filteredData}
                                            margin={{
                                                top: 10,
                                                right: 10,
                                                left: -20,
                                                bottom: 0,
                                            }}
                                        >
                                            <CartesianGrid
                                                strokeDasharray="3 3"
                                                vertical={false}
                                                stroke="#f3f4f6"
                                            />

                                            <XAxis
                                                dataKey="week"
                                                tick={{ fill: "#6b7280", fontSize: 12 }}
                                                tickLine={false}
                                                axisLine={false}
                                            />

                                            <YAxis
                                                tick={{ fill: "#6b7280", fontSize: 12 }}
                                                tickLine={false}
                                                axisLine={false}
                                            />

                                            <Tooltip
                                                contentStyle={{
                                                    borderRadius: "12px",
                                                    border: "none",
                                                    boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                                                }}
                                            />

                                            <Legend />

                                            <Line
                                                type="monotone"
                                                dataKey="plannedLoad"
                                                stroke="#f59e0b"
                                                strokeWidth={3}
                                                dot={{
                                                    r: 4,
                                                    strokeWidth: 2,
                                                    fill: "#fff",
                                                }}
                                                activeDot={{ r: 7 }}
                                                name="Planned Load"
                                            />

                                            <Line
                                                type="monotone"
                                                dataKey="actualLoad"
                                                stroke="#ec7842"
                                                strokeWidth={4}
                                                dot={{
                                                    r: 5,
                                                    strokeWidth: 2,
                                                    fill: "#fff",
                                                }}
                                                activeDot={{ r: 8 }}
                                                name="Actual Load"
                                            />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>

                                {/* INTENSITY CARD */}
                                <div className="chartBox">
                                    <div className="sectionHeader">
                                        <p className="dashboardLabel">
                                            TRAINING INTENSITY
                                        </p>

                                        <h3>RPE Intensity Zones</h3>

                                        <div className="intensityCards">

                                            <div className="intensityCard easy"
                                                onClick={() =>
                                                    navigate("/PlayerFeedbackSummary", {
                                                        state: {
                                                            zone: "easy",
                                                            player: selectedPlayer
                                                        }
                                                    })
                                                }
                                                style={{ cursor: "pointer" }}>
                                                <p className="cardLabel">EASY</p>
                                                <h2>{intensitySummary.easy}</h2>
                                                <span>1–3 RPE</span>
                                            </div>

                                            <div className="intensityCard medium"
                                                onClick={() =>
                                                    navigate("/PlayerFeedbackSummary", {
                                                        state: {
                                                            zone: "medium",
                                                            player: selectedPlayer
                                                        }
                                                    })
                                                }
                                                style={{ cursor: "pointer" }}>
                                                <p className="cardLabel">MEDIUM</p>
                                                <h2>{intensitySummary.medium}</h2>
                                                <span>4–6 RPE</span>
                                            </div>

                                            <div className="intensityCard hard"
                                                onClick={() =>
                                                    navigate("/PlayerFeedbackSummary", {
                                                        state: {
                                                            zone: "hard",
                                                            player: selectedPlayer
                                                        }
                                                    })
                                                }
                                                style={{ cursor: "pointer" }}>
                                                <p className="cardLabel">HARD</p>
                                                <h2>{intensitySummary.hard}</h2>
                                                <span>7–10 RPE</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                            </div>

                            {/* RIGHT */}
                            <div className="rightColumn">

                                <div className="chartBox">
                                    <div className="sectionHeader">
                                        <p className="dashboardLabel">
                                            COACH DASHBOARD
                                        </p>

                                        <h3>Upcoming Sessions</h3>
                                    </div>

                                    <div className="sessionList">
                                        {upcomingSessions.length > 0 ? (
                                            upcomingSessions.map((s) => (
                                                <div key={s.id} className="sessionItem"
                                                    onClick={() => navigate("/CoachCalendar", { state: { openSessionId: s.id } })}
                                                    style={{ cursor: "pointer" }}>
                                                    <div className="sessionMain">
                                                        <p className="sessionClient">
                                                            {s.session_people
                                                                ?.filter(p => p.signin_details.role === "player")
                                                                .map(p => `${p.signin_details.first_name} ${p.signin_details.last_name}`)
                                                                .join(", ") || "No player"}
                                                        </p>

                                                        <p className="sessionName">{s.name}</p>
                                                    </div>

                                                    <div className="sessionInfo">
                                                        <span>{new Date(s.start_datetime).toLocaleDateString("en-AU")}</span>
                                                        <span>{new Date(s.start_datetime).toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit" })}</span>
                                                        <span>{s.duration}</span>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <p>No upcoming sessions.</p>
                                        )}
                                    </div>
                                </div>

                            </div>

                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
