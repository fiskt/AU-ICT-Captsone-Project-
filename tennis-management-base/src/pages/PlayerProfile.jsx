import { DRILL_TYPE_GRAPH, EXERTION_GRAPH, NUM_DRILLS_GRAPH } from "../Components/LoadTrackingComponents";
import { supabase } from '../supabaseClient';
import { LOADING_OVERLAY } from '../Components/SharedComponents';
import { useState } from "react";
import '../App.css';
import './PlayerProfile.css';

export default function PlayerProfile() {
    // where the functions go


    async function fetchCoaches() {
        const { data, error } = await supabase
            .from('signin_details')
            .select('*')
            .eq('role', 'coach');

        if (error) {
            console.log("Error when fetching coaches: ", error.message);
            setCoaches([]);
        } else {
            setCoaches(data);
            console.log("coaches", coaches);
        }
    }


    return (
        <>
            <section class="playerProfilePage">
                {/* Get info from database for things */}
                <div class="playerNameSection"> {/*Profile picture, name and buttons*/}
                    <div class="profile-image">
                        <img src="/src/assets/userPPDemo.png" alt="RF" /> {/* Players initials as alt + get details from DB*/}
                    </div>
                    <div class="left">

                        <div class="users-name">
                            <h3>Mihir Patel</h3> {/*get user's name and insert here */}
                        </div>
                        <div class="user-type">Player</div>

                    </div>
                    <div class="right">
                        <ul class="listOfButtons">
                            {/* <li><btn class="profile-btn">Edit Profile Image</btn></li> */}
                            <li><btn class="profile-btn">Update Details</btn></li>
                        </ul>
                    </div>
                </div>



                <div class="feedbackAndStats"> {/*Feedback and stats content boxes */}

                    <div class="content-box">
                        <h2 class="content-header">PAST FEEDBACK</h2>
                        {/* put list of feedbacks here with title and date as buttons that open window with feedback */}

                    
                        {/*scroll feature to see all instead of button*/}
                    </div>


                    <div class="content-box">
                        <h2 class="content-header">STATS</h2>

                        <ul class="content-list">
                            <li>Coach: Kent Green</li> {/*Insert name of coach from datbase there */}
                            <li>Dominant Hand: Right</li>
                            <li>Strengths: Forehand</li>
                            <li>Improvement Points: Backhand</li>

                        </ul>
                    </div>


                </div>

                <div class="injuriesAndGraphs">{/* Injuries and graphs? */}
                    <div class="content-box">
                        <h2 class="content-header">INJURIES</h2>
                        {/* list of any relevant medical records here */}
                       
                    </div>

                     <div class="content-box">
                        <h2 class="content-header">Homework Drills</h2>
                        {/* input homework here */}
                        
                    </div>
                </div>


                <div class="graphs">

                    <div class="content-box">
                        <h2 class="content-header">Rate of Exertion</h2>
                        <div class="graph">
                            <EXERTION_GRAPH />
                        </div>
                    </div>


                    <div class="content-box">
                        <h2 class="content-header">Drills</h2>
                        <div class="graph">
                            <NUM_DRILLS_GRAPH />
                            <DRILL_TYPE_GRAPH />
                        </div>
                    </div>

                </div>
            </section>
        </>
    );
}

