import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import '../App.css';

export default function AccountSettings() {
    const navigate = useNavigate();

    const [loading, setLoading]   = useState(true);
    const [saving, setSaving]     = useState(false);
    const [success, setSuccess]   = useState(false);
    const [error, setError]       = useState('');

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

            // Get from user_metadata first
            setEmail(user.email || '');
            setFirstName(user.user_metadata?.first_name || '');
            setLastName(user.user_metadata?.last_name   || '');
            setRole(user.user_metadata?.role            || '');

            // Get dob and gender from signin_details
            const { data } = await supabase
                .from('signin_details')
                .select('dob, gender, first_name, last_name')
                .eq('id', user.id)
                .single();

            if (data) {
                setDob(data.dob     || '');
                setGender(data.gender || '');
                // Use signin_details name if available
                if (data.first_name) setFirstName(data.first_name);
                if (data.last_name)  setLastName(data.last_name);
            }

            setLoading(false);
        };
        load();
    }, []);

    const handleSave = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess(false);

        if (!firstName || !lastName) { setError('First and last name are required.'); return; }

        setSaving(true);

        // Update signin_details table
        const { error: dbError } = await supabase
            .from('signin_details')
            .update({
                first_name: firstName,
                last_name:  lastName,
                dob:        dob    || null,
                gender:     gender || null,
            })
            .eq('id', (await supabase.auth.getUser()).data.user.id);

        if (dbError) { setError(dbError.message); setSaving(false); return; }

        // Also update user_metadata so sidebar name reflects change immediately
        await supabase.auth.updateUser({
            data: { first_name: firstName, last_name: lastName },
        });

        setSaving(false);
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
    };

    const inputStyle = {
        width: '100%', padding: '10px 12px', fontSize: '14px',
        fontFamily: 'DM Sans Light, sans-serif',
        border: '2px solid var(--content-input-border-color)',
        borderRadius: '8px', outline: 'none',
        boxSizing: 'border-box', color: '#000', background: '#fff',
    };

    const labelStyle = {
        fontFamily: 'DM Mono Light, sans-serif',
        fontSize: '12px', color: 'var(--content-subhead-color)',
        marginBottom: '6px', display: 'block',
    };

    const fieldStyle = {
        display: 'flex', flexDirection: 'column', marginBottom: '16px',
    };

    if (loading) {
        return (
            <div className="dashboardPage" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '300px' }}>
                <div className="loading-overlay-spinner" style={{ width: '36px', height: '36px', borderWidth: '4px' }} />
            </div>
        );
    }

    return (
        <div className="dashboardPage">
            {/* Header */}
            <div className="dashboardHeader" style={{ marginBottom: '24px' }}>
                <div>
                    <p className="dashboardLabel">PROFILE</p>
                    <h1 className="dashboardTitle">Account Settings</h1>
                </div>
            </div>

            <div style={{ maxWidth: '600px' }}>
                <div className="content-box" style={{ padding: '24px' }}>

                    {/* Role badge */}
                    <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: '6px',
                        background: 'var(--topbar-accent-color)',
                        border: '1.5px solid var(--content-input-border-color)',
                        borderRadius: '20px', padding: '4px 12px',
                        marginBottom: '24px',
                    }}>
                        <span style={{ fontFamily: 'DM Mono Light, sans-serif', fontSize: '11px', color: 'var(--content-subhead-color)', letterSpacing: '1px', textTransform: 'uppercase' }}>
                            {role}
                        </span>
                    </div>

                    <form onSubmit={handleSave}>

                        {/* Name row */}
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

                        {/* Email — read only */}
                        <div style={fieldStyle}>
                            <label style={labelStyle}>EMAIL</label>
                            <input type="email" value={email} disabled
                                style={{ ...inputStyle, background: 'var(--topbar-accent-color)', color: 'var(--content-subhead-color)', cursor: 'not-allowed' }} />
                            <span style={{ fontSize: '11px', color: 'var(--content-subhead-color)', fontFamily: 'DM Sans Light, sans-serif', marginTop: '4px' }}>
                                Email cannot be changed here.
                            </span>
                        </div>

                        {/* DOB */}
                        <div style={fieldStyle}>
                            <label style={labelStyle}>DATE OF BIRTH</label>
                            <input type="date" value={dob} onChange={(e) => setDob(e.target.value)} style={inputStyle} />
                        </div>

                        {/* Gender */}
                        <div style={fieldStyle}>
                            <label style={labelStyle}>GENDER</label>
                            <select value={gender} onChange={(e) => setGender(e.target.value)}
                                style={{ ...inputStyle, cursor: 'pointer' }}>
                                <option value="">Prefer not to say</option>
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                                <option value="non-binary">Non-binary</option>
                                <option value="other">Other</option>
                            </select>
                        </div>

                        {/* Error / Success */}
                        {error && (
                            <p style={{ margin: '0 0 12px', fontSize: '13px', color: 'var(--danger-body-color)', fontFamily: 'DM Sans Light, sans-serif' }}>
                                {error}
                            </p>
                        )}
                        {success && (
                            <p style={{ margin: '0 0 12px', fontSize: '13px', color: '#16a34a', fontFamily: 'DM Sans Light, sans-serif' }}>
                                ✓ Profile updated successfully.
                            </p>
                        )}

                        {/* Save button */}
                        <button type="submit" disabled={saving}
                            style={{
                                padding: '12px 28px',
                                background: 'var(--accent-color)', color: '#fff',
                                border: 'none', borderRadius: '8px',
                                fontFamily: 'Bebas, sans-serif', fontSize: '18px',
                                letterSpacing: '2px', cursor: 'pointer',
                                opacity: saving ? 0.7 : 1,
                            }}>
                            {saving ? 'SAVING...' : 'SAVE CHANGES'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
