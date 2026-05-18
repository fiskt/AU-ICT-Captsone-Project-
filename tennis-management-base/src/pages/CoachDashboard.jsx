import { useState } from "react";
import { useNavigate } from "react-router-dom";
import '../App.css';
import './Dashboard.css';
import { COACH_SIDEBAR, TOPBAR } from '../Components/SharedComponents';

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

const weeklyData = [
    {
        week: "2026-03-30",
        player: "Alex Johnson",
        plannedLoad: 420,
        actualLoad: 460,
    },
    {
        week: "2026-03-30",
        player: "Maria Garcia",
        plannedLoad: 380,
        actualLoad: 350,
    },
    {
        week: "2026-04-06",
        player: "Alex Johnson",
        plannedLoad: 520,
        actualLoad: 610,
    },
    {
        week: "2026-04-06",
        player: "Maria Garcia",
        plannedLoad: 450,
        actualLoad: 400,
    },
    {
        week: "2026-04-13",
        player: "Alex Johnson",
        plannedLoad: 600,
        actualLoad: 640,
    },
    {
        week: "2026-04-13",
        player: "Maria Garcia",
        plannedLoad: 300,
        actualLoad: 250,
    },
    {
        week: "2026-04-20",
        player: "Alex Johnson",
        plannedLoad: 200,
        actualLoad: 180,
    },
    {
        week: "2026-04-20",
        player: "Maria Garcia",
        plannedLoad: 200,
        actualLoad: 180,
    },
];
const weeklyIntensityData = [
    { week: "Week 1", player: "Alex Johnson", easy: 1, medium: 2, hard: 1 },
    { week: "Week 1", player: "Maria Garcia", easy: 2, medium: 1, hard: 0 },

    { week: "Week 2", player: "Alex Johnson", easy: 0, medium: 1, hard: 3 },
    { week: "Week 2", player: "Maria Garcia", easy: 1, medium: 2, hard: 1 },

    { week: "Week 3", player: "Alex Johnson", easy: 2, medium: 1, hard: 1 },
    { week: "Week 3", player: "Maria Garcia", easy: 1, medium: 3, hard: 0 },

    { week: "Week 4", player: "Alex Johnson", easy: 1, medium: 1, hard: 2 },
    { week: "Week 4", player: "Maria Garcia", easy: 0, medium: 2, hard: 2 },
];

const upcomingSessions = [
    {
        date: "2026-05-05",
        time: "09:00",
        duration: "60 min",
        client: "Alex Johnson",
        session: "Tennis Drills - Forehand",
    },
    {
        date: "2026-05-06",
        time: "15:00",
        duration: "45 min",
        client: "Maria Garcia",
        session: "Strength Training",
    },
    {
        date: "2026-05-07",
        time: "10:30",
        duration: "60 min",
        client: "Alex Johnson",
        session: "Serve & Volley Practice",
    },
    {
        date: "2026-05-08",
        time: "13:00",
        duration: "90 min",
        client: "Maria Garcia",
        session: "Match Simulation",
    },
];


export default function Dashboard() {
    // NAVIGATE TO OTHER PAGES
    const navigate = useNavigate();

    // DEFAULT STATE
    const [selectedPlayer, setSelectedPlayer] = useState("All Players");

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

    const filteredIntensityData =
        selectedPlayer === "All Players"
            ? Object.values(
                weeklyIntensityData.reduce((acc, item) => {
                    if (!acc[item.week]) {
                        acc[item.week] = {
                            week: item.week,
                            easy: 0,
                            medium: 0,
                            hard: 0,
                        };
                    }

                    acc[item.week].easy += item.easy;
                    acc[item.week].medium += item.medium;
                    acc[item.week].hard += item.hard;

                    return acc;
                }, {})
            )
            : weeklyIntensityData.filter(
                (item) => item.player === selectedPlayer
            );
    const intensitySummary = {
        easy: filteredIntensityData.reduce((sum, item) => sum + item.easy, 0),
        medium: filteredIntensityData.reduce((sum, item) => sum + item.medium, 0),
        hard: filteredIntensityData.reduce((sum, item) => sum + item.hard, 0),
    };

    return (
        <div id="layout">
            <COACH_SIDEBAR />
            <TOPBAR />

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
                                <option>Alex Johnson</option>
                                <option>Maria Garcia</option>
                            </select>
                        </div>

                        {/* STATS */}
                        <div id="drill-stats-row">

                            <div className="drill-stat-card">
                                <span className="drill-stat-label">Total Sessions</span>
                                <span className="drill-stat-value accent">124</span>
                                <span className="drill-stat-sub">Sessions logged</span>
                            </div>

                            <div className="drill-stat-card">
                                <p className="drill-stat-label">ACTIVE CLIENTS</p>
                                <h2 className="drill-stat-value">12</h2>
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
                                                }>
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
                                                }>
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
                                                }>
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
                                        {upcomingSessions.map((s, index) => (
                                            <div key={index} className="sessionItem">

                                                <div className="sessionMain">
                                                    <p className="sessionClient">
                                                        {s.client}
                                                    </p>

                                                    <p className="sessionName">
                                                        {s.session}
                                                    </p>
                                                </div>

                                                <div className="sessionInfo">
                                                    <span>{s.date}</span>
                                                    <span>{s.time}</span>
                                                    <span>{s.duration}</span>
                                                </div>

                                            </div>
                                        ))}
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
