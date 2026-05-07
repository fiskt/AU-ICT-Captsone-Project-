import { DRILL_TYPE_GRAPH, EXERTION_GRAPH, NUM_DRILLS_GRAPH } from "../Components/LoadTrackingComponents";

export default function PlayerProfile() {
    return (
        <>
            {/* Get info from database for things */}
            <section> {/*Profile picture, name and buttons*/}
                <div class="left">
                    <div class="users-name">Player's First+Last name</div>
                    <div class="user-type">Player</div>
                    <div class="profile-image">
                        <img src="" alt="" />
                    </div>
                </div>
                <div class="right">
                    <ul>
                        <li><btn class="profile-btn">Edit Profile Image</btn></li>
                        <li><btn class="profile-btn">Update Details</btn></li>
                        <li><btn class="profile-btn">Update Profile</btn></li>
                    </ul>
                </div>
            </section>

            <section> {/*Feedback and stats content boxes */}
                <div class="left">
                    <div class="content-box">
                        <h2 class="content-header">PAST FEEDBACK</h2>
                        {/* put list of feedbacks here with title and date as buttons that open window with feedback */}

                        <a><h2 class="content-seeAll">SEE ALL</h2></a>
                        {/* button to display all past feedback in a list, on new page? window? with same functionality */}
                    </div>
                </div>
                <div class="right">
                    <div class="content-box">
                        <h2 class="content-header">STATS</h2>

                        <ul class="content-list">
                            <li>Coach: Coach Name</li> {/*Insert name of coach from datbase there */}
                            <li>Dominant Hand: Left/Right</li>
                            <li>Strengths: </li>
                            <li>Improvement Points: </li>

                        </ul>
                    </div>
                </div>

            </section>

            <section>{/* Injuries and graphs? */}
                <div class="left">
                    <div class="content-box">
                        <h2 class="content-header">INJURIES</h2>
                        {/* list of any relevant medical records here */}
                    </div>
                </div>
            </section>
  

            <section>
                <div class="left">
                    <div class="content-box">
                        <h2 class="content-header">Rate of Exertion</h2>
                        <EXERTION_GRAPH />
                    </div>
                </div>
                <div class="right">
                    <div class="content-box">
                        <h2 class="content-header">Drills</h2>
                        <NUM_DRILLS_GRAPH />
                        <DRILL_TYPE_GRAPH />
                    </div>
                </div>
            </section>
        </>
    );
}

