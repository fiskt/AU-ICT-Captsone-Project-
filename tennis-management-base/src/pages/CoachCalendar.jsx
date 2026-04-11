import { TYPING_INPUT } from '../Components/SharedComponents';
import './CoachCalendar.css'

export default function CoachCalendar() {
    return (
        <>
            <div class="content-box" id="calendar-box">
                <div id="calendar-top"></div>
                <div id="calendar"></div>
            </div>
            <div class="content-box editor-box" id="session-creator">
                <TYPING_INPUT label="NAME" num_rows="1" input_id="session-name" box_w="100%" box_h="30px" />
                <TYPING_INPUT label="NOTES" num_rows="6" input_id="session-name" box_w="100%" box_h="200px" />
            </div>
            <div class="content-box editor-box" id="session-editor">
            <TYPING_INPUT label="NAME" num_rows="1" input_id="session-name" box_w="100%" box_h="30px" />
                <TYPING_INPUT label="NOTES" num_rows="6" input_id="session-name" box_w="100%" box_h="200px" />
            </div>
            <div class="content-box editor-box" id="drill-library">

            </div>
        </>
    );
}