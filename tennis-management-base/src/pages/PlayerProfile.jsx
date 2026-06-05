import { DRILL_TYPE_GRAPH, EXERTION_GRAPH, NUM_DRILLS_GRAPH } from "../Components/LoadTrackingComponents";
import { supabase } from '../supabaseClient';
import { LOADING_OVERLAY, TYPING_INPUT } from '../Components/SharedComponents';
import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";

import '../App.css';
import './PlayerProfile.css';

// ── DELETE PLAYER CONFIRMATION MODAL ─────────────────────────────────────────
export function DELETE_CONFIRM({ deleteRef, setShowDelete, selectedPlayer, deletePlayer, isDeleting }) {
    const playerName = selectedPlayer
        ? `${selectedPlayer.first_name} ${selectedPlayer.last_name}`
        : 'this player';

    return (
        <div id="drill-modal-overlay"
            onClick={(e) => { if (deleteRef.current && !deleteRef.current.contains(e.target)) setShowDelete(false); }}>
            <div className="drill-modal" ref={deleteRef}>
                <div className="drill-modal-header">
                    <span className="drill-modal-title">Delete Player</span>
                    <button className="drill-icon-btn" onClick={() => setShowDelete(false)} style={{ border: 'none', background: 'transparent' }}>
                        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <div className="drill-modal-body">
                    <div className="drill-delete-title">Delete "{playerName}"?</div>
                    <div className="drill-delete-body">This player and all their associated data will be permanently removed.</div>
                </div>
                <div className="drill-modal-footer">
                    <button className="drill-btn drill-btn-danger-solid" onClick={deletePlayer} disabled={isDeleting}>
                        {isDeleting ? 'Deleting...' : 'Delete Player'}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── ADD STRENGTH / WEAKNESS MODAL ─────────────────────────────────────────────
export function ADD_STRENGTH_WEAKNESS({ modalRef, setShowModal, type, onAdd, isSaving }) {
    const [value, setValue] = useState("");

    function handleAdd() {
        const trimmed = value.trim();
        if (!trimmed) return;
        onAdd(trimmed);
        setValue("");
    }

    return (
        <div id="drill-modal-overlay"
            onClick={(e) => { if (modalRef.current && !modalRef.current.contains(e.target)) setShowModal(false); }}>
            <div className="drill-modal" ref={modalRef}>
                <div className="drill-modal-header">
                    <span className="drill-modal-title">Add {type === "strength" ? "Strength" : "Weakness"}</span>
                    <button className="drill-icon-btn" onClick={() => setShowModal(false)} style={{ border: "none", background: "transparent" }}>
                        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <div className="drill-modal-body">
                    <TYPING_INPUT
                        label={type === 'strength' ? 'STRENGTH *' : 'WEAKNESS *'}
                        num_rows="1" input_id="strength-weakness"
                        box_w="100%" box_h="40px"
                        value={value} onChange={setValue}
                        maxLength={25} isNumber={false}
                    />
                </div>
                <div className="drill-modal-footer">
                    <button className="drill-btn drill-btn-primary" onClick={handleAdd} disabled={isSaving || !value.trim()}>
                        {isSaving ? "Saving..." : "Add"}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── PLAYER LIST ───────────────────────────────────────────────────────────────
function PLAYER_LIST({ players, setSelectedPlayer }) {
    return (
        <div className="player-list">
            {players.map((player) => (
                <PLAYER_CARD key={player.id} player={player} setSelectedPlayer={setSelectedPlayer} />
            ))}
        </div>
    );
}

// ── PLAYER CARD ───────────────────────────────────────────────────────────────
function PLAYER_CARD({ player, setSelectedPlayer }) {
    return (
        <div className="player-card">
            <div className="player-card-name">{player.first_name} {player.last_name}</div>
            <button className="drill-btn drill-btn-ghost" onClick={() => setSelectedPlayer(player)}>Details</button>
        </div>
    );
}

// ── INJURIES SECTION (coach view) ─────────────────────────────────────────────
// Coach can report new injuries on behalf of the player, manage existing ones,
// add notes, set training restrictions and update status.
function PLAYER_INJURIES({ player }) {
    const injurySectionRef = useRef(null);
    
    const [injuries, setInjuries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedId, setExpandedId] = useState(null);
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState('');

    // Manage existing injury fields
    const [editStatus, setEditStatus] = useState('');
    const [editCoachNotes, setEditCoachNotes] = useState('');
    const [editRestriction, setEditRestriction] = useState('');
    const [editRecovered, setEditRecovered] = useState('');

    // Report new injury fields (coach reporting on behalf of player)
    const [showReportForm, setShowReportForm] = useState(false);
    const [reportSaving, setReportSaving] = useState(false);
    const [reportError, setReportError] = useState('');
    const [reportType, setReportType] = useState('');
    const [reportBodyPart, setReportBodyPart] = useState('');
    const [reportDesc, setReportDesc] = useState('');
    const [reportSeverity, setReportSeverity] = useState('mild');
    const [reportDate, setReportDate] = useState('');

    useEffect(() => { fetchInjuries(); }, [player]);

    async function fetchInjuries() {
        setLoading(true);
        const { data, error } = await supabase
            .from('injuries')
            .select('*')
            .eq('player_id', player.id)
            .order('reported_at', { ascending: false });

        if (error) { console.log('Error fetching injuries:', error.message); }
        else { setInjuries(data || []); }
        setLoading(false);
    }

    // Pre-populate manage fields when opening an injury
    function openEdit(injury) {
        setExpandedId(injury.id);
        setEditStatus(injury.status || 'active');
        setEditCoachNotes(injury.coach_notes || '');
        setEditRestriction(injury.training_restriction || '');
        setEditRecovered(injury.date_recovered || '');
    }

    // Save coach updates to existing injury
    async function handleSave(injuryId) {
        setSaving(true);
        setSuccess('');

        const { error } = await supabase
            .from('injuries')
            .update({
                status: editStatus,
                coach_notes: editCoachNotes || null,
                training_restriction: editRestriction || null,
                date_recovered: editRecovered || null,
            })
            .eq('id', injuryId);

        if (error) { console.log('Error updating injury:', error.message); }
        else {
            setSuccess('Updated successfully.');
            setTimeout(() => setSuccess(''), 3000);
            setExpandedId(null);
            fetchInjuries();
        }
        setSaving(false);
    }

    // Coach reports a new injury on behalf of the player
    async function handleReport(e) {
        e.preventDefault();
        setReportError('');

        if (!reportType || !reportBodyPart || !reportDate) {
            setReportError('Please fill in injury type, body part and date occurred.');
            return;
        }
        setReportSaving(true);

        const { error } = await supabase
            .from('injuries')
            .insert({
                player_id: player.id,
                injury_type: reportType,
                body_part: reportBodyPart,
                description: reportDesc || null,
                severity: reportSeverity,
                date_occurred: reportDate,
                status: 'active',
            });

        if (error) { setReportError(error.message); setReportSaving(false); return; }

        // Reset form and reload injuries
        setReportType(''); setReportBodyPart(''); setReportDesc('');
        setReportSeverity('mild'); setReportDate('');
        setShowReportForm(false);
        setReportSaving(false);
        setSuccess('Injury reported successfully.');
        setTimeout(() => setSuccess(''), 3000);
        fetchInjuries();
    }

    // Badge styles
    const badgeStyle = {
        display: 'inline-flex', alignItems: 'center',
        padding: '2px 10px', borderRadius: '100px',
        fontFamily: 'DM Mono Light, sans-serif', fontSize: '10px',
        fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px',
    };

    function severityStyle(sev) {
        if (sev === 'severe') return { background: '#FEE2E2', color: '#DC2626', border: '1px solid #FCA5A5' };
        if (sev === 'moderate') return { background: '#FEF3C7', color: '#D97706', border: '1px solid #FCD34D' };
        return { background: '#DCFCE7', color: '#16A34A', border: '1px solid #86EFAC' };
    }

    function statusStyle(status) {
        if (status === 'recovered') return { background: '#DCFCE7', color: '#16A34A', border: '1px solid #86EFAC' };
        if (status === 'monitoring') return { background: '#FEF3C7', color: '#D97706', border: '1px solid #FCD34D' };
        return { background: '#FEE2E2', color: '#DC2626', border: '1px solid #FCA5A5' };
    }

    const inputStyle = {
        width: '100%', padding: '8px 12px', fontSize: '13px',
        fontFamily: 'DM Sans Light, sans-serif',
        border: '2px solid var(--content-input-border-color)',
        borderRadius: '8px', outline: 'none',
        boxSizing: 'border-box', color: '#000', background: '#fff',
    };
    const labelStyle = {
        fontFamily: 'DM Mono Light, sans-serif', fontSize: '11px',
        color: 'var(--content-subhead-color)', marginBottom: '4px', display: 'block',
        letterSpacing: '0.5px', textTransform: 'uppercase',
    };

    return (
        <div>
            {/* Section header with report button */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <h2 className="content-header" style={{ padding: 0, margin: 0 }}>Injury History</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {success && <p style={{ margin: 0, fontSize: '12px', color: '#16a34a', fontFamily: 'DM Sans Light, sans-serif' }}>✓ {success}</p>}
                    {!showReportForm && (
                        <button onClick={() => setShowReportForm(true)}
                            style={{ padding: '6px 14px', background: 'var(--accent-color)', color: '#fff', border: 'none', borderRadius: '6px', fontFamily: 'Bebas, sans-serif', fontSize: '14px', letterSpacing: '1.5px', cursor: 'pointer' }}>
                            + REPORT INJURY
                        </button>
                    )}
                </div>
            </div>

            {/* Report injury form — coach reporting on behalf of player */}
            {showReportForm && (
                <div style={{ background: 'var(--topbar-accent-color)', border: '1.5px solid var(--content-input-border-color)', borderRadius: '10px', padding: '16px', marginBottom: '16px' }}>
                    <h3 style={{ fontFamily: 'Bebas, sans-serif', fontSize: '16px', letterSpacing: '1px', margin: '0 0 14px', color: 'var(--content-head-color)' }}>
                        Report Injury for Player
                    </h3>
                    <form onSubmit={handleReport} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {/* Injury type and body part */}
                        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                            <div style={{ flex: 1, minWidth: '140px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <label style={labelStyle}>INJURY TYPE *</label>
                                <input type="text" value={reportType} onChange={(e) => setReportType(e.target.value)}
                                    placeholder="e.g. Ankle Sprain" style={inputStyle} />
                            </div>
                            <div style={{ flex: 1, minWidth: '140px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <label style={labelStyle}>BODY PART *</label>
                                <input type="text" value={reportBodyPart} onChange={(e) => setReportBodyPart(e.target.value)}
                                    placeholder="e.g. Right Ankle" style={inputStyle} />
                            </div>
                        </div>

                        {/* Description */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <label style={labelStyle}>DESCRIPTION</label>
                            <textarea value={reportDesc} onChange={(e) => setReportDesc(e.target.value)}
                                placeholder="Describe the injury..." rows={2}
                                style={{ ...inputStyle, resize: 'vertical', lineHeight: '1.5' }} />
                        </div>

                        {/* Severity and date */}
                        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                            <div style={{ flex: 1, minWidth: '140px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <label style={labelStyle}>SEVERITY *</label>
                                <select value={reportSeverity} onChange={(e) => setReportSeverity(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                                    <option value="mild">Mild</option>
                                    <option value="moderate">Moderate</option>
                                    <option value="severe">Severe</option>
                                </select>
                            </div>
                            <div style={{ flex: 1, minWidth: '140px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <label style={labelStyle}>DATE OCCURRED *</label>
                                <input type="date" value={reportDate} onChange={(e) => setReportDate(e.target.value)} style={inputStyle} />
                            </div>
                        </div>

                        {reportError && <p style={{ margin: 0, fontSize: '12px', color: '#DC2626', fontFamily: 'DM Sans Light, sans-serif' }}>{reportError}</p>}

                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button type="submit" disabled={reportSaving}
                                style={{ padding: '8px 20px', background: 'var(--accent-color)', color: '#fff', border: 'none', borderRadius: '8px', fontFamily: 'Bebas, sans-serif', fontSize: '14px', letterSpacing: '1.5px', cursor: 'pointer', opacity: reportSaving ? 0.7 : 1 }}>
                                {reportSaving ? 'SUBMITTING...' : 'SUBMIT'}
                            </button>
                            <button type="button" onClick={() => { setShowReportForm(false); setReportError(''); }}
                                style={{ padding: '8px 20px', background: 'transparent', color: 'var(--content-subhead-color)', border: '2px solid var(--content-input-border-color)', borderRadius: '8px', fontFamily: 'Bebas, sans-serif', fontSize: '14px', letterSpacing: '1.5px', cursor: 'pointer' }}>
                                CANCEL
                            </button>
                        </div>
                    </form>
                </div>
            )}
            <div ref={injurySectionRef}>
                {/* Injury list */}
                {loading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '30px 0' }}>
                        <div style={{ width: '24px', height: '24px', border: '3px solid #DDDBD6', borderTop: '3px solid #C8714E', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                    </div>
                ) : injuries.length === 0 ? (
                    <p style={{ fontFamily: 'DM Sans Light, sans-serif', fontSize: '13px', color: 'var(--content-subhead-color)', padding: '20px 0' }}>
                        No injuries reported for this player.
                    </p>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {injuries.map((injury) => (
                            <div key={injury.id} style={{ border: '1.5px solid var(--content-input-border-color)', borderRadius: '10px', overflow: 'hidden' }}>
                                {/* Injury summary row */}
                                <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap', background: 'var(--content-bg-color)' }}>
                                    <div style={{ flex: 1 }}>
                                        <p style={{ margin: '0 0 4px', fontFamily: 'DM Sans Light, sans-serif', fontSize: '14px', fontWeight: '600', color: 'var(--content-head-color)' }}>
                                            {injury.injury_type} — {injury.body_part}
                                        </p>
                                        <p style={{ margin: '0 0 8px', fontFamily: 'DM Mono Light, sans-serif', fontSize: '11px', color: 'var(--content-subhead-color)' }}>
                                            Reported: {new Date(injury.reported_at).toLocaleDateString('en-AU')} · Occurred: {new Date(injury.date_occurred).toLocaleDateString('en-AU')}
                                        </p>
                                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                            <span style={{ ...badgeStyle, ...severityStyle(injury.severity) }}>{injury.severity}</span>
                                            <span style={{ ...badgeStyle, ...statusStyle(injury.status) }}>{injury.status}</span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => expandedId === injury.id ? setExpandedId(null) : openEdit(injury)}
                                        style={{ padding: '6px 14px', background: expandedId === injury.id ? 'var(--topbar-accent-color)' : 'var(--accent-color)', color: expandedId === injury.id ? 'var(--content-subhead-color)' : '#fff', border: 'none', borderRadius: '6px', fontFamily: 'DM Mono Light, sans-serif', fontSize: '11px', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                                        {expandedId === injury.id ? 'Cancel' : 'Manage'}
                                    </button>
                                </div>

                                {/* Player description */}
                                {injury.description && (
                                    <div style={{ padding: '0 16px 12px', background: 'var(--content-bg-color)' }}>
                                        <p style={{ margin: 0, fontFamily: 'DM Sans Light, sans-serif', fontSize: '13px', color: 'var(--content-subhead-color)', lineHeight: '1.5' }}>{injury.description}</p>
                                    </div>
                                )}

                                {/* Existing coach notes / restriction preview */}
                                {(injury.coach_notes || injury.training_restriction) && expandedId !== injury.id && (
                                    <div style={{ padding: '0 16px 12px', background: 'var(--content-bg-color)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                        {injury.coach_notes && (
                                            <div style={{ background: '#FFF3EB', border: '1.5px solid #EC7842', borderRadius: '6px', padding: '8px 12px' }}>
                                                <p style={{ margin: '0 0 2px', fontFamily: 'DM Mono Light, sans-serif', fontSize: '10px', color: '#C8714E', letterSpacing: '1px', textTransform: 'uppercase' }}>Your Notes</p>
                                                <p style={{ margin: 0, fontFamily: 'DM Sans Light, sans-serif', fontSize: '12px', color: '#7C3A1A' }}>{injury.coach_notes}</p>
                                            </div>
                                        )}
                                        {injury.training_restriction && (
                                            <div style={{ background: '#FEF2F2', border: '1.5px solid #FCA5A5', borderRadius: '6px', padding: '8px 12px' }}>
                                                <p style={{ margin: '0 0 2px', fontFamily: 'DM Mono Light, sans-serif', fontSize: '10px', color: '#DC2626', letterSpacing: '1px', textTransform: 'uppercase' }}>Training Restriction</p>
                                                <p style={{ margin: 0, fontFamily: 'DM Sans Light, sans-serif', fontSize: '12px', color: '#B91C1C' }}>{injury.training_restriction}</p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Coach management panel */}
                                {expandedId === injury.id && (
                                    <div style={{ padding: '16px', background: 'var(--topbar-accent-color)', borderTop: '1.5px solid var(--content-input-border-color)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                                            <div style={{ flex: 1, minWidth: '140px' }}>
                                                <label style={labelStyle}>Status</label>
                                                <select value={editStatus} onChange={(e) => setEditStatus(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                                                    <option value="active">Active</option>
                                                    <option value="monitoring">Monitoring</option>
                                                    <option value="recovered">Recovered</option>
                                                </select>
                                            </div>
                                            <div style={{ flex: 1, minWidth: '140px' }}>
                                                <label style={labelStyle}>Date Recovered</label>
                                                <input type="date" value={editRecovered} onChange={(e) => setEditRecovered(e.target.value)} style={inputStyle} />
                                            </div>
                                        </div>
                                        <div>
                                            <label style={labelStyle}>Coach Notes</label>
                                            <textarea value={editCoachNotes} onChange={(e) => setEditCoachNotes(e.target.value)}
                                                placeholder="Add your assessment or comments..."
                                                rows={3} style={{ ...inputStyle, resize: 'vertical', lineHeight: '1.5' }} />
                                        </div>
                                        <div>
                                            <label style={labelStyle}>Training Restriction</label>
                                            <input type="text" value={editRestriction} onChange={(e) => setEditRestriction(e.target.value)}
                                                placeholder="e.g. No sprint drills. Limited movement only."
                                                style={inputStyle} />
                                        </div>
                                        <button onClick={() => handleSave(injury.id)} disabled={saving}
                                            style={{ alignSelf: 'flex-start', padding: '8px 20px', background: 'var(--accent-color)', color: '#fff', border: 'none', borderRadius: '8px', fontFamily: 'Bebas, sans-serif', fontSize: '16px', letterSpacing: '2px', cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>
                                            {saving ? 'SAVING...' : 'SAVE CHANGES'}
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

// ── PLAYER DETAILS VIEW ───────────────────────────────────────────────────────
function PLAYER_DETAILS({ player, playerDetails, setSelectedPlayer, setShowDeleteConfirm, setPlayerDetails, setShowAddModal, setAddType }) {
    if (!playerDetails) return null;

    const name = `${player.first_name} ${player.last_name}`;
    const strengths = playerDetails.strengths;
    const weaknesses = playerDetails.weaknesses;

    async function deleteStrength(index) {
        if (!player || !playerDetails) return;
        const newStrengths = playerDetails.strengths.filter((_, i) => i !== index);
        const { error } = await supabase.from('player_details').update({ strengths: newStrengths }).eq('id', player.id);
        if (error) { console.log("Error deleting strength:", error.message); return; }
        setPlayerDetails({ ...playerDetails, strengths: newStrengths });
    }

    async function deleteWeakness(index) {
        if (!player || !playerDetails) return;
        const newWeaknesses = playerDetails.weaknesses.filter((_, i) => i !== index);
        const { error } = await supabase.from('player_details').update({ weaknesses: newWeaknesses }).eq('id', player.id);
        if (error) { console.log("Error deleting weakness:", error.message); return; }
        setPlayerDetails({ ...playerDetails, weaknesses: newWeaknesses });
    }

    return (
        <div id="player-details-page">
            <div id="player-details-back">
                <button className="drill-btn drill-btn-ghost" onClick={() => setSelectedPlayer(null)}>
                    <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
                    </svg>
                    Back to List
                </button>
            </div>

            <div id="player-details-name-container">
                <div id="player-details-name">{name}</div>
                <button className="drill-btn drill-btn-danger" onClick={() => setShowDeleteConfirm(true)}>
                    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                    </svg>
                    Delete Player
                </button>
            </div>

            <div id="player-strength-weakness">
                <div className="strength-weakness-box">
                    <div className="top-container">
                        <h2 className="content-header">Player Strengths</h2>
                        {strengths.length < 5 && (
                            <button className="drill-btn drill-btn-primary" onClick={() => { setAddType("strength"); setShowAddModal(true); }}>
                                <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
                                </svg>
                            </button>
                        )}
                    </div>
                    <div className="tagList">
                        {strengths.length > 0 ? (
                            strengths.map((item, i) => (
                                <span className="positiveTag" key={i}>
                                    {item}
                                    <button className="drill-btn drill-btn-ghost" onClick={() => deleteStrength(i)}>
                                        <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </span>
                            ))
                        ) : <p className="strength-weakness-empty">No strengths added.</p>}
                    </div>
                </div>

                <div className="strength-weakness-box">
                    <div className="top-container">
                        <h2 className="content-header">Player Weaknesses</h2>
                        {weaknesses.length < 5 && (
                            <button className="drill-btn drill-btn-primary" onClick={() => { setAddType("weakness"); setShowAddModal(true); }}>
                                <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
                                </svg>
                            </button>
                        )}
                    </div>
                    <div className="tagList">
                        {weaknesses.length > 0 ? (
                            weaknesses.map((item, i) => (
                                <span className="warningTag" key={i}>
                                    {item}
                                    <button className="drill-btn drill-btn-ghost" onClick={() => deleteWeakness(i)}>
                                        <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </span>
                            ))
                        ) : <p className="strength-weakness-empty">No weakness added.</p>}
                    </div>
                </div>
            </div>

            {/* Injuries section */}
            <div style={{ marginTop: '24px', background: 'var(--content-bg-color)', border: '2px solid var(--topbar-accent-color)', borderRadius: '8px', padding: '16px' }}>
                <PLAYER_INJURIES player={player}  />
            </div>
        </div>
    );
}

// ── MAIN PLAYER PROFILE PAGE ──────────────────────────────────────────────────
export default function PlayerProfile() {
    const location = useLocation();

    const selectedPlayerId = location.state?.playerId;
    const openSection = location.state?.openSection;

    const [isDataLoading, setIsDataLoading] = useState(false);
    const [players, setPlayers] = useState([]);
    const [selectedPlayer, setSelectedPlayer] = useState(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const deleteConfirmRef = useRef(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [addType, setAddType] = useState("strength");
    const [isSaving, setIsSaving] = useState(false);
    const addModalRef = useRef(null);
    const [playerDetails, setPlayerDetails] = useState(null);

    async function addStrengthWeakness(value) {
        if (!playerDetails) return;
        setIsSaving(true);
        const field = addType === "strength" ? "strengths" : "weaknesses";
        const updatedArray = [...(playerDetails[field] || []), value];
        const { error } = await supabase.from("player_details").update({ [field]: updatedArray }).eq("id", selectedPlayer.id);
        if (error) { console.log(error.message); }
        else { setPlayerDetails(prev => ({ ...prev, [field]: updatedArray })); setShowAddModal(false); }
        setIsSaving(false);
    }

    async function deletePlayer() {
        if (!selectedPlayer) return;
        setIsDeleting(true);
        const { error } = await supabase.functions.invoke('hyper-responder', { body: { userId: selectedPlayer.id } });
        if (error) { console.log("Error deleting player:", error.message); setIsDeleting(false); return; }
        setIsDeleting(false);
        setShowDeleteConfirm(false);
        setSelectedPlayer(null);
        fetchPlayers();
    }

    async function fetchPlayers() {
        const { data, error } = await supabase.from('signin_details').select('*').eq('role', 'player');
        if (error) { console.log("Error when fetching players: ", error.message); setPlayers([]); }
        else { setPlayers(data); }
    }

    async function fetchSelectedPlayer(player) {
        if (!player) return;
        setIsDataLoading(true);
        const { data, error } = await supabase.from('player_details').select('*').eq('id', player.id).maybeSingle();
        if (error) { console.log("Error fetching player details: ", error.message); setPlayerDetails(null); }
        else { setPlayerDetails(data); }
        setIsDataLoading(false);
    }

    useEffect(() => {
        if (selectedPlayer) { fetchSelectedPlayer(selectedPlayer); }
        else { setPlayerDetails(null); }
    }, [selectedPlayer]);

    useEffect(() => { fetchPlayers(); }, []);

    useEffect(() => {
        if (!selectedPlayerId || players.length === 0) return;

        const chosenPlayer = players.find(p => p.id === selectedPlayerId);

        if (chosenPlayer) {
            setSelectedPlayer(chosenPlayer);
        }
    }, [selectedPlayerId, players]);

    return (
        <>
            {isDataLoading && <LOADING_OVERLAY caption={"session data"} />}

            {showDeleteConfirm && selectedPlayer && (
                <DELETE_CONFIRM
                    deleteRef={deleteConfirmRef}
                    setShowDelete={setShowDeleteConfirm}
                    selectedPlayer={selectedPlayer}
                    deletePlayer={deletePlayer}
                    isDeleting={isDeleting}
                />
            )}

            {showAddModal && selectedPlayer && (
                <ADD_STRENGTH_WEAKNESS
                    modalRef={addModalRef}
                    setShowModal={setShowAddModal}
                    type={addType}
                    onAdd={addStrengthWeakness}
                    isSaving={isSaving}
                />
            )}

            <div id="player-profile-page">
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <div>
                        <h2 className="content-header" style={{ padding: 0, marginBottom: '4px' }}>Player Profile</h2>
                        <p style={{ fontFamily: "'DM Sans Light', sans-serif", fontSize: '13px', color: 'var(--content-subhead-color)' }}>
                            View and edit player profiles.
                        </p>
                    </div>
                </div>

                <div id="player-profile-main">
                    {!selectedPlayer ? (
                        <div id="player-list-container">
                            <PLAYER_LIST players={players || []} setSelectedPlayer={setSelectedPlayer} />
                        </div>
                    ) : (
                        <PLAYER_DETAILS
                            player={selectedPlayer}
                            playerDetails={playerDetails}
                            setSelectedPlayer={setSelectedPlayer}
                            setShowDeleteConfirm={setShowDeleteConfirm}
                            setPlayerDetails={setPlayerDetails}
                            setShowAddModal={setShowAddModal}
                            setAddType={setAddType}
                        />
                    )}
                </div>
            </div>
        </>
    );
}