
import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';
import { DateTime } from 'luxon';


// get supabase url and key from environment variables
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

// get brevo details from environment variables
const transporter = nodemailer.createTransport({
    host: process.env.BREVO_SMTP_HOST,
    port: Number(process.env.BREVO_SMTP_PORT),
    secure: false,
    auth: {
        user: process.env.BREVO_SMTP_USER,
        pass: process.env.BREVO_SMTP_PASSWORD
    }
});

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // sessionId comes from the request body in the CoachCalendar.jsx file
    const { sessionId } = req.body;
    if (!sessionId) {
        return res.status(400).json({ error: 'sessionId is required' });
    }

    // use session id to fetch the name, notes, times of the session
    const { data: session, error: sessionError } = await supabase
        .from('sessions')
        .select('id, name, notes, start_datetime, end_datetime')
        .eq('id', sessionId)
        .single();

    if (sessionError || !session) {
        return res.status(404).json({ error: 'Session not found' });
    }

    // fetch all participants linked to the session
    // !inner join pulls the signin_details row for each so we get the email and name directly
    const { data: participants, error: participantsError } = await supabase
        .from('session_people')
        .select('signin_details!inner(email, first_name, last_name)')
        .eq('session_id', sessionId);

    if (participantsError) {
        return res.status(500).json({ error: participantsError.message });
    }

    //
    const recipients = (participants || [])
        .map(p => p.signin_details)
        .filter(p => p && p.email);

    // exit if no one has an email
    if (recipients.length === 0) {
        return res.status(200).json({ sent: 0, reason: 'No participants with emails' });
    }

    // make the calendar attachment 
    const icsContent = buildICS(session);

    // convert times to Adelaide timezone
    const start = DateTime.fromISO(session.start_datetime).setZone('Australia/Adelaide');
    const end = DateTime.fromISO(session.end_datetime).setZone('Australia/Adelaide');

    const dateStr = start.toFormat('cccc, LLL d');
    const startStr = start.toFormat('HH:mm');
    const endStr = end.toFormat('HH:mm');

    // send emails out in parallel
    // allSettled used so send failures dont block the other emails
    const results = await Promise.allSettled(recipients.map(r =>
        transporter.sendMail({
            from: '"HPT Sessions" <verificationhpt@outlook.com>',   // sends from this email address
            to: r.email,
            subject: `New session: ${session.name}`,
            html: `
                <div
                    style="
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
                        max-width: 560px; 
                        margin: 0 auto; 
                        padding: 32px 24px; 
                        color: #1a1a1a; 
                        line-height: 1.6;
                    "
                >
                    <h1
                        style="
                            font-size: 24px; 
                            font-weight: 600; 
                            margin: 0 0 16px; 
                            color: #1a1a1a;
                        "
                    >
                        Hi ${r.first_name}, you've been added to a session.
                    </h1>
                    <p
                        style="
                            font-size: 16px; 
                            margin: 0 0 16px;
                        "
                    >
                        ${dateStr} ${startStr} - ${endStr}
                    </p>
                    <h2>${session.name}</h2>
                    ${session.notes 
                        ? `<p
                                style="
                                    font-size: 16px; 
                                    margin: 0 0 16px;
                                "
                            >${session.notes}</p>` 
                        : ''
                    }
                </div>
            `,
            // attach .ics file
            attachments: [{
                filename: 'session.ics',
                content: icsContent,
                contentType: 'text/calendar; method=REQUEST'
            }]
        })
    ));

    const sent = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    results.forEach((r, i) => {
        if (r.status === 'rejected') {
            console.error(`Failed to email ${recipients[i].email}:`, r.reason);
        }
    });

    return res.status(200).json({ sent, failed, total: recipients.length });
}

function buildICS(session) {
    // ics needs compact timestamps, remove dashes, colons and the milliseconds
    // from iso date
    const fmt = (iso) => {
        const d = new Date(iso);
        return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    };

    // backslash escaping for special characters
    // text = '' as a fallback, set text to '' as a default
    const escape = (text = '') =>
        text.replace(/\\/g, '\\\\').replace(/,/g, '\\,').replace(/;/g, '\\;').replace(/\n/g, '\\n');

    return [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//HPT Management//Sessions//EN',
        'METHOD:REQUEST',
        'BEGIN:VEVENT',
        `UID:session-${session.id}@hpt-management-base.vercel.app`,
        `DTSTAMP:${fmt(new Date().toISOString())}`,
        `DTSTART:${fmt(session.start_datetime)}`,
        `DTEND:${fmt(session.end_datetime)}`,
        `SUMMARY:${escape(session.name)}`,
        `DESCRIPTION:${escape(session.notes || '')}`,
        'END:VEVENT',
        'END:VCALENDAR'
    ].join('\r\n');
}