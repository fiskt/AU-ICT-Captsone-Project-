import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import '../App.css';

// Tracks window width so components can adjust layout for mobile vs desktop
function useWindowWidth() {
    const [width, setWidth] = useState(window.innerWidth);
    useEffect(() => {
        const handle = () => setWidth(window.innerWidth);
        window.addEventListener('resize', handle);
        // Cleanup listener on unmount to prevent memory leaks
        return () => window.removeEventListener('resize', handle);
    }, []);
    return width;
}

// Allows users to update their first name, last name, DOB and gender.
// Email is read-only — it cannot be changed from this page.
// On save, updates both the signin_details table and Supabase user_metadata
// so the sidebar name reflects the change immediately without re-login.
function ChangeDetails() {
    const navigate = useNavigate();
    const width = useWindowWidth();
    const isMobile = width < 768; 

    // UI state
    const [loading, setLoading] = useState(true);  
    const [saving, setSaving]   = useState(false); 
    const [success, setSuccess] = useState(false); 
    const [error, setError]     = useState('');    

    // Form field state
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName]   = useState('');
    const [email, setEmail]         = useState(''); 
    const [dob, setDob]             = useState('');
    const [gender, setGender]       = useState('');
    const [role, setRole]           = useState(''); 

    useEffect(() => {
        const load = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            // If no session, redirect to login
            if (!user) { navigate('/Login'); return; }

            // Populate fields from Supabase auth user_metadata first
            setEmail(user.email || '');
            setFirstName(user.user_metadata?.first_name || '');
            setLastName(user.user_metadata?.last_name   || '');
            setRole(user.user_metadata?.role            || '');

            // Then fetch dob and gender from signin_details table
            // These fields are not stored in user_metadata
            const { data } = await supabase
                .from('signin_details')
                .select('dob, gender, first_name, last_name')
                .eq('id', user.id)
                .single();

            if (data) {
                setDob(data.dob || '');
                setGender(data.gender || '');
                // Prefer signin_details name over metadata if available
                if (data.first_name) setFirstName(data.first_name);
                if (data.last_name)  setLastName(data.last_name);
            }
            setLoading(false);
        };
        load();
    }, []);

    // Handle save 
    const handleSave = async (e) => {
        e.preventDefault();
        setError(''); setSuccess(false);

        // Basic validation
        if (!firstName || !lastName) { setError('First and last name are required.'); return; }
        setSaving(true);

        const { data: { user } } = await supabase.auth.getUser();

        // Update signin_details table with all editable fields
        const { error: dbError } = await supabase
            .from('signin_details')
            .update({ first_name: firstName, last_name: lastName, dob: dob || null, gender: gender || null })
            .eq('id', user.id);

        if (dbError) { setError(dbError.message); setSaving(false); return; }

        // Also update user_metadata so the sidebar name updates immediately
        await supabase.auth.updateUser({ data: { first_name: firstName, last_name: lastName } });

        setSaving(false);
        setSuccess(true);
        // Auto-hide success message after 3 seconds
        setTimeout(() => setSuccess(false), 3000);
    };

    // Shared styles 
    const inputStyle = {
        width: '100%', padding: '10px 12px',
        fontSize: isMobile ? '16px' : '14px', // 16px prevents iOS auto-zoom
        fontFamily: 'DM Sans Light, sans-serif',
        border: '2px solid var(--content-input-border-color)',
        borderRadius: '8px', outline: 'none',
        boxSizing: 'border-box', color: '#000', background: '#fff',
    };
    const labelStyle = {
        fontFamily: 'DM Mono Light, sans-serif', fontSize: '12px',
        color: 'var(--content-subhead-color)', marginBottom: '6px', display: 'block',
    };
    const fieldStyle = { display: 'flex', flexDirection: 'column', marginBottom: '16px' };

    // Loading spinner 
    if (loading) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px' }}>
            <div style={{ width: '32px', height: '32px', border: '3px solid #DDDBD6', borderTop: '3px solid #C8714E', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        </div>
    );

    return (
        <div>
            {/* Section title and subtitle */}
            <h2 style={{ fontFamily: 'Bebas, sans-serif', fontSize: isMobile ? '20px' : '22px', letterSpacing: '1px', margin: '0 0 4px', color: 'var(--content-head-color)' }}>Change Details</h2>
            <p style={{ fontFamily: 'DM Sans Light, sans-serif', fontSize: '13px', color: 'var(--content-subhead-color)', margin: '0 0 20px' }}>
                Update your personal information below.
            </p>

            {/* Role badge — read only indicator showing coach or player */}
            <div style={{ display: 'inline-flex', alignItems: 'center', background: 'var(--topbar-accent-color)', border: '1.5px solid var(--content-input-border-color)', borderRadius: '20px', padding: '4px 12px', marginBottom: '20px' }}>
                <span style={{ fontFamily: 'DM Mono Light, sans-serif', fontSize: '11px', color: 'var(--content-subhead-color)', letterSpacing: '1px', textTransform: 'uppercase' }}>{role}</span>
            </div>

            <form onSubmit={handleSave}>
                {/* Name row — side by side on desktop, stacked on mobile */}
                <div style={{ display: 'flex', gap: '12px', flexDirection: isMobile ? 'column' : 'row' }}>
                    <div style={{ ...fieldStyle, flex: 1 }}>
                        <label style={labelStyle}>FIRST NAME</label>
                        <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} style={inputStyle} />
                    </div>
                    <div style={{ ...fieldStyle, flex: 1 }}>
                        <label style={labelStyle}>LAST NAME</label>
                        <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} style={inputStyle} />
                    </div>
                </div>

                {/* Email field — disabled, shown for reference only */}
                <div style={fieldStyle}>
                    <label style={labelStyle}>EMAIL</label>
                    <input type="email" value={email} disabled style={{ ...inputStyle, background: 'var(--topbar-accent-color)', color: 'var(--content-subhead-color)', cursor: 'not-allowed' }} />
                    <span style={{ fontSize: '11px', color: 'var(--content-subhead-color)', fontFamily: 'DM Sans Light, sans-serif', marginTop: '4px' }}>Email cannot be changed here.</span>
                </div>

                {/* Date of birth */}
                <div style={fieldStyle}>
                    <label style={labelStyle}>DATE OF BIRTH</label>
                    <input type="date" value={dob} onChange={(e) => setDob(e.target.value)} style={inputStyle} />
                </div>

                {/* Gender dropdown */}
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

                {/* Error and success feedback messages */}
                {error   && <p style={{ margin: '0 0 12px', fontSize: '13px', color: '#DC2626', fontFamily: 'DM Sans Light, sans-serif' }}>{error}</p>}
                {success && <p style={{ margin: '0 0 12px', fontSize: '13px', color: '#16a34a', fontFamily: 'DM Sans Light, sans-serif' }}>✓ Profile updated successfully.</p>}

                {/* Submit button — full width on mobile */}
                <button type="submit" disabled={saving}
                    style={{ width: isMobile ? '100%' : 'auto', padding: '12px 28px', background: 'var(--accent-color)', color: '#fff', border: 'none', borderRadius: '8px', fontFamily: 'Bebas, sans-serif', fontSize: '18px', letterSpacing: '2px', cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>
                    {saving ? 'SAVING...' : 'SAVE CHANGES'}
                </button>
            </form>
        </div>
    );
}

// Hard deletes the account via the Supabase Edge Function 'hyper-responder'.
// The Edge Function removes the user from auth.users and signin_details.
// Requires the user to type "DELETE" to confirm before proceeding.
function DeleteAccount() {
    const navigate = useNavigate();
    const width = useWindowWidth();
    const isMobile = width < 768;

    // UI state
    const [confirm, setConfirm]   = useState(false);  
    const [deleting, setDeleting] = useState(false);  
    const [error, setError]       = useState('');     
    const [typed, setTyped]       = useState('');     

    // Handle delete 
    const handleDelete = async () => {
        setError('');

        // Require exact text "DELETE" to prevent accidental deletion
        if (typed !== 'DELETE') { setError('Please type DELETE to confirm.'); return; }
        setDeleting(true);

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { navigate('/Login'); return; }

        // Call the Edge Function to hard delete from auth.users and signin_details
        // The function name 'hyper-responder' is the Supabase-assigned endpoint name
        const { error } = await supabase.functions.invoke('hyper-responder', {
            body: { userId: user.id }
        });

        if (error) { setError('Failed to delete account. Please try again.'); setDeleting(false); return; }

        // Sign out and redirect to login after successful deletion
        await supabase.auth.signOut();
        navigate('/Login');
    };

    return (
        <div>
            {/* Section title and subtitle */}
            <h2 style={{ fontFamily: 'Bebas, sans-serif', fontSize: isMobile ? '20px' : '22px', letterSpacing: '1px', margin: '0 0 4px', color: 'var(--content-head-color)' }}>Delete Account</h2>
            <p style={{ fontFamily: 'DM Sans Light, sans-serif', fontSize: '13px', color: 'var(--content-subhead-color)', margin: '0 0 20px' }}>
                Permanently delete your account and all associated data.
            </p>

            {/* Warning box — red background to signal irreversible action */}
            <div style={{ background: '#FEF2F2', border: '1.5px solid #FCA5A5', borderRadius: '8px', padding: '16px', marginBottom: '24px' }}>
                <p style={{ margin: '0 0 8px', fontFamily: 'DM Sans Light, sans-serif', fontSize: '14px', color: '#991B1B', fontWeight: '600' }}>This action cannot be undone.</p>
                <p style={{ margin: 0, fontFamily: 'DM Sans Light, sans-serif', fontSize: '13px', color: '#B91C1C' }}>
                    Your account will be permanently deleted. You will lose access to all your data including sessions, feedback, and performance records.
                </p>
            </div>

            {/* Step 1 — Show delete button. Step 2 — Show confirmation input */}
            {!confirm ? (
                // Initial delete button — clicking reveals the confirmation step
                <button onClick={() => setConfirm(true)}
                    style={{ width: isMobile ? '100%' : 'auto', padding: '12px 28px', background: '#DC2626', color: '#fff', border: 'none', borderRadius: '8px', fontFamily: 'Bebas, sans-serif', fontSize: '18px', letterSpacing: '2px', cursor: 'pointer' }}>
                    DELETE ACCOUNT
                </button>
            ) : (
                // Confirmation step — user must type DELETE to proceed
                <div>
                    <p style={{ fontFamily: 'DM Sans Light, sans-serif', fontSize: '14px', color: 'var(--content-head-color)', marginBottom: '12px' }}>
                        Type <strong>DELETE</strong> below to confirm:
                    </p>

                    {/* Confirmation text input — styled with red border to reinforce danger */}
                    <input type="text" value={typed} onChange={(e) => setTyped(e.target.value)} placeholder="DELETE"
                        style={{ width: '100%', padding: '10px 12px', fontSize: isMobile ? '16px' : '14px', fontFamily: 'DM Mono Light, sans-serif', border: '2px solid #FCA5A5', borderRadius: '8px', outline: 'none', boxSizing: 'border-box', color: '#000', background: '#fff', marginBottom: '12px' }} />

                    {/* Error message if typed text is wrong or delete fails */}
                    {error && <p style={{ margin: '0 0 12px', fontSize: '13px', color: '#DC2626', fontFamily: 'DM Sans Light, sans-serif' }}>{error}</p>}

                    {/* Action buttons — stacked on mobile, side by side on desktop */}
                    <div style={{ display: 'flex', gap: '10px', flexDirection: isMobile ? 'column' : 'row' }}>
                        <button onClick={handleDelete} disabled={deleting}
                            style={{ padding: '12px 28px', background: '#DC2626', color: '#fff', border: 'none', borderRadius: '8px', fontFamily: 'Bebas, sans-serif', fontSize: '18px', letterSpacing: '2px', cursor: 'pointer', opacity: deleting ? 0.7 : 1 }}>
                            {deleting ? 'DELETING...' : 'CONFIRM DELETE'}
                        </button>
                        {/* Cancel resets all confirmation state */}
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

// Renders a settings sidebar on desktop and a dropdown picker on mobile.
// Each nav item maps to a section component rendered in the content area.
export default function AccountSettings() {
    const [activeSection, setActiveSection] = useState('details'); // Which section is currently shown
    const [sidebarOpen, setSidebarOpen] = useState(false);         // Mobile dropdown open state
    const width = useWindowWidth();
    const isMobile = width < 768;

    // Each item has an id matching a section component, a label, and an SVG icon
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

    // Label of the currently active section (used in mobile dropdown trigger)
    const activeName = navItems.find(i => i.id === activeSection)?.label;

    // Rendered in both the desktop sidebar and mobile dropdown
    const sidebarContent = (
        <>
            {navItems.map((item, i) => (
                <div key={item.id}
                    // On click: set active section and close mobile dropdown
                    onClick={() => { setActiveSection(item.id); setSidebarOpen(false); }}
                    style={{
                        display: 'flex', alignItems: 'center', gap: '10px',
                        padding: '12px 16px', cursor: 'pointer',
                        fontFamily: 'DM Sans Light, sans-serif', fontSize: '13px',
                        // Divider between items except last
                        borderBottom: i < navItems.length - 1 ? '1px solid var(--content-input-border-color)' : 'none',
                        // Highlight active item; delete is always red regardless
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
        </>
    );

    return (
        <div className="dashboardPage">
            {/* Page header */}
            <div className="dashboardHeader" style={{ marginBottom: '24px' }}>
                <div>
                    <h2 className="content-header" style={{ padding: 0, marginBottom: '4px' }}>Account Settings</h2>
                    <p style={{ fontFamily: "'DM Sans Light', sans-serif", fontSize: '13px', color: 'var(--content-subhead-color)' }}>
                        Manage your profile and account.
                    </p>
                </div>
            </div>

            {/* Mobile — collapsible dropdown replaces sidebar */}
            {isMobile && (
                <div style={{ marginBottom: '16px' }}>
                    {/* Dropdown trigger — shows current section name with arrow */}
                    <div
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            padding: '12px 16px', background: 'var(--content-bg-color)',
                            border: '1px solid var(--content-input-border-color)',
                            // Round bottom corners only when closed
                            borderRadius: sidebarOpen ? '10px 10px 0 0' : '10px',
                            cursor: 'pointer', fontFamily: 'DM Sans Light, sans-serif',
                            fontSize: '13px', color: 'var(--content-head-color)',
                        }}
                    >
                        <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            {navItems.find(i => i.id === activeSection)?.icon}
                            {activeName}
                        </span>
                        {/* Arrow indicator */}
                        <span style={{ fontSize: '12px', color: 'var(--content-subhead-color)' }}>{sidebarOpen ? '▲' : '▼'}</span>
                    </div>

                    {/* Dropdown menu — shown when open */}
                    {sidebarOpen && (
                        <div style={{ background: 'var(--content-bg-color)', border: '1px solid var(--content-input-border-color)', borderTop: 'none', borderRadius: '0 0 10px 10px', overflow: 'hidden' }}>
                            {sidebarContent}
                        </div>
                    )}
                </div>
            )}

            <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
                {/* Desktop — fixed width sidebar on the left */}
                {!isMobile && (
                    <div style={{ width: '200px', flexShrink: 0, background: 'var(--content-bg-color)', border: '1px solid var(--content-input-border-color)', borderRadius: '10px', overflow: 'hidden' }}>
                        {sidebarContent}
                    </div>
                )}

                {/* Content area — renders the active section component */}
                <div style={{ flex: 1, background: 'var(--content-bg-color)', border: '1px solid var(--content-input-border-color)', borderRadius: '10px', padding: isMobile ? '16px' : '24px' }}>
                    {activeSection === 'details' && <ChangeDetails />}
                    {activeSection === 'delete'  && <DeleteAccount />}
                </div>
            </div>
        </div>
    );
}