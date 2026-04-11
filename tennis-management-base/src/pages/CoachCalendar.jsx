import { TYPING_INPUT } from '../Components/SharedComponents';
import './CoachCalendar.css'

export default function CoachCalendar() {
    return (
        <>
            <div class="content-box" id="calendar-box">
                <div id="calendar-top">
                    <h1 id="calendar-date">5-11 April, 2026</h1>
                </div>
                <div id="calendar"></div>
            </div>
            <div class="content-box editor-box" id="session-creator">
                <h2 class="content-header">Session Creator</h2>
                <TYPING_INPUT label="NAME" num_rows="1" input_id="session-name" box_w="100%" box_h="30px" sample_txt="Session name" />
                <TYPING_INPUT label="NOTES" num_rows="6" input_id="session-name" box_w="100%" box_h="200px" sample_txt="Session notes" />
                <div class="input-container">
                    <span class="input-container-label">PEOPLE</span>
                    <div class="input-box-wrapper" id="session-people">
                    </div>
                </div>
            </div>
            <div class="content-box editor-box" id="session-editor">
                <h2 class="content-header">Session Editor</h2>
                <TYPING_INPUT label="NAME" num_rows="1" input_id="session-name" box_w="100%" box_h="30px" />
                <TYPING_INPUT label="NOTES" num_rows="6" input_id="session-name" box_w="100%" box_h="200px" />
            </div>
            <div class="content-box editor-box" id="drill-library">
                <h2 class="content-header">Drills</h2>

            </div>
        </>
    );
}