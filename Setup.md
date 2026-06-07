# Website Setup

1. Sign up for Vercel ([https://vercel.com/signup](https://vercel.com/signup))
2. Create a new project in the dashboard
3. Under "Import Git Repository", import the project repository
   * Check if the repository is set to "public" if there is nothing there
4. Set the website name, this will appear in the url
5. Click edit on the root directory and select "tennis-management-base"
6. Add the environment variables from the table below. Set the variables to "sensitive" if needed
7. Click "Deploy" and access the website through the domain created

| Key                           | Value                                                                                           |
| ----------------------------- | ----------------------------------------------------------------------------------------------- |
| BREVO_SMTP_USER               | The "Login" value found in Brevo settings, in the SMTP & API tab under "Your SMTP Settings" "" |
| BREVO_SMTP_HOST               | The "SMTP Server" value found in Brevo settings, in the SMTP & API tab                          |
| BREVO_SMTP_PORT               | The "Port" value found in Brevo settings, in the SMTP & API tab                                 |
| BREVO_SMTP_PASSWORD           |                                                                                                 |
| VITE_SUPABASE_URL             | Copy the "Project URL" from the Supabase project overview page                                  |
| VITE_SUPABASE_PUBLISHABLE_KEY | Copy the "Publishable Key" from the Supabase project overview page                              |

# System Email Setup

You might need to change the system's email address from the free domain to avoid emails getting blocked.

### Change Email for Session Invitations

Open notify-session-created.js in the api folder (tennis-management-base > api > notify-session-created.js) and look for this piece of code.

```js
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
```

Change the email address (3rd line in the snippet) to an email you want to use to send the session calendar invitations. Make sure to keep the email wrapped in "<>".

### Change Email for Registration Verification

1. Log into Supabase and open the HPT Management Base project.
2. Open the "Authentication" tab and under "Notifications", open "Emails"
3. Open the "SMTP Settings" tab
4. In the "Sender details" section, edit the email address and sender name
