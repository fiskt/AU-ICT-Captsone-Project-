import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { LOADING_OVERLAY } from '../Components/SharedComponents';
import { DateTime, Duration } from 'luxon';

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
    const [nextSessionData, setNextSessionData] = useState(null);

    // LOADING STATE
    const [isLoading, setIsLoading] = useState(true);

    // WEEK OFFSET STATE
    const [weekOffset, setWeekOffset] = useState(0);

    // WEEKLY TARGET RPE STATE
    const [weeklyTargetRPE, setWeeklyTargetRPE] = useState("");
    const [targetInput, setTargetInput] = useState("");

    // INJURY STATE
    const [activeInjuryCount, setActiveInjuryCount] = useState(0);

    // WEEKLY NAVIGATION
    const today = new Date();

    const startOfSelectedWeek = new Date(today);
    startOfSelectedWeek.setDate(today.getDate() - today.getDay() + weekOffset * 7);
    startOfSelectedWeek.setHours(0, 0, 0, 0);

    const endOfSelectedWeek = new Date(startOfSelectedWeek);
    endOfSelectedWeek.setDate(startOfSelectedWeek.getDate() + 6);
    endOfSelectedWeek.setHours(23, 59, 59, 999);

    // HELPER CLASS FOR DATE AND TIME USING LUXON
    function formatDateForDB(dateValue) {
        return DateTime.fromISO(dateValue).toFormat("yyyy-MM-dd");
    }
    function formatJSDateForDB(dateValue) {
        return DateTime.fromJSDate(dateValue).toFormat("yyyy-MM-dd");
    }

    // FETCH TARGET FOR SELECTED WEEK/ATHELE
    async function fetchWeeklyTarget() {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            alert("No user logged in");
            return;
        }

        if (selectedPlayer === "All Athletes") {
            setWeeklyTargetRPE("");
            setTargetInput("");
            return;
        }

        const selectedAthlete = Athletes.find(
            athlete => `${athlete.first_name} ${athlete.last_name}` === selectedPlayer
        );

        if (!selectedAthlete) return;

        const { data, error } = await supabase
            .from("weekly_target_rpe")
            .select("*")
            .eq("coach_id", user.id)
            .eq("player_id", selectedAthlete.id)
            .eq("week_start", formatJSDateForDB(startOfSelectedWeek))
            .maybeSingle();

        if (error) {
            console.log(error);
            alert(`Failed to save target: ${error.message}`);
            setWeeklyTargetRPE("");
            setTargetInput("");
            return;
        } else if (data) {
            setWeeklyTargetRPE(data.target_rpe);
            setTargetInput(data.target_rpe);
        } else {
            setWeeklyTargetRPE("");
            setTargetInput("");
        }
    }

    useEffect(() => {
        fetchWeeklyTarget();
    }, [selectedPlayer, weekOffset, Athletes]);

    // FETCH SESSIONS DATA, INCL RPE VALUES
    async function fetchSessions() {
        setIsLoading(true);

        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            console.log("No user logged in");
            setIsLoading(false);
            return;
        }

        // GET SESSION ASSIGNED TO LOGGED IN COACH
        const { data: assignedRows, error: assignedError } = await supabase
            .from("session_people")
            .select("session_id")
            .eq("user_id", user.id);

        if (assignedError) {
            console.log("Error fetching assigned sessions:", assignedError.message);
            setIsLoading(false);
            return;
        }

        const sessionIds = assignedRows.map(row => row.session_id);

        if (sessionIds.length === 0) {
            setSessions([]);
            setWeeklyData([]);
            setIsLoading(false);
            return;
        }

        // FETCH FULL SESSION DETAILS
        const { data, error } = await supabase
            .from("sessions")
            .select(`
            *,
            session_people(
                user_id,
                signin_details(id, first_name, last_name, role)
            ),
            session_feedback(
                session_id,
                player_id,
                intensity,
                rpe_load,
                intensity_zone
            )
        `)
            .in("id", sessionIds)
            .order("start_datetime", { ascending: true });

        if (error) {
            console.log("Error fetching sessions:", error.message);
            setIsLoading(false);
            return;
        }

        setSessions(data || []);

        const now = new Date();
        setNextSessionData(data.find(s => new Date(s.end_datetime) >= now) || null);

        // DATA TO USE IN RPE GRAPH
        const graphRows = [];

        (data || []).forEach(session => {
            const week = formatDateForDB(session.start_datetime);

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

    // FETCH INJURY STATE
    async function fetchInjuryStatus() {
        if (selectedPlayer === "All Athletes") {
            setActiveInjuryCount(0);
            return;
        }

        const selectedAthlete = Athletes.find(
            athlete => `${athlete.first_name} ${athlete.last_name}` === selectedPlayer
        );

        if (!selectedAthlete) return;

        const { data, error } = await supabase
            .from("injuries")
            .select("id")
            .eq("player_id", selectedAthlete.id)
            .eq("status", "active");

        if (error) {
            console.log("Error fetching injuries:", error.message);
            setActiveInjuryCount(0);
        } else {
            setActiveInjuryCount(data?.length || 0);
        }
    }
    useEffect(() => {
        fetchInjuryStatus();
    }, [selectedPlayer, Athletes]);

    // SAVE WEEKLY TARGET RPE
    async function saveWeeklyTarget() {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            console.log("No user logged in");
            setIsLoading(false);
            return;
        }

        const selectedAthlete = Athletes.find(
            athlete => `${athlete.first_name} ${athlete.last_name}` === selectedPlayer
        );

        if (!selectedAthlete) {
            alert("Please select an athlete first.");
            return;
        }

        const { error } = await supabase
            .from("weekly_target_rpe")
            .upsert({
                coach_id: user.id,
                player_id: selectedAthlete.id,
                week_start: formatJSDateForDB(startOfSelectedWeek),
                target_rpe: Number(targetInput),
                updated_at: new Date().toISOString(),
            }, {
                onConflict: "coach_id,player_id,week_start"
            });

        if (error) {
            alert("Failed to save target: " + error.message);
        } else {
            setWeeklyTargetRPE(Number(targetInput));
            alert("Weekly target saved!");
        }
    }

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

    // To filter out completed and uncomplete session in filteredUpcomingSessions.
    const sortedWeeklySessions = [...filteredUpcomingSessions].sort((a, b) => {
        const aCompleted = new Date(a.end_datetime) < new Date();
        const bCompleted = new Date(b.end_datetime) < new Date();

        if (aCompleted !== bCompleted) {
            return aCompleted ? 1 : -1;
        }

        return new Date(a.start_datetime) - new Date(b.start_datetime);
    });

    // Selecting ONE upcoming session
    const selectedWeekNextSession = sortedWeeklySessions.find(session =>
        new Date(session.end_datetime) >= new Date()
    );

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

    // CALCULATES TOTAL TARGET RPE, DEPENDING ON WEEKLY NAVIGATION
    const weeklyTotalTargetRPE = weeklySessions.reduce((total, session) => {
        return total + Number(session.rpe || 0);
    }, 0);

    // CALCULATES EACH INTENSITY ZONE FOR INTENSITY CARD
    const intensitySummary = {
        easy: 0,
        medium: 0,
        hard: 0,
    };
    weeklySessions.forEach(session => {
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

                            <div className="dashboardControls">
                                {/* INJURY STATUS*/}
                                {selectedPlayer !== "All Athletes" && (
                                    <button
                                        className={`injuryBadge ${activeInjuryCount > 0 ? "injured" : "healthy"}`}
                                        onClick={() => {
                                            const selectedAthlete = Athletes.find(
                                                athlete => `${athlete.first_name} ${athlete.last_name}` === selectedPlayer);
                                            if (!selectedAthlete) return;
                                            navigate("/PlayerProfile", {
                                                state: { playerId: selectedAthlete.id, openSection: "injuries", },
                                            });
                                        }}>

                                        {activeInjuryCount > 0
                                            ? `${activeInjuryCount} Active ${activeInjuryCount === 1 ? "Injury" : "Injuries"}`
                                            : "No Injuries"}
                                    </button>
                                )}

                                {/* PLAYER DROPDOWN SELECTER */}
                                <select
                                    className="playerSelect"
                                    value={selectedPlayer}
                                    onChange={(e) => setSelectedPlayer(e.target.value)}>
                                    <option>All Athletes</option>

                                    {Athletes.map(player => (
                                        <option
                                            key={player.id}
                                            value={`${player.first_name} ${player.last_name}`}>
                                            {player.first_name} {player.last_name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* STATS */}
                        <div id="drill-stats-row">

                            <div className="drill-stat-card">
                                <span className="drill-stat-label">Week Total Sessions</span>
                                <span className="drill-stat-value accent">{filteredUpcomingSessions.length}</span>
                                <span className="drill-stat-sub">Sessions scheduled</span>
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

                            <div className="drill-stat-card">
                                <p className="drill-stat-label">LOAD VS TARGET</p>
                                <h2 className="drill-stat-value">{weeklyTotalTargetRPE} / {weeklyTargetRPE || "—"}</h2>
                                {selectedPlayer !== "All Athletes" && (
                                    <div className="targetInputBox">
                                        <input
                                            className="drill-form-input"
                                            type="number"
                                            value={targetInput}
                                            onChange={(e) => setTargetInput(e.target.value)}
                                            placeholder="Target RPE"
                                        />
                                        <button className="weekButton active" onClick={saveWeeklyTarget}>
                                            Save
                                        </button>
                                    </div>
                                )}
                                <span className="drill-stat-sub">
                                    {selectedPlayer === "All Athletes" && (
                                        <span className="drill-stat-sub">
                                            Select an Athlete to set target
                                        </span>
                                    )}
                                </span>
                            </div>

                            <div className="drill-stat-card"
                                onClick={() =>
                                    navigate("/PlayerFeedbackSummary", {
                                        state: {
                                            zone: "",
                                            player: selectedPlayer
                                        }
                                    })
                                }
                                style={{ cursor: "pointer" }}>
                                <p className="drill-stat-label">WEEKLY ACTUAL LOAD</p>
                                <h2 className="drill-stat-value">{totalRPE}</h2>
                                <span className="drill-stat-sub"> {selectedPlayer === "All Athletes" ? "Selected week" : selectedPlayer}</span>
                            </div>
                        </div>

                        {/* MAIN GRID */}
                        <div className="dashboardGrid">
                            {/* LEFT */}
                            <div className="leftColumn coachDashboardPage">
                                <div className="chartBox">
                                    <div className="sectionHeader">
                                        <p className="dashboardLabel"> THIS WEEK </p>
                                        <h3>UPCOMING SESSION</h3>
                                    </div>
                                    {selectedWeekNextSession ? (
                                        <div key={selectedWeekNextSession.id} className="sessionDetailCard"
                                            onClick={() => navigate("/CoachCalendar", { state: { openSessionId: selectedWeekNextSession.id } })}
                                            style={{ cursor: "pointer" }}>
                                            <div className="sessionTime">
                                                <span className="timeMain" >{new Date(selectedWeekNextSession.start_datetime).toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit" })}</span>
                                            </div>

                                            <div className="sessionContent">
                                                <h3>{selectedWeekNextSession?.name || "No upcoming session"}</h3>
                                                <p className="sessionName upcoming">
                                                    {selectedWeekNextSession.session_people
                                                        ?.filter(p => p.signin_details.role === "player")
                                                        .map(p => `${p.signin_details.first_name} ${p.signin_details.last_name}`)
                                                        .join(", ") || "No Altlete"}
                                                </p>
                                                <p>{new Date(selectedWeekNextSession.start_datetime).toLocaleDateString("en-AU", { weekday: "short", day: "numeric", month: "short" })}</p>
                                                <p>Duration: {selectedWeekNextSession.duration}</p>
                                                <p className="sessionNotes">Notes: {selectedWeekNextSession.notes || "No notes"}</p>
                                            </div>
                                        </div>
                                    ) : (<p className="dashboardLabel">No upcoming session.</p>)
                                    }
                                </div>

                                {/* RPE GRAPH */}
                                <div className="chartBox">
                                    <div className="sectionHeader">
                                        <p className="dashboardLabel"> SESSIONS RPE </p>
                                        <h3>Planned vs Actual Training Load</h3>
                                    </div>

                                    {/* LINE CHART */}
                                    <ResponsiveContainer width="100%" height={320}>
                                        <LineChart
                                            data={weeklyGraphData}
                                            margin={{ top: 10, right: 10, left: -20, bottom: 10, }}
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
                                                            <text x={0} y={0} dy={12} textAnchor="middle" fill="#6b7280" fontSize={12} fontFamily="'DM Mono Light', sans-serif"> {date} </text>
                                                            <text x={0} y={10} dy={12} textAnchor="middle" fill="#9ca3af" fontSize={10} fontFamily="'DM Mono Light', sans-serif"> {sessionName} </text>
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

                                            <Legend
                                                verticalAlign="bottom"
                                                align="center"
                                                wrapperStyle={{
                                                    fontFamily: "'DM Sans Light', sans-serif",
                                                    fontSize: "15px",
                                                    paddingTop: "10px",
                                                }}
                                            />

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
                                                dot={{ r: 5, strokeWidth: 2, fill: "#fff" }}
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

                                    {/* WEEK NAVIGATION BUTTON */}
                                    <div className="weekControls">
                                        <button className="weekButton" onClick={() => setWeekOffset(weekOffset - 1)}> Previous Week </button>
                                        <button className={`weekButton ${weekOffset === 0 ? "active" : ""}`} onClick={() => setWeekOffset(0)}> This Week </button>
                                        <button className="weekButton" onClick={() => setWeekOffset(weekOffset + 1)}> Next Week </button>
                                    </div>

                                    {/* WEEK DATE LABEL */}
                                    <p className="dashboardLabel"> {startOfSelectedWeek.toLocaleDateString("en-AU")} - {endOfSelectedWeek.toLocaleDateString("en-AU")} </p>

                                    {/* WEEK SESSIONS DISPLAY */}
                                    <div className="sessionList">
                                        {sortedWeeklySessions.length > 0 ? (
                                            sortedWeeklySessions.map((s) => {
                                                const isCompleted = new Date(s.end_datetime) < new Date();

                                                return (
                                                    <div key={s.id} className="sessionItem"
                                                        onClick={() => navigate("/CoachCalendar", { state: { openSessionId: s.id } })}
                                                        style={{ cursor: "pointer" }}>
                                                        <div className="sessionMain">
                                                            <p className="sessionClient" >{s.name}</p>

                                                            <p className={`sessionName ${isCompleted ? "completed" : "upcoming"}`}>
                                                                {s.session_people
                                                                    ?.filter(p => p.signin_details.role === "player")
                                                                    .map(p => `${p.signin_details.first_name} ${p.signin_details.last_name}`)
                                                                    .join(", ") || "No Athlete"}
                                                            </p>
                                                            <p className="sessionName" >Target RPE: {s.rpe} </p>
                                                        </div>

                                                        <div className="sessionInfo">
                                                            <span>{new Date(s.start_datetime).toLocaleDateString("en-AU", { weekday: "short", day: "numeric", month: "short" })}</span>
                                                            <span>{new Date(s.start_datetime).toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit" })}</span>
                                                            <span>{s.duration}</span>
                                                        </div>
                                                    </div>

                                                );
                                            })
                                        ) : (
                                            <p className="dashboardLabel">No upcoming session.</p>
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
