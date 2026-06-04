import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import '../App.css';

// ── RESPONSIVE HOOK ───────────────────────────────────────────────────────────
function useWindowWidth() {
    const [width, setWidth] = useState(window.innerWidth);
    useEffect(() => {
        const handle = () => setWidth(window.innerWidth);
        window.addEventListener('resize', handle);
        return () => window.removeEventListener('resize', handle);
    }, []);
    return width;
}

// ── CHANGE DETAILS SECTION ────────────────────────────────────────────────────
function ChangeDetails() {
    const navigate = useNavigate();
    const width = useWindowWidth();
    const isMobile = width < 768;

    const [loading, setLoading] = useState(true);
    const [saving, setSaving]   = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError]     = useState('');

    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName]   = useState('');
    const [email, setEmail]         = useState('');
    const [dob, setDob]             = useState('');
    const [gender, setGender]       = useState('');
    const [role, setRole]           = useState('');

    useEffect(() => {
        const load = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) { navigate('/Login'); return; }
            setEmail(user.email || '');
            setFirstName(user.user_metadata?.first_name || '');
            setLastName(user.user_metadata?.last_name   || '');
            setRole(user.user_metadata?.role            || '');

            const { data } = await supabase
                .from('signin_details')
                .select('dob, gender, first_name, last_name')
                .eq('id', user.id)
                .single();

            if (data) {
                setDob(data.dob || '');
                setGender(data.gender || '');
                if (data.first_name) setFirstName(data.first_name);
                if (data.last_name)  setLastName(data.last_name);
            }
            setLoading(false);
        };
        load();
    }, []);

    const handleSave = async (e) => {
        e.preventDefault();
        setError(''); setSuccess(false);
        if (!firstName || !lastName) { setError('First and last name are required.'); return; }
        setSaving(true);

        const { data: { user } } = await supabase.auth.getUser();
        const { error: dbError } = await supabase
            .from('signin_details')
            .update({ first_name: firstName, last_name: lastName, dob: dob || null, gender: gender || null })
            .eq('id', user.id);

        if (dbError) { setError(dbError.message); setSaving(false); return; }
        await supabase.auth.updateUser({ data: { first_name: firstName, last_name: lastName } });

        setSaving(false);
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
    };

    const inputStyle = {
        width: '100%', padding: '10px 12px',
        fontSize: isMobile ? '16px' : '14px',
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

    if (loading) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px' }}>
            <div style={{ width: '32px', height: '32px', border: '3px solid #DDDBD6', borderTop: '3px solid #C8714E', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        </div>
    );

    return (
        <div>
            <h2 style={{ fontFamily: 'Bebas, sans-serif', fontSize: isMobile ? '20px' : '22px', letterSpacing: '1px', margin: '0 0 4px', color: 'var(--content-head-color)' }}>Change Details</h2>
            <p style={{ fontFamily: 'DM Sans Light, sans-serif', fontSize: '13px', color: 'var(--content-subhead-color)', margin: '0 0 20px' }}>
                Update your personal information below.
            </p>

            <div style={{ display: 'inline-flex', alignItems: 'center', background: 'var(--topbar-accent-color)', border: '1.5px solid var(--content-input-border-color)', borderRadius: '20px', padding: '4px 12px', marginBottom: '20px' }}>
                <span style={{ fontFamily: 'DM Mono Light, sans-serif', fontSize: '11px', color: 'var(--content-subhead-color)', letterSpacing: '1px', textTransform: 'uppercase' }}>{role}</span>
            </div>

            <form onSubmit={handleSave}>
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

                <div style={fieldStyle}>
                    <label style={labelStyle}>EMAIL</label>
                    <input type="email" value={email} disabled style={{ ...inputStyle, background: 'var(--topbar-accent-color)', color: 'var(--content-subhead-color)', cursor: 'not-allowed' }} />
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
                    style={{ width: isMobile ? '100%' : 'auto', padding: '12px 28px', background: 'var(--accent-color)', color: '#fff', border: 'none', borderRadius: '8px', fontFamily: 'Bebas, sans-serif', fontSize: '18px', letterSpacing: '2px', cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>
                    {saving ? 'SAVING...' : 'SAVE CHANGES'}
                </button>
            </form>
        </div>
    );
}

// ── MY INJURIES SECTION (player only) ────────────────────────────────────────
// Players can report new injuries and view their injury history.
// Coaches can see these injuries in PlayerProfile.jsx and add notes/restrictions.
function MyInjuries() {
    const width = useWindowWidth();
    const isMobile = width < 768;

    const [injuries, setInjuries]     = useState([]);
    const [loading, setLoading]       = useState(true);
    const [showForm, setShowForm]     = useState(false);
    const [saving, setSaving]         = useState(false);
    const [error, setError]           = useState('');
    const [success, setSuccess]       = useState('');

    // New injury form state
    const [injuryType, setInjuryType]     = useState('');
    const [bodyPart, setBodyPart]         = useState('');
    const [description, setDescription]   = useState('');
    const [severity, setSeverity]         = useState('mild');
    const [dateOccurred, setDateOccurred] = useState('');

    const inputStyle = {
        width: '100%', padding: '10px 12px',
        fontSize: isMobile ? '16px' : '14px',
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

    // ── Load player's injuries on mount ──────────────────────────────────────
    useEffect(() => {
        fetchInjuries();
    }, []);

    async function fetchInjuries() {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
            .from('injuries')
            .select('*')
            .eq('player_id', user.id)
            .order('reported_at', { ascending: false });

        if (error) { console.log('Error fetching injuries:', error.message); }
        else { setInjuries(data || []); }
        setLoading(false);
    }

    // ── Submit new injury report ──────────────────────────────────────────────
    async function handleSubmit(e) {
        e.preventDefault();
        setError(''); setSuccess('');

        if (!injuryType || !bodyPart || !dateOccurred) {
            setError('Please fill in injury type, body part and date occurred.');
            return;
        }

        setSaving(true);
        const { data: { user } } = await supabase.auth.getUser();

        const { error: insertError } = await supabase
            .from('injuries')
            .insert({
                player_id: user.id,
                injury_type: injuryType,
                body_part: bodyPart,
                description: description || null,
                severity,
                date_occurred: dateOccurred,
                status: 'active',
            });

        if (insertError) { setError(insertError.message); setSaving(false); return; }

        // Reset form and reload injuries
        setInjuryType(''); setBodyPart(''); setDescription('');
        setSeverity('mild'); setDateOccurred('');
        setShowForm(false);
        setSaving(false);
        setSuccess('Injury reported successfully.');
        setTimeout(() => setSuccess(''), 3000);
        fetchInjuries();
    }

    // ── Severity badge colour ─────────────────────────────────────────────────
    function severityStyle(sev) {
        if (sev === 'severe')   return { background: '#FEE2E2', color: '#DC2626', border: '1px solid #FCA5A5' };
        if (sev === 'moderate') return { background: '#FEF3C7', color: '#D97706', border: '1px solid #FCD34D' };
        return { background: '#DCFCE7', color: '#16A34A', border: '1px solid #86EFAC' };
    }

    // ── Status badge colour ───────────────────────────────────────────────────
    function statusStyle(status) {
        if (status === 'recovered')  return { background: '#DCFCE7', color: '#16A34A', border: '1px solid #86EFAC' };
        if (status === 'monitoring') return { background: '#FEF3C7', color: '#D97706', border: '1px solid #FCD34D' };
        return { background: '#FEE2E2', color: '#DC2626', border: '1px solid #FCA5A5' };
    }

    const badgeStyle = {
        display: 'inline-flex', alignItems: 'center',
        padding: '2px 10px', borderRadius: '100px',
        fontFamily: 'DM Mono Light, sans-serif', fontSize: '10px',
        fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px',
    };

    return (
        <div>
            {/* Section header with report button */}
            <div style={{ marginBottom: '20px' }}>
                <h2 style={{ fontFamily: 'Bebas, sans-serif', fontSize: isMobile ? '20px' : '22px', letterSpacing: '1px', margin: '0 0 4px', color: 'var(--content-head-color)' }}>My Injuries</h2>
                <p style={{ fontFamily: 'DM Sans Light, sans-serif', fontSize: '13px', color: 'var(--content-subhead-color)', margin: 0 }}>
                    Report and track your injury history. Your coach can review these and add training restrictions.
                </p>
                {!showForm && (
                    <button onClick={() => setShowForm(true)}
                        style={{ padding: '8px 18px', background: 'var(--accent-color)', color: '#fff', border: 'none', borderRadius: '8px', fontFamily: 'Bebas, sans-serif', fontSize: '16px', letterSpacing: '2px', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                        + REPORT INJURY
                    </button>
                )}
            </div>

            {/* Success message */}
            {success && <p style={{ margin: '0 0 16px', fontSize: '13px', color: '#16a34a', fontFamily: 'DM Sans Light, sans-serif' }}>✓ {success}</p>}

            {/* ── Report injury form ── */}
            {showForm && (
                <div style={{ background: 'var(--topbar-accent-color)', border: '1.5px solid var(--content-input-border-color)', borderRadius: '10px', padding: '20px', marginBottom: '24px' }}>
                    <h3 style={{ fontFamily: 'Bebas, sans-serif', fontSize: '18px', letterSpacing: '1px', margin: '0 0 16px', color: 'var(--content-head-color)' }}>Report New Injury</h3>
                    <form onSubmit={handleSubmit}>
                        {/* Injury type and body part — side by side on desktop */}
                        <div style={{ display: 'flex', gap: '12px', flexDirection: isMobile ? 'column' : 'row' }}>
                            <div style={{ ...fieldStyle, flex: 1 }}>
                                <label style={labelStyle}>INJURY TYPE *</label>
                                <input type="text" value={injuryType} onChange={(e) => setInjuryType(e.target.value)}
                                    placeholder="e.g. Ankle Sprain, Muscle Strain"
                                    style={inputStyle} />
                            </div>
                            <div style={{ ...fieldStyle, flex: 1 }}>
                                <label style={labelStyle}>BODY PART *</label>
                                <input type="text" value={bodyPart} onChange={(e) => setBodyPart(e.target.value)}
                                    placeholder="e.g. Right Ankle, Left Knee"
                                    style={inputStyle} />
                            </div>
                        </div>

                        {/* Description */}
                        <div style={fieldStyle}>
                            <label style={labelStyle}>DESCRIPTION</label>
                            <textarea value={description} onChange={(e) => setDescription(e.target.value)}
                                placeholder="Describe what happened and how it feels..."
                                rows={3}
                                style={{ ...inputStyle, resize: 'vertical', lineHeight: '1.5' }} />
                        </div>

                        {/* Severity and date — side by side on desktop */}
                        <div style={{ display: 'flex', gap: '12px', flexDirection: isMobile ? 'column' : 'row' }}>
                            <div style={{ ...fieldStyle, flex: 1 }}>
                                <label style={labelStyle}>SEVERITY *</label>
                                <select value={severity} onChange={(e) => setSeverity(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                                    <option value="mild">Mild</option>
                                    <option value="moderate">Moderate</option>
                                    <option value="severe">Severe</option>
                                </select>
                            </div>
                            <div style={{ ...fieldStyle, flex: 1 }}>
                                <label style={labelStyle}>DATE OCCURRED *</label>
                                <input type="date" value={dateOccurred} onChange={(e) => setDateOccurred(e.target.value)} style={inputStyle} />
                            </div>
                        </div>

                        {error && <p style={{ margin: '0 0 12px', fontSize: '13px', color: '#DC2626', fontFamily: 'DM Sans Light, sans-serif' }}>{error}</p>}

                        <div style={{ display: 'flex', gap: '10px', flexDirection: isMobile ? 'column' : 'row' }}>
                            <button type="submit" disabled={saving}
                                style={{ padding: '10px 24px', background: 'var(--accent-color)', color: '#fff', border: 'none', borderRadius: '8px', fontFamily: 'Bebas, sans-serif', fontSize: '16px', letterSpacing: '2px', cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>
                                {saving ? 'SUBMITTING...' : 'SUBMIT REPORT'}
                            </button>
                            <button type="button" onClick={() => { setShowForm(false); setError(''); }}
                                style={{ padding: '10px 24px', background: 'transparent', color: 'var(--content-subhead-color)', border: '2px solid var(--content-input-border-color)', borderRadius: '8px', fontFamily: 'Bebas, sans-serif', fontSize: '16px', letterSpacing: '2px', cursor: 'pointer' }}>
                                CANCEL
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* ── Injury history list ── */}
            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
                    <div style={{ width: '28px', height: '28px', border: '3px solid #DDDBD6', borderTop: '3px solid #C8714E', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                </div>
            ) : injuries.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                    <p style={{ fontFamily: 'DM Sans Light, sans-serif', fontSize: '14px', color: 'var(--content-subhead-color)' }}>No injuries reported yet.</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {injuries.map((injury) => (
                        <div key={injury.id} style={{ background: 'var(--content-bg-color)', border: '1.5px solid var(--content-input-border-color)', borderRadius: '10px', padding: '16px' }}>
                            {/* Injury header */}
                            <p style={{ margin: '0 0 4px', fontFamily: 'DM Sans Light, sans-serif', fontSize: '14px', fontWeight: '600', color: 'var(--content-head-color)' }}>
                                {injury.injury_type} — {injury.body_part}
                            </p>
                            <p style={{ margin: '0 0 8px', fontFamily: 'DM Mono Light, sans-serif', fontSize: '11px', color: 'var(--content-subhead-color)' }}>
                                {new Date(injury.date_occurred).toLocaleDateString('en-AU')}
                            </p>
                            {/* Severity and status badges */}
                            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '10px' }}>
                                <span style={{ ...badgeStyle, ...severityStyle(injury.severity) }}>{injury.severity}</span>
                                <span style={{ ...badgeStyle, ...statusStyle(injury.status) }}>{injury.status}</span>
                            </div>

                            {/* Player's description */}
                            {injury.description && (
                                <p style={{ margin: '0 0 10px', fontFamily: 'DM Sans Light, sans-serif', fontSize: '13px', color: 'var(--content-subhead-color)', lineHeight: '1.5' }}>
                                    {injury.description}
                                </p>
                            )}

                            {/* Coach notes — shown if coach has added them */}
                            {injury.coach_notes && (
                                <div style={{ background: '#FFF3EB', border: '1.5px solid #EC7842', borderRadius: '8px', padding: '10px 12px', marginBottom: '8px' }}>
                                    <p style={{ margin: '0 0 2px', fontFamily: 'DM Mono Light, sans-serif', fontSize: '10px', color: '#C8714E', letterSpacing: '1px', textTransform: 'uppercase' }}>Coach Notes</p>
                                    <p style={{ margin: 0, fontFamily: 'DM Sans Light, sans-serif', fontSize: '13px', color: '#7C3A1A' }}>{injury.coach_notes}</p>
                                </div>
                            )}

                            {/* Training restriction — shown if coach has set one */}
                            {injury.training_restriction && (
                                <div style={{ background: '#FEF2F2', border: '1.5px solid #FCA5A5', borderRadius: '8px', padding: '10px 12px' }}>
                                    <p style={{ margin: '0 0 2px', fontFamily: 'DM Mono Light, sans-serif', fontSize: '10px', color: '#DC2626', letterSpacing: '1px', textTransform: 'uppercase' }}>Training Restriction</p>
                                    <p style={{ margin: 0, fontFamily: 'DM Sans Light, sans-serif', fontSize: '13px', color: '#B91C1C' }}>{injury.training_restriction}</p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// ── DELETE ACCOUNT SECTION ────────────────────────────────────────────────────
function DeleteAccount() {
    const navigate = useNavigate();
    const width = useWindowWidth();
    const isMobile = width < 768;

    const [confirm, setConfirm]   = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [error, setError]       = useState('');
    const [typed, setTyped]       = useState('');

    const handleDelete = async () => {
        setError('');
        if (typed !== 'DELETE') { setError('Please type DELETE to confirm.'); return; }
        setDeleting(true);

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { navigate('/Login'); return; }

        const { error } = await supabase.functions.invoke('hyper-responder', {
            body: { userId: user.id }
        });

        if (error) { setError('Failed to delete account. Please try again.'); setDeleting(false); return; }

        await supabase.auth.signOut();
        navigate('/Login');
    };

    return (
        <div>
            <h2 style={{ fontFamily: 'Bebas, sans-serif', fontSize: isMobile ? '20px' : '22px', letterSpacing: '1px', margin: '0 0 4px', color: 'var(--content-head-color)' }}>Delete Account</h2>
            <p style={{ fontFamily: 'DM Sans Light, sans-serif', fontSize: '13px', color: 'var(--content-subhead-color)', margin: '0 0 20px' }}>
                Permanently delete your account and all associated data.
            </p>

            <div style={{ background: '#FEF2F2', border: '1.5px solid #FCA5A5', borderRadius: '8px', padding: '16px', marginBottom: '24px' }}>
                <p style={{ margin: '0 0 8px', fontFamily: 'DM Sans Light, sans-serif', fontSize: '14px', color: '#991B1B', fontWeight: '600' }}>This action cannot be undone.</p>
                <p style={{ margin: 0, fontFamily: 'DM Sans Light, sans-serif', fontSize: '13px', color: '#B91C1C' }}>
                    Your account will be permanently deleted. You will lose access to all your data including sessions, feedback, and performance records.
                </p>
            </div>

            {!confirm ? (
                <button onClick={() => setConfirm(true)}
                    style={{ width: isMobile ? '100%' : 'auto', padding: '12px 28px', background: '#DC2626', color: '#fff', border: 'none', borderRadius: '8px', fontFamily: 'Bebas, sans-serif', fontSize: '18px', letterSpacing: '2px', cursor: 'pointer' }}>
                    DELETE ACCOUNT
                </button>
            ) : (
                <div>
                    <p style={{ fontFamily: 'DM Sans Light, sans-serif', fontSize: '14px', color: 'var(--content-head-color)', marginBottom: '12px' }}>
                        Type <strong>DELETE</strong> below to confirm:
                    </p>
                    <input type="text" value={typed} onChange={(e) => setTyped(e.target.value)} placeholder="DELETE"
                        style={{ width: '100%', padding: '10px 12px', fontSize: isMobile ? '16px' : '14px', fontFamily: 'DM Mono Light, sans-serif', border: '2px solid #FCA5A5', borderRadius: '8px', outline: 'none', boxSizing: 'border-box', color: '#000', background: '#fff', marginBottom: '12px' }} />
                    {error && <p style={{ margin: '0 0 12px', fontSize: '13px', color: '#DC2626', fontFamily: 'DM Sans Light, sans-serif' }}>{error}</p>}
                    <div style={{ display: 'flex', gap: '10px', flexDirection: isMobile ? 'column' : 'row' }}>
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
export default function AccountSettings() {
    const [activeSection, setActiveSection] = useState('details');
    const [sidebarOpen, setSidebarOpen]     = useState(false);
    const [userRole, setUserRole]           = useState('');
    const width = useWindowWidth();
    const isMobile = width < 768;

    // Fetch role to conditionally show the injuries nav item (players only)
    useEffect(() => {
        supabase.auth.getUser().then(({ data: { user } }) => {
            setUserRole(user?.user_metadata?.role || '');
        });
    }, []);

    const navItems = [
        { id: 'details', label: 'Change Details', icon: (
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
        )},
        ...(userRole === 'player' ? [{ id: 'injuries', label: 'My Injuries', icon: (
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
        )}] : []),
        { id: 'delete', label: 'Delete Account', icon: (
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
        )},
    ];

    const activeName = navItems.find(i => i.id === activeSection)?.label;

    const sidebarContent = (
        <>
            {navItems.map((item, i) => (
                <div key={item.id}
                    onClick={() => { setActiveSection(item.id); setSidebarOpen(false); }}
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
        </>
    );

    return (
        <div className="dashboardPage">
            <div className="dashboardHeader" style={{ marginBottom: '24px' }}>
                <div>
                    <h2 className="content-header" style={{ padding: 0, marginBottom: '4px' }}>Account Settings</h2>
                    <p style={{ fontFamily: "'DM Sans Light', sans-serif", fontSize: '13px', color: 'var(--content-subhead-color)' }}>
                        Manage your profile and account.
                    </p>
                </div>
            </div>

            {/* Mobile dropdown nav */}
            {isMobile && (
                <div style={{ marginBottom: '16px' }}>
                    <div onClick={() => setSidebarOpen(!sidebarOpen)}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'var(--content-bg-color)', border: '1px solid var(--content-input-border-color)', borderRadius: sidebarOpen ? '10px 10px 0 0' : '10px', cursor: 'pointer', fontFamily: 'DM Sans Light, sans-serif', fontSize: '13px', color: 'var(--content-head-color)' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            {navItems.find(i => i.id === activeSection)?.icon}
                            {activeName}
                        </span>
                        <span style={{ fontSize: '12px', color: 'var(--content-subhead-color)' }}>{sidebarOpen ? '▲' : '▼'}</span>
                    </div>
                    {sidebarOpen && (
                        <div style={{ background: 'var(--content-bg-color)', border: '1px solid var(--content-input-border-color)', borderTop: 'none', borderRadius: '0 0 10px 10px', overflow: 'hidden' }}>
                            {sidebarContent}
                        </div>
                    )}
                </div>
            )}

            <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
                {/* Desktop sidebar */}
                {!isMobile && (
                    <div style={{ width: '200px', flexShrink: 0, background: 'var(--content-bg-color)', border: '1px solid var(--content-input-border-color)', borderRadius: '10px', overflow: 'hidden' }}>
                        {sidebarContent}
                    </div>
                )}

                {/* Content area */}
                <div style={{ flex: 1, background: 'var(--content-bg-color)', border: '1px solid var(--content-input-border-color)', borderRadius: '10px', padding: isMobile ? '16px' : '24px' }}>
                    {activeSection === 'details'  && <ChangeDetails />}
                    {activeSection === 'injuries' && <MyInjuries />}
                    {activeSection === 'delete'   && <DeleteAccount />}
                </div>
            </div>
        </div>
    );
}