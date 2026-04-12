import { TYPING_INPUT } from '../Components/SharedComponents.jsx';
import { CALENDAR, DRAGGABLE_SESSION } from '../Components/CoachCalendarComponents.jsx';
import { useState } from 'react';

export default function CoachCalendar() {
    const [sessionSettings, setSessionSettings] = useState({
        sessionName: "",
        sessionDuration: "",
        sessionNotes: "",
        sessionPeople: []
    });

    const updateField = (field, value) => {
        setSessionSettings({
            ...sessionSettings,
            [field]: value 
        });
    }

    return (
        <>
            <div class="content-box" id="calendar-box">
                <div id="calendar-top">
                    <CALENDAR />
                </div>
                <div id="calendar"></div>
            </div>
            <div class="content-box editor-box" id="session-creator">
                <h2 class="content-header">Session Creator</h2>
                <div id="session-creator-input-container">
                    <TYPING_INPUT 
                        label="NAME" 
                        num_rows="1" 
                        input_id="session-name" 
                        box_w="100%" box_h="30px" 
                        sample_txt="Session name"
                        value={sessionSettings.sessionName}
                        onChange={(val) => updateField('sessionName', val)}
                    />
                    <TYPING_INPUT 
                        label="DURATION" 
                        num_rows="1" 
                        input_id="session-duration" 
                        box_w="100%" box_h="30px" 
                        sample_txt="Session duration"
                        value={sessionSettings.sessionDuration}
                        onChange={(val) => updateField('sessionDuration', val)}
                    />
                    <TYPING_INPUT 
                        label="NOTES" 
                        num_rows="6" 
                        input_id="session-name" 
                        box_w="100%" box_h="80px" 
                        sample_txt="Session notes" 
                        value={sessionSettings.sessionNotes}
                        onChange={(val) => updateField('sessionNotes', val)}
                    />
                    <div class="input-container">
                        <span class="input-container-label">PEOPLE</span>
                        <div class="input-box-wrapper" id="session-people">
                        </div>
                    </div>
                    <div class="input-container">
                        <span class="input-container-label">DRILLS</span>
                        <div class="input-box-wrapper" id="session-drills">
                        </div>
                    </div>
                </div>
                <DRAGGABLE_SESSION sessionSettings={sessionSettings} />
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