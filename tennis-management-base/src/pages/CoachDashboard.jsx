import { useState } from "react";
import '../App.css';
import './CoachDashboard.css';
import { COACH_SIDEBAR, TOPBAR} from '../Components/SharedComponents';

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
        plannedRPE: 6.2,
        actualRPE: 6.5,
        discrepancy: 0.3,
    },
    {
        week: "2026-03-30",
        player: "Maria Garcia",
        plannedRPE: 6.2,
        actualRPE: 4.0,
        discrepancy: -0.2,
    },
    {
        week: "2026-04-06",
        player: "Alex Johnson",
        plannedRPE: 7.5,
        actualRPE: 7.8,
        discrepancy: 0.3,
    },
    {
        week: "2026-04-06",
        player: "Maria Garcia",
        plannedRPE: 7.5,
        actualRPE: 5.5,
        discrepancy: 0.0,
    },
    {
        week: "2026-04-13",
        player: "Alex Johnson",
        plannedRPE: 5.0,
        actualRPE: 4.8,
        discrepancy: -0.2,
    },
    {
        week: "2026-04-13",
        player: "Maria Garcia",
        plannedRPE: 5.0,
        actualRPE: 3.2,
        discrepancy: 0.2,
    },
    {
        week: "2026-04-20",
        player: "Alex Johnson",
        plannedRPE: 8.2,
        actualRPE: 8.5,
        discrepancy: 0.3,
    },
    {
        week: "2026-04-20",
        player: "Maria Garcia",
        plannedRPE: 8.2,
        actualRPE: 3.8,
        discrepancy: 0.6,
    },
];
const sessionData = [
    {
        week: "2026-04-01",
        easy: 0,
        medium: 1,
        hard: 1,
    },
    {
        week: "2026-04-03",
        easy: 0,
        medium: 1,
        hard: 1,
    },
    {
        week: "2026-04-05",
        easy: 0,
        medium: 0,
        hard: 2,
    },
    {
        week: "2026-04-07",
        easy: 0,
        medium: 2,
        hard: 0,
    },
    {
        week: "2026-04-09",
        easy: 0,
        medium: 0,
        hard: 2,
    },
    {
        week: "2026-04-11",
        easy: 2,
        medium: 0,
        hard: 0,
    },
    {
        week: "2026-04-13",
        easy: 0,
        medium: 1,
        hard: 1,
    },
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

    // STATE
    const [selectedPlayer, setSelectedPlayer] = useState("Alex Johnson");

    // FILTERED DATA
    const filteredData = weeklyData.filter(
        (d) => d.player === selectedPlayer
    );

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
                                <option>Alex Johnson</option>
                                <option>Maria Garcia</option>
                            </select>
                        </div>

                        {/* STATS */}
                        <div className="statsGrid">

                            <div className="statCard">
                                <p className="cardLabel">TOTAL SESSIONS</p>
                                <h2 className="cardValue">124</h2>
                            </div>

                            <div className="statCard">
                                <p className="cardLabel">ACTIVE CLIENTS</p>
                                <h2 className="cardValue">12</h2>
                            </div>

                            <div className="statCard">
                                <p className="cardLabel">WEEKLY GROWTH</p>
                                <h2 className="cardValue">+18%</h2>
                            </div>

                            <div className="statCard">
                                <p className="cardLabel">AVG RPE</p>
                                <h2 className="cardValue">7.2</h2>
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

                                    <ResponsiveContainer width="100%" height={320}>
                                        <LineChart data={filteredData}>
                                            <CartesianGrid strokeDasharray="3 3" />

                                            <XAxis dataKey="week" />
                                            <YAxis domain={[0, 10]} />

                                            <Tooltip />

                                            <Legend />

                                            <Line
                                                type="monotone"
                                                dataKey="plannedRPE"
                                                stroke="#f97316"
                                                strokeWidth={3}
                                                name="Planned RPE"
                                            />

                                            <Line
                                                type="monotone"
                                                dataKey="actualRPE"
                                                stroke="#111827"
                                                strokeWidth={3}
                                                name="Actual RPE"
                                            />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>

                                {/* INTENSITY GRAPH */}
                                <div className="chartBox">
                                    <div className="sectionHeader">
                                        <p className="dashboardLabel">
                                            TRAINING INTENSITY
                                        </p>

                                        <h3>RPE Intensity Zones</h3>
                                    </div>

                                    <ResponsiveContainer width="100%" height={300}>
                                        <BarChart data={sessionData}>
                                            <CartesianGrid strokeDasharray="3 3" />

                                            <XAxis dataKey="week" />
                                            <YAxis />

                                            <Tooltip />
                                            <Legend />

                                            <Bar dataKey="easy" stackId="a" fill="#22c55e" />
                                            <Bar dataKey="medium" stackId="a" fill="#facc15" />
                                            <Bar dataKey="hard" stackId="a" fill="#ef4444" />
                                        </BarChart>
                                    </ResponsiveContainer>
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
