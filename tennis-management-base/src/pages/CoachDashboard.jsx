import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { LOADING_OVERLAY } from '../Components/SharedComponents';

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
    const [selectedPlayer, setSelectedPlayer] = useState("All Athletes");
    const [Athletes, setAthletes] = useState([]);

    const [weeklyData, setWeeklyData] = useState([]);

    // STATE FOR SESSIONS
    const [sessions, setSessions] = useState([]);

    // Athletes STATE
    const activeAthletes = new Set(
        sessions.flatMap(session =>
            session.session_people
                ?.filter(p => p.signin_details.role === "player")
                .map(p => p.signin_details.id)
        )
    ).size;

    // LOADING STATE
    const [isLoading, setIsLoading] = useState(true);

    // WEEK OFFSET STATE
    const [weekOffset, setWeekOffset] = useState(0);

    // WEEKLY NAVIGATION
    const today = new Date();

    const startOfSelectedWeek = new Date(today);
    startOfSelectedWeek.setDate(today.getDate() - today.getDay() + 1 + weekOffset * 7);
    startOfSelectedWeek.setHours(0, 0, 0, 0);

    const endOfSelectedWeek = new Date(startOfSelectedWeek);
    endOfSelectedWeek.setDate(startOfSelectedWeek.getDate() + 6);
    endOfSelectedWeek.setHours(23, 59, 59, 999);

    // FETCH SESSIONS DATA, INCL RPE VALUES
    async function fetchSessions() {
        setIsLoading(true);

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

            const sessionAthletes = session.session_people
                ?.filter(p => p.signin_details.role === "player") || [];

            const assignedAthletes = sessionAthletes
                .map(p => `${p.signin_details.first_name} ${p.signin_details.last_name}`)
                .join(", ");

            sessionAthletes.forEach(p => {
                const player = p.signin_details;
                const playerName = `${player.first_name} ${player.last_name}`;

                const feedback = session.session_feedback?.find(f =>
                    f.player_id === player.id &&
                    f.session_id === session.id
                );
                graphRows.push({
                    label: `${week}\n${session.name}`,
                    week,
                    player: playerName,
                    assignedAthletes,
                    sessionName: session.name,
                    plannedLoad: Number(session.rpe || 0),
                    actualLoad: Number(feedback?.rpe_load || 0),
                });
            });
        });

        setWeeklyData(graphRows);
        setIsLoading(false);
    }

    // FETCH ATHLETES DETAILS
    async function fetchAthletes() {
        setIsLoading(true);

        const { data, error } = await supabase
            .from("signin_details")
            .select("id, first_name, last_name, role")
            .eq("role", "player");

        if (error) {
            console.log("Error fetching Athletes:", error.message);
            setAthletes([]);
        }
        else {
            setAthletes(data || []);
        }

        setIsLoading(false);
    }

    useEffect(() => {
        fetchSessions();
        fetchAthletes();
    }, []);

    // CUSTOM TOOLTIP DISPLAY: RPE GRAPH HOVER
    function CustomTooltip({ active, payload }) {
        if (active && payload && payload.length) {
            const data = payload[0].payload;

            return (
                <div className="customTooltip">
                    <p>Date: {data.week}</p>
                    <p>Session: {data.sessionName}</p>
                    <p>Athlete: {data.assignedAthletes || "No Athlete Assigned"}</p>
                    <p>Planned Load: {data.plannedLoad}</p>
                    <p>Actual Load: {data.actualLoad}</p>
                </div>
            );
        }

        return null;
    }

    // FILTERED DATA: SELECTED ATHLETES GRAPH DATA
    const filteredData =
        selectedPlayer === "All Athletes"
            ? Object.values(
                weeklyData.reduce((acc, item) => {
                    const key = `${item.week}-${item.sessionName}`;

                    if (!acc[key]) {
                        acc[key] = {
                            label: item.label,
                            week: item.week,
                            sessionName: item.sessionName,
                            assignedAthletes: item.assignedAthletes,
                            plannedLoad: item.plannedLoad,
                            actualLoad: 0,
                        };
                    }
                    acc[key].actualLoad += item.actualLoad;
                    return acc;
                }, {})
            )
            : weeklyData.filter((d) => d.player === selectedPlayer);

    // FILTERED DATA: SELECTED ATHLETES SESSIONS DATA
    const filteredSessions =
        selectedPlayer === "All Athletes"
            ? sessions
            : sessions.filter(session =>
                session.session_people?.some(
                    p => p.signin_details.role === "player" && `${p.signin_details.first_name} ${p.signin_details.last_name}` === selectedPlayer)
            );

    const filteredUpcomingSessions = filteredSessions.filter(session => {
        const sessionDate = new Date(session.start_datetime);

        return (
            sessionDate >= startOfSelectedWeek &&
            sessionDate <= endOfSelectedWeek
        );
    });

    // WEEKLY NAVIGATION: RESPONSE TO GRAPH DATA
    const weeklyGraphData = filteredData.filter(item => {
        const itemDate = new Date(item.week);
        return itemDate >= startOfSelectedWeek && itemDate <= endOfSelectedWeek;
    });

    // WEEKLY NAVIGATION: RESPONSE TO SESSIONS
    const weeklySessions = filteredSessions.filter(session => {
        const sessionDate = new Date(session.start_datetime);
        return sessionDate >= startOfSelectedWeek && sessionDate <= endOfSelectedWeek;
    });

    // CALCULATES TOTAL RPE, DEPENDING ON WEEKLY NAVIGATION
    const totalRPE = weeklySessions.reduce((total, session) => {
        const sessionLoad = session.session_feedback?.reduce(
            (sum, feedback) => sum + Number(feedback.rpe_load || 0), 0) || 0;
        return total + sessionLoad;
    }, 0);

    // CALCULATES EACH INTENSITY ZONE FOR INTENSITY CARD
    const intensitySummary = {
        easy: 0,
        medium: 0,
        hard: 0,
    };
    filteredSessions.forEach(session => {
        session.session_feedback?.forEach(feedback => {
            if (feedback.intensity_zone === "easy") {
                intensitySummary.easy++;
            } else if (feedback.intensity_zone === "medium") {
                intensitySummary.medium++;
            } else if (feedback.intensity_zone === "hard") {
                intensitySummary.hard++;
            }
        });
    });

    return (
        <div id="layout">
            {/* Loading overlay */}
            {isLoading && <LOADING_OVERLAY caption={"coach dashboard"} />}

            <div id="main-content-wrapper">
                <div id="main-content">
                    <div className="dashboardPage coachDashboardPage">

                        {/* HEADER */}
                        <div className="dashboardHeader">
                            <div>
                                <h2 className="content-header" style={{ padding: 0, marginBottom: '4px' }}>Coach Dashboard</h2>
                                <p style={{
                                    fontFamily: "'DM Sans Light', sans-serif",
                                    fontSize: '13px',
                                    color: 'var(--content-subhead-color)'
                                }}>
                                    Overview of RPE and Upcoming Sessions.
                                </p>
                            </div>

                            {/* PLAYER DROPDOWN SELECTER */}
                            <select
                                className="playerSelect"
                                value={selectedPlayer}
                                onChange={(e) => setSelectedPlayer(e.target.value)}
                            >
                                <option>All Athletes</option>

                                {Athletes.map(player => (
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
                                <span className="drill-stat-label">Week Total Sessions</span>
                                <span className="drill-stat-value accent">{filteredUpcomingSessions.length}</span>
                                <span className="drill-stat-sub">Sessions logged</span>
                            </div>

                            <div className="drill-stat-card">
                                <p className="drill-stat-label">ACTIVE Athletes</p>
                                <h2 className="drill-stat-value">{activeAthletes}</h2>
                                <span className="drill-stat-sub">Athletes with scheduled sessions</span>
                            </div>

                            <div className="drill-stat-card">
                                <p className="drill-stat-label">WEEKLY GROWTH</p>
                                <h2 className="drill-stat-value">+18%</h2>
                            </div>

                            <div className="drill-stat-card">
                                <p className="drill-stat-label">TOTAL RPE LOAD</p>
                                <h2 className="drill-stat-value">{totalRPE}</h2>
                                <span className="drill-stat-sub"> {selectedPlayer === "All Players" ? "Selected week" : selectedPlayer}</span>
                            </div>
                        </div>

                        {/* MAIN GRID */}
                        <div className="dashboardGrid">
                            {/* LEFT */}
                            <div className="leftColumn coachDashboardPage">

                                {/* RPE GRAPH */}
                                <div className="chartBox">
                                    <div className="sectionHeader">
                                        <p className="dashboardLabel"> SESSIONS RPE </p>
                                        <h3>Planned vs Actual Training Load</h3>
                                    </div>

                                    {/* WEEK NAVIGATION BUTTON */}
                                    <div className="weekControls">
                                        <button className="weekButton" onClick={() => setWeekOffset(weekOffset - 1)}> Previous Week </button>
                                        <button className={`weekButton ${weekOffset === 0 ? "active" : ""}`} onClick={() => setWeekOffset(0)}> This Week </button>
                                        <button className="weekButton" onClick={() => setWeekOffset(weekOffset + 1)}> Next Week </button>
                                    </div>

                                    {/* WEEK DATE LABEL */}
                                    <p className="dashboardLabel"> {startOfSelectedWeek.toLocaleDateString("en-AU")} - {endOfSelectedWeek.toLocaleDateString("en-AU")} </p>

                                    {/* LINE CHART */}
                                    <ResponsiveContainer width="100%" height={340}>
                                        <LineChart
                                            data={weeklyGraphData}
                                            margin={{ top: 10, right: 10, left: -20, bottom: 0, }}
                                        >
                                            <CartesianGrid
                                                strokeDasharray="3 3"
                                                vertical={false}
                                                stroke="#f3f4f6"
                                            />

                                            <XAxis
                                                dataKey="label"
                                                tick={({ x, y, payload }) => {
                                                    const [date, sessionName] = payload.value.split("\n");

                                                    return (
                                                        <g transform={`translate(${x},${y})`}>
                                                            <text x={0} y={0} dy={12} textAnchor="middle" fill="#6b7280" fontSize={12}> {date} </text>
                                                            <text x={0} y={16} dy={12} textAnchor="middle" fill="#9ca3af" fontSize={10}> {sessionName} </text>
                                                        </g>
                                                    );
                                                }}
                                                tickLine={false}
                                                axisLine={false}
                                            />

                                            <YAxis
                                                tick={{ fill: "#6b7280", fontSize: 12 }}
                                                tickLine={false}
                                                axisLine={false}
                                            />

                                            <Tooltip content={<CustomTooltip />} />

                                            <Legend />

                                            <Line
                                                type="monotone"
                                                dataKey="plannedLoad"
                                                stroke="#f59e0b"
                                                strokeWidth={3}
                                                dot={{ r: 4, strokeWidth: 2, fill: "#fff" }}
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
                            <div className="rightColumn coachDashboardPage">

                                <div className="chartBox">
                                    <div className="sectionHeader">
                                        <p className="dashboardLabel"> WEEKLY ACTIVITY </p>
                                        <h3>This Week</h3>
                                    </div>

                                    <div className="sessionList">
                                        {filteredUpcomingSessions.length > 0 ? (
                                            filteredUpcomingSessions.map((s) => (
                                                <div key={s.id} className="sessionItem"
                                                    onClick={() => navigate("/CoachCalendar", { state: { openSessionId: s.id } })}
                                                    style={{ cursor: "pointer" }}>
                                                    <div className="sessionMain">
                                                        <p className="sessionClient" >{s.name}</p>

                                                        <p className="sessionName upcoming">
                                                            {s.session_people
                                                                ?.filter(p => p.signin_details.role === "player")
                                                                .map(p => `${p.signin_details.first_name} ${p.signin_details.last_name}`)
                                                                .join(", ") || "No player"}
                                                        </p>
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
