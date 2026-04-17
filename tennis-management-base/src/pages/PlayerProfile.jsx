import { DRILL_TYPE_GRAPH, EXERTION_GRAPH, NUM_DRILLS_GRAPH } from "../Components/LoadTrackingComponents";

export default function PlayerProfile() {
    return (
        <>
            <div class="content-box">
                <h2 class="content-header">Rate of Exertion</h2>
                <EXERTION_GRAPH />
            </div>
            <div class="content-box">
                <h2 class="content-header">Drills</h2>
                <NUM_DRILLS_GRAPH />
                <DRILL_TYPE_GRAPH />
            </div>
        </>
    );
}