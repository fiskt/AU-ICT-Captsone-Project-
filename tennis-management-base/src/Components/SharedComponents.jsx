import './SharedComponents.css';

export function COACH_SIDEBAR() {
    return (
        <div id="sidebar">
            <div id="sidebar-logo"></div>
            <div id="sidebar-nav">
                <div id="sidebar-dashboard" class="sidebar-nav-btn txt-btn">
                    <span class="sidebar-nav-btn-txt">Dashboard</span>
                </div>
                <div id="sidebar-calendar" class="sidebar-nav-btn txt-btn">
                    <span class="sidebar-nav-btn-txt">Calendar</span>
                </div>
                <div id="sidebar-players" class="sidebar-nav-btn txt-btn">
                    <span class="sidebar-nav-btn-txt">Players</span>
                </div>
                <div id="sidebar-drill-library" class="sidebar-nav-btn txt-btn">
                    <span class="sidebar-nav-btn-txt">Drill Library</span>
                </div>
                <div id="sidebar-load-tracking" class="sidebar-nav-btn txt-btn">
                    <span class="sidebar-nav-btn-txt">Load Tracking</span>
                </div>
                <div id="sidebar-testing" class="sidebar-nav-btn txt-btn">
                    <span class="sidebar-nav-btn-txt">Testing</span>
                </div>
            </div>
            <div id="sidebar-bottom"></div>
        </div>
    );
}

export function PLAYER_SIDEBAR() {
    return (
        <div id="sidebar">
            <div id="sidebar-logo"></div>
            <div id="sidebar-nav">
                <div id="sidebar-dashboard"></div>
                <div id="sidebar-calendar"></div>
                <div id="sidebar-load-tracking"></div>
                <div id="sidebar-testing"></div>
            </div>
            <div id="sidebar-bottom"></div>
        </div>
    );
}

export function TOPBAR() {
    return (
        <div id="topbar">
        </div>
    );
}

export function MAIN_CONTENT() {
    return (
        <div id="main-content"></div>
    )
}