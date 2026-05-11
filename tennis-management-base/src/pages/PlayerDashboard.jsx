import { useState } from "react";
import '../App.css';
import "../App.css";
import "./CoachDashboard.css";
import { PLAYER_SIDEBAR, TOPBAR } from "../Components/SharedComponents";

const nextSession = {
    date: "2026-05-12",
    time: "10:30",
    duration: "60 min",
    coach: "Coach Daniel",
    session: "Serve Accuracy Training",
    location: "Court 2",
};

const weeklyActivities = [
    {
        date: "Mon, 12 May",
        time: "10:30",
        session: "Serve Accuracy Training",
        status: "Upcoming",
    },
    {
        date: "Wed, 14 May",
        time: "15:00",
        session: "Footwork & Agility",
        status: "Upcoming",
    },
    {
        date: "Fri, 16 May",
        time: "09:00",
        session: "Match Simulation",
        status: "Upcoming",
    },
];

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
    {
        type: "Session Added",
        message: "Coach Daniel added Serve Accuracy Training for 12 May.",
        time: "Today, 9:15 AM",
    },
    {
        type: "Time Moved",
        message: "Footwork session moved from 2:00 PM to 3:00 PM.",
        time: "Yesterday, 4:40 PM",
    },
    {
        type: "Session Rated",
        message: "Coach rated your last Match Simulation session: 8/10.",
        time: "2 days ago",
    },
];

export default function PlayerDashboard() {
    const [feedback, setFeedback] = useState({
        energy: "",
        difficulty: "",
        comment: "",
    });

    return (
        <div id="layout">
            <PLAYER_SIDEBAR />
            <TOPBAR />

            <div id="main-content-wrapper">
                <div id="main-content">
                    <div className="dashboardPage">

                        {/* HEADER */}
                        <div className="dashboardHeader">
                            <div>
                                <p className="dashboardLabel">PLAYER OVERVIEW</p>
                                <h1 className="dashboardTitle">Player Dashboard</h1>
                            </div>
                        </div>

                        {/* TOP STATS */}
                        <div className="statsGrid">
                            <div className="statCard">
                                <p className="cardLabel">THIS WEEK</p>
                                <h2 className="cardValue">3</h2>
                            </div>

                            <div className="statCard">
                                <p className="cardLabel">NEXT SESSION</p>
                                <h2 className="cardValue">10:30</h2>
                            </div>

                            <div className="statCard">
                                <p className="cardLabel">LAST RATING</p>
                                <h2 className="cardValue">8/10</h2>
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

                                {/* NEXT SESSION */}
                                <div className="chartBox">
                                    <div className="sectionHeader">
                                        <p className="dashboardLabel">NEXT SESSION</p>
                                        <h3>{nextSession.session}</h3>
                                    </div>

                                    <div className="playerSessionHighlight">
                                        <p><strong>Date:</strong> {nextSession.date}</p>
                                        <p><strong>Time:</strong> {nextSession.time}</p>
                                        <p><strong>Duration:</strong> {nextSession.duration}</p>
                                        <p><strong>Coach:</strong> {nextSession.coach}</p>
                                        <p><strong>Location:</strong> {nextSession.location}</p>
                                    </div>
                                </div>

                                {/* THIS WEEK ACTIVITY */}
                                <div className="chartBox">
                                    <div className="sectionHeader">
                                        <p className="dashboardLabel">THIS WEEK</p>
                                        <h3>Weekly Activity</h3>
                                    </div>

                                    <div className="sessionList">
                                        {weeklyActivities.map((activity, index) => (
                                            <div className="sessionItem" key={index}>
                                                <div className="sessionMain">
                                                    <p className="sessionClient">{activity.session}</p>
                                                    <p className="sessionName">{activity.status}</p>
                                                </div>

                                                <div className="sessionInfo">
                                                    <span>{activity.date}</span>
                                                    <span>{activity.time}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* FEEDBACK FORM */}
                                <div className="chartBox">
                                    <div className="sectionHeader">
                                        <p className="dashboardLabel">PLAYER FEEDBACK</p>
                                        <h3>Activity Feedback Form</h3>
                                    </div>

                                    <div className="feedbackForm">
                                        <label>Energy Level</label>
                                        <select
                                            value={feedback.energy}
                                            onChange={(e) =>
                                                setFeedback({ ...feedback, energy: e.target.value })
                                            }
                                        >
                                            <option value="">Select energy level</option>
                                            <option>Low</option>
                                            <option>Medium</option>
                                            <option>High</option>
                                        </select>

                                        <label>Session Difficulty</label>
                                        <select
                                            value={feedback.difficulty}
                                            onChange={(e) =>
                                                setFeedback({ ...feedback, difficulty: e.target.value })
                                            }
                                        >
                                            <option value="">Select difficulty</option>
                                            <option>Easy</option>
                                            <option>Moderate</option>
                                            <option>Hard</option>
                                        </select>

                                        <label>Comment</label>
                                        <textarea
                                            placeholder="How did you feel during the session?"
                                            value={feedback.comment}
                                            onChange={(e) =>
                                                setFeedback({ ...feedback, comment: e.target.value })
                                            }
                                        />

                                        <button className="dashboardBtn">
                                            Submit Feedback
                                        </button>
                                    </div>
                                </div>

                            </div>

                            {/* RIGHT COLUMN */}
                            <div className="rightColumn">

                                {/* STRENGTH */}
                                <div className="chartBox">
                                    <div className="sectionHeader">
                                        <p className="dashboardLabel">PERFORMANCE</p>
                                        <h3>Current Strengths</h3>
                                    </div>

                                    <div className="tagList">
                                        {strengths.map((item, index) => (
                                            <span className="positiveTag" key={index}>
                                                {item}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                {/* WEAKNESS */}
                                <div className="chartBox">
                                    <div className="sectionHeader">
                                        <p className="dashboardLabel">FOCUS AREA</p>
                                        <h3>Current Weaknesses</h3>
                                    </div>

                                    <div className="tagList">
                                        {weaknesses.map((item, index) => (
                                            <span className="warningTag" key={index}>
                                                {item}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                {/* UPDATE BOARD */}
                                <div className="chartBox">
                                    <div className="sectionHeader">
                                        <p className="dashboardLabel">LATEST ACTIVITY</p>
                                        <h3>Coach Update Board</h3>
                                    </div>

                                    <div className="updateBoard">
                                        {coachUpdates.map((update, index) => (
                                            <div className="updateItem" key={index}>
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
                </div>
            </div>
        </div>
    );
}