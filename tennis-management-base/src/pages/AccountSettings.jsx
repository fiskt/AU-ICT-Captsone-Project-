import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import '../App.css';

// CHANGE DETAILS SECTION
// Component for editing the user's profile details
function ChangeDetails() {
    // Allows the page to redirect the user when needed
    const navigate = useNavigate();
    // Tracks loading, saving, success, and error states
    const [loading, setLoading] = useState(true);
    const [saving, setSaving]   = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError]     = useState('');

    // Stores the profile fields shown in the form
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName]   = useState('');
    const [email, setEmail]         = useState('');
    const [dob, setDob]             = useState('');
    const [gender, setGender]       = useState('');
    const [role, setRole]           = useState('');

    // Loads the current user's saved profile details when the page opens
    useEffect(() => {
        // Defines the function that retrieves the user profile
        const load = async () => {
            // Gets the currently logged in user
            const { data: { user } } = await supabase.auth.getUser();
            // Sends the user to login when no active session exists
            if (!user) { navigate('/Login'); return; }
            // Fills the form using account metadata first
            setEmail(user.email || '');
            setFirstName(user.user_metadata?.first_name || '');
            setLastName(user.user_metadata?.last_name   || '');
            setRole(user.user_metadata?.role            || '');

            // Reads extra profile details from the signin_details table
            const { data } = await supabase
                .from('signin_details')
                .select('dob, gender, first_name, last_name')
                .eq('id', user.id)
                .single();

            // Uses database values when they exist
            if (data) {
                setDob(data.dob || '');
                setGender(data.gender || '');
                if (data.first_name) setFirstName(data.first_name);
                if (data.last_name)  setLastName(data.last_name);
            }
            // Stops the loading spinner after the data check finishes
            setLoading(false);
        };
        // Runs the profile loading function
        load();
    }, []);

    // Handles the save button for profile updates
    const handleSave = async (e) => {
        // Stops the form from refreshing the page
        e.preventDefault();
        // Clears old messages before saving again
        setError(''); setSuccess(false);
        // Requires both first name and last name before saving
        if (!firstName || !lastName) { setError('First and last name are required.'); return; }
        // Shows the saving state while the update is running
        setSaving(true);

        // Gets the current user before updating saved details
        const { data: { user } } = await supabase.auth.getUser();
        // Updates the profile details stored in the database
        const { error: dbError } = await supabase
            .from('signin_details')
            .update({ first_name: firstName, last_name: lastName, dob: dob || null, gender: gender || null })
            .eq('id', user.id);

        // Stops saving and shows the database error if the update fails
        if (dbError) { setError(dbError.message); setSaving(false); return; }
        // Updates the user's authentication metadata with the new name
        await supabase.auth.updateUser({ data: { first_name: firstName, last_name: lastName } });

        // Shows a temporary success message after saving
        setSaving(false);
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
    };

    // Shared style for the form inputs
    const inputStyle = {
        width: '100%', padding: '10px 12px', fontSize: '14px',
        fontFamily: 'DM Sans Light, sans-serif',
        border: '2px solid var(--content-input-border-color)',
        borderRadius: '8px', outline: 'none',
        boxSizing: 'border-box', color: '#000', background: '#fff',
    };
    // Shared style for form labels
    const labelStyle = {
        fontFamily: 'DM Mono Light, sans-serif', fontSize: '12px',
        color: 'var(--content-subhead-color)', marginBottom: '6px', display: 'block',
    };
    // Shared layout style for each form field
    const fieldStyle = { display: 'flex', flexDirection: 'column', marginBottom: '16px' };

    // Shows a spinner while profile details are loading
    if (loading) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px' }}>
            <div style={{ width: '32px', height: '32px', border: '3px solid #DDDBD6', borderTop: '3px solid #C8714E', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        </div>
    );

    // Renders the change details form
    return (
        <div>
            <h2 style={{ fontFamily: 'Bebas, sans-serif', fontSize: '22px', letterSpacing: '1px', margin: '0 0 4px', color: 'var(--content-head-color)' }}>Change Details</h2>
            <p style={{ fontFamily: 'DM Sans Light, sans-serif', fontSize: '13px', color: 'var(--content-subhead-color)', margin: '0 0 24px' }}>
                Update your personal information below.
            </p>

            {/* Role badge */}
            <div style={{
                display: 'inline-flex', alignItems: 'center',
                background: 'var(--topbar-accent-color)',
                border: '1.5px solid var(--content-input-border-color)',
                borderRadius: '20px', padding: '4px 12px', marginBottom: '24px',
            }}>
                <span style={{ fontFamily: 'DM Mono Light, sans-serif', fontSize: '11px', color: 'var(--content-subhead-color)', letterSpacing: '1px', textTransform: 'uppercase' }}>{role}</span>
            </div>

            <form onSubmit={handleSave}>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <div style={{ ...fieldStyle, flex: 1 }}>
                        <label style={labelStyle}>FIRST NAME</label>
                        <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} style={inputStyle} />
                    </div>
                    <div style={{ ...fieldStyle, flex: 1 }}>
                        <label style={labelStyle}>LAST NAME</label>
                        <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} style={inputStyle} />
                    </div>
                </div>

                <div style={fieldStyle}>
                    <label style={labelStyle}>EMAIL</label>
                    <input type="email" value={email} disabled
                        style={{ ...inputStyle, background: 'var(--topbar-accent-color)', color: 'var(--content-subhead-color)', cursor: 'not-allowed' }} />
                    <span style={{ fontSize: '11px', color: 'var(--content-subhead-color)', fontFamily: 'DM Sans Light, sans-serif', marginTop: '4px' }}>Email cannot be changed here.</span>
                </div>

                <div style={fieldStyle}>
                    <label style={labelStyle}>DATE OF BIRTH</label>
                    <input type="date" value={dob} onChange={(e) => setDob(e.target.value)} style={inputStyle} />
                </div>

                <div style={fieldStyle}>
                    <label style={labelStyle}>GENDER</label>
                    <select value={gender} onChange={(e) => setGender(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                        <option value="">Prefer not to say</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="non-binary">Non-binary</option>
                        <option value="other">Other</option>
                    </select>
                </div>

                {error   && <p style={{ margin: '0 0 12px', fontSize: '13px', color: '#DC2626', fontFamily: 'DM Sans Light, sans-serif' }}>{error}</p>}
                {success && <p style={{ margin: '0 0 12px', fontSize: '13px', color: '#16a34a', fontFamily: 'DM Sans Light, sans-serif' }}>✓ Profile updated successfully.</p>}

                <button type="submit" disabled={saving}
                    style={{ padding: '12px 28px', background: 'var(--accent-color)', color: '#fff', border: 'none', borderRadius: '8px', fontFamily: 'Bebas, sans-serif', fontSize: '18px', letterSpacing: '2px', cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>
                    {saving ? 'SAVING...' : 'SAVE CHANGES'}
                </button>
            </form>
        </div>
    );
}

// ── DELETE ACCOUNT SECTION ────────────────────────────────────────────────────
// Component for permanently deleting the user's account
function DeleteAccount() {
    // Allows redirecting the user after account deletion
    const navigate = useNavigate();
    // Tracks delete confirmation, progress, errors, and typed text
    const [confirm, setConfirm]   = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [error, setError]       = useState('');
    const [typed, setTyped]       = useState('');

    // Handles the final account deletion action
    const handleDelete = async () => {
        // Clears any previous delete error message
        setError('');
        // Requires the user to type DELETE before continuing
        if (typed !== 'DELETE') { setError('Please type DELETE to confirm.'); return; }
        // Shows the deleting state while the request is running
        setDeleting(true);

        // Gets the logged in user before deleting the account
        const { data: { user } } = await supabase.auth.getUser();
        // Sends the user to login when no active session exists
        if (!user) { navigate('/Login'); return; }

        // Hard delete via Edge Function — removes from auth.users and signin_details
        // Calls the Edge Function that performs the hard delete
        const { error } = await supabase.functions.invoke('hyper-responder', {
            body: { userId: user.id }
        });

        // Stops deleting and shows a message if the delete request fails
        if (error) { setError('Failed to delete account. Please try again.'); setDeleting(false); return; }

        // Signs the user out after the account is deleted
        await supabase.auth.signOut();
        // Redirects the user back to the login page
        navigate('/Login');
    };

    // Renders the delete account section
    return (
        <div>
            <h2 style={{ fontFamily: 'Bebas, sans-serif', fontSize: '22px', letterSpacing: '1px', margin: '0 0 4px', color: 'var(--content-head-color)' }}>Delete Account</h2>
            <p style={{ fontFamily: 'DM Sans Light, sans-serif', fontSize: '13px', color: 'var(--content-subhead-color)', margin: '0 0 24px' }}>
                Permanently delete your account and all associated data.
            </p>

            {/* Warning box */}
            <div style={{
                background: '#FEF2F2', border: '1.5px solid #FCA5A5',
                borderRadius: '8px', padding: '16px', marginBottom: '24px',
            }}>
                <p style={{ margin: '0 0 8px', fontFamily: 'DM Sans Light, sans-serif', fontSize: '14px', color: '#991B1B', fontWeight: '600' }}>
                    This action cannot be undone.
                </p>
                <p style={{ margin: 0, fontFamily: 'DM Sans Light, sans-serif', fontSize: '13px', color: '#B91C1C' }}>
                    Your account will be permanently deleted. You will lose access to all your data including sessions, feedback, and performance records.
                </p>
            </div>

            {!confirm ? (
                <button onClick={() => setConfirm(true)}
                    style={{ padding: '12px 28px', background: '#DC2626', color: '#fff', border: 'none', borderRadius: '8px', fontFamily: 'Bebas, sans-serif', fontSize: '18px', letterSpacing: '2px', cursor: 'pointer' }}>
                    DELETE ACCOUNT
                </button>
            ) : (
                <div>
                    <p style={{ fontFamily: 'DM Sans Light, sans-serif', fontSize: '14px', color: 'var(--content-head-color)', marginBottom: '12px' }}>
                        Type <strong>DELETE</strong> below to confirm:
                    </p>
                    <input
                        type="text" value={typed}
                        onChange={(e) => setTyped(e.target.value)}
                        placeholder="DELETE"
                        style={{
                            width: '100%', padding: '10px 12px', fontSize: '14px',
                            fontFamily: 'DM Mono Light, sans-serif',
                            border: '2px solid #FCA5A5', borderRadius: '8px',
                            outline: 'none', boxSizing: 'border-box',
                            color: '#000', background: '#fff', marginBottom: '12px',
                        }}
                    />
                    {error && <p style={{ margin: '0 0 12px', fontSize: '13px', color: '#DC2626', fontFamily: 'DM Sans Light, sans-serif' }}>{error}</p>}
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button onClick={handleDelete} disabled={deleting}
                            style={{ padding: '12px 28px', background: '#DC2626', color: '#fff', border: 'none', borderRadius: '8px', fontFamily: 'Bebas, sans-serif', fontSize: '18px', letterSpacing: '2px', cursor: 'pointer', opacity: deleting ? 0.7 : 1 }}>
                            {deleting ? 'DELETING...' : 'CONFIRM DELETE'}
                        </button>
                        <button onClick={() => { setConfirm(false); setTyped(''); setError(''); }}
                            style={{ padding: '12px 28px', background: 'transparent', color: 'var(--content-subhead-color)', border: '2px solid var(--content-input-border-color)', borderRadius: '8px', fontFamily: 'Bebas, sans-serif', fontSize: '18px', letterSpacing: '2px', cursor: 'pointer' }}>
                            CANCEL
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

// ── MAIN ACCOUNT SETTINGS PAGE ────────────────────────────────────────────────
// Main account settings page
export default function AccountSettings() {
    // Tracks which settings section is currently selected
    const [activeSection, setActiveSection] = useState('details');

    // Sidebar options for switching between settings sections
    const navItems = [
        { id: 'details', label: 'Change Details', icon: (
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
        )},
        { id: 'delete', label: 'Delete Account', icon: (
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
        )},
    ];

    // Renders the full account settings layout
    return (
        <div className="dashboardPage">
            {/* Header */}
            <div className="dashboardHeader" style={{ marginBottom: '24px' }}>
                <div>
                    <h2 className="content-header" style={{ padding: 0, marginBottom: '4px' }}>Account Settings</h2>
                    <p style={{ fontFamily: "'DM Sans Light', sans-serif", fontSize: '13px', color: 'var(--content-subhead-color)' }}>
                        Manage your profile and account.
                    </p>
                </div>
            </div>

            <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>

                {/* Settings sidebar */}
                <div style={{
                    width: '200px', flexShrink: 0,
                    background: 'var(--content-box-bg)',
                    border: '1px solid var(--content-input-border-color)',
                    borderRadius: '10px', overflow: 'hidden',
                }}>
                    {navItems.map((item, i) => (
                        <div key={item.id}
                            onClick={() => setActiveSection(item.id)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '10px',
                                padding: '12px 16px', cursor: 'pointer',
                                fontFamily: 'DM Sans Light, sans-serif', fontSize: '13px',
                                borderBottom: i < navItems.length - 1 ? '1px solid var(--content-input-border-color)' : 'none',
                                background: activeSection === item.id ? 'var(--topbar-accent-color)' : 'transparent',
                                color: activeSection === item.id
                                    ? (item.id === 'delete' ? '#DC2626' : 'var(--accent-color)')
                                    : (item.id === 'delete' ? '#DC2626' : 'var(--content-head-color)'),
                                fontWeight: activeSection === item.id ? '600' : '400',
                                transition: 'background 0.15s',
                            }}
                            onMouseEnter={(e) => { if (activeSection !== item.id) e.currentTarget.style.background = 'var(--topbar-accent-color)'; }}
                            onMouseLeave={(e) => { if (activeSection !== item.id) e.currentTarget.style.background = 'transparent'; }}
                        >
                            {item.icon}
                            {item.label}
                        </div>
                    ))}
                </div>

                {/* Content area */}
                <div style={{
                    flex: 1,
                    background: 'var(--content-box-bg)',
                    border: '1px solid var(--content-input-border-color)',
                    borderRadius: '10px', padding: '24px',
                }}>
                    {activeSection === 'details' && <ChangeDetails />}
                    {activeSection === 'delete'  && <DeleteAccount />}
                </div>

            </div>
        </div>
    );
}