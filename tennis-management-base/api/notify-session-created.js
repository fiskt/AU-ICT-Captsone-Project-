// api/notify-session-created.js
import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';
import { DateTime } from 'luxon';
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

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

    const { sessionId } = req.body;
    if (!sessionId) {
        return res.status(400).json({ error: 'sessionId is required' });
    }

    const { data: session, error: sessionError } = await supabase
        .from('sessions')
        .select('id, name, notes, start_datetime, end_datetime')
        .eq('id', sessionId)
        .single();

    if (sessionError || !session) {
        return res.status(404).json({ error: 'Session not found' });
    }

    const { data: participants, error: participantsError } = await supabase
        .from('session_people')
        .select('signin_details!inner(email, first_name, last_name)')
        .eq('session_id', sessionId);

    if (participantsError) {
        return res.status(500).json({ error: participantsError.message });
    }

    const recipients = (participants || [])
        .map(p => p.signin_details)
        .filter(p => p && p.email);

    if (recipients.length === 0) {
        return res.status(200).json({ sent: 0, reason: 'No participants with emails' });
    }

    const icsContent = buildICS(session);

    const start = DateTime.fromISO(session.start_datetime).setZone('Australia/Adelaide');
    const end = DateTime.fromISO(session.end_datetime).setZone('Australia/Adelaide');

    const dateStr = start.toFormat('cccc, LLL d');
    const startStr = start.toFormat('HH:mm');
    const endStr = end.toFormat('HH:mm');

    const results = await Promise.allSettled(recipients.map(r =>
        transporter.sendMail({
            from: '"HPT Sessions" <verificationhpt@outlook.com>',
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
                        ${dateStr}, ${startStr} - ${endStr}
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
    const fmt = (iso) => {
        const d = new Date(iso);
        return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    };
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