import { useState, useRef, useEffect } from 'react';
import '../App.css';
import './DrillLibrary.css';
import { supabase } from '../supabaseClient';
import { LOADING_OVERLAY } from '../Components/SharedComponents';

// ── CONSTANTS ─────────────────────────────────────────────────────────────────
const DIFFICULTY_LEVELS = ['Beginner', 'Intermediate', 'Advanced', 'Elite'];
const ATTRIBUTES = ['Speed', 'Agility', 'Technique', 'Strength', 'Fitness', 'Endurance'];
const FILTERS = ['All', 'Speed', 'Agility', 'Technique', 'Strength', 'Fitness', 'Endurance'];

const EMPTY_FORM = {
    name: '',
    type: '',
    duration_mins: '',
    description: '',
    notes: '',
    level: 'Intermediate',
};

// ── STAR COMPONENT ────────────────────────────────────────────────────────────
function Stars({ level, size = '' }) {
    const levelMap = { Beginner: 1, Intermediate: 2, Advanced: 3, Elite: 5 };
    const filled = levelMap[level] ?? 2;
    return (
        <div className={`drill-stars ${size}`}>
            {[1, 2, 3, 4, 5].map(i => (
                <svg
                    key={i}
                    className={`drill-star ${i <= filled ? 'filled' : 'empty'}`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
            ))}
        </div>
    );
}

// ── TYPE BADGE ────────────────────────────────────────────────────────────────
function TypeBadge({ type }) {
    if (!type) return null;
    return (
        <span className={`drill-type-badge badge-${type.toLowerCase()}`}>
            {type}
        </span>
    );
}

// ── DRILL CARD ────────────────────────────────────────────────────────────────
function DrillCard({ drill, onView, onEdit, onDelete }) {
    const dateAdded = new Date(drill.date_added);
    const daysAgo = Math.floor((Date.now() - dateAdded.getTime()) / (1000 * 60 * 60 * 24));
    const dateLabel = daysAgo === 0 ? 'Today' : daysAgo === 1 ? 'Yesterday' : `${daysAgo}d ago`;

    return (
        <div className="drill-card" onClick={() => onView(drill)}>
            <div className="drill-card-top">
                <TypeBadge type={drill.type} />
                <div className="drill-card-actions">
                    <button
                        className="drill-icon-btn"
                        title="Edit"
                        onClick={(e) => { e.stopPropagation(); onEdit(drill); }}
                    >
                        <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                    </button>
                    <button
                        className="drill-icon-btn danger"
                        title="Delete"
                        onClick={(e) => { e.stopPropagation(); onDelete(drill); }}
                    >
                        <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </button>
                </div>
            </div>
            <div className="drill-card-name">{drill.name}</div>
            <div className="drill-card-desc">{drill.description}</div>
            <div className="drill-card-footer">
                <Stars level={drill.level} />
                <span className="drill-date">{dateLabel}</span>
            </div>
        </div>
    );
}

// ── ADD / EDIT MODAL ──────────────────────────────────────────────────────────
function DrillFormModal({ mode, drill, onSave, onClose, onDelete }) {
    const [form, setForm] = useState(
        mode === 'edit' && drill ? { ...drill } : { ...EMPTY_FORM }
    );
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);

    const update = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

    const handleSubmit = async () => {
        if (!form.name.trim() || !form.type || !form.description.trim()) {
            setError('Name, attribute and description are required.');
            return;
        }
        setSaving(true);
        setError(null);
        await onSave(form);
        setSaving(false);
    };

    return (
        <div id="drill-modal-overlay">
            <div className="drill-modal">
                <div className="drill-modal-header">
                    <span className="drill-modal-title">
                        {mode === 'add' ? 'Add New Drill' : 'Edit Drill'}
                    </span>
                    <button className="drill-icon-btn close" onClick={onClose}>
                        <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="drill-modal-body">
                    {error && (
                        <div style={{
                            padding: '10px 12px',
                            backgroundColor: 'var(--danger-bg-color)',
                            border: '2px solid var(--danger-border-color)',
                            borderRadius: '8px',
                            color: 'var(--danger-body-color)',
                            fontFamily: "'DM Sans Light', sans-serif",
                            fontSize: '13px'
                        }}>
                            {error}
                        </div>
                    )}

                    <div className="drill-form-group">
                        <label className="drill-form-label">Drill Name *</label>
                        <input
                            className="drill-form-input"
                            placeholder="e.g. Cross-Court Forehand Rally"
                            value={form.name}
                            onChange={e => update('name', e.target.value)}
                        />
                    </div>

                    <div className="drill-form-row">
                        <div className="drill-form-group">
                            <label className="drill-form-label">Target Attribute *</label>
                            <select
                                className="drill-form-select"
                                value={form.type}
                                onChange={e => update('type', e.target.value)}
                            >
                                <option value="" disabled>Select...</option>
                                {ATTRIBUTES.map(a => (
                                    <option key={a} value={a.toLowerCase()}>{a}</option>
                                ))}
                            </select>
                        </div>
                        <div className="drill-form-group">
                            <label className="drill-form-label">Duration (mins)</label>
                            <input
                                className="drill-form-input"
                                type="number"
                                min="1"
                                placeholder="e.g. 15"
                                value={form.duration_mins}
                                onChange={e => update('duration_mins', e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="drill-form-group">
                        <label className="drill-form-label">Difficulty Level *</label>
                        <div className="drill-difficulty-picker">
                            {DIFFICULTY_LEVELS.map(d => (
                                <div
                                    key={d}
                                    className={`drill-diff-option ${form.level === d ? 'selected' : ''}`}
                                    onClick={() => update('level', d)}
                                >
                                    {d}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="drill-form-group">
                        <label className="drill-form-label">Description *</label>
                        <textarea
                            className="drill-form-textarea"
                            placeholder="Describe the drill — setup, execution, coaching cues..."
                            value={form.description}
                            onChange={e => update('description', e.target.value)}
                        />
                    </div>

                    <div className="drill-form-group">
                        <label className="drill-form-label">
                            Coaching Notes{' '}
                            <span style={{ textTransform: 'none', letterSpacing: 0, fontWeight: 400 }}>
                                (optional)
                            </span>
                        </label>
                        <textarea
                            className="drill-form-textarea"
                            placeholder="Variations, progressions, additional notes..."
                            value={form.notes}
                            onChange={e => update('notes', e.target.value)}
                        />
                    </div>
                </div>

                {mode === 'add' ? (
                    <div className="drill-modal-footer">
                        <button className="drill-btn drill-btn-ghost" onClick={onClose} disabled={saving}>
                            Cancel
                        </button>
                        <button className="drill-btn drill-btn-primary" onClick={handleSubmit} disabled={saving}>
                            <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                            </svg>
                            {saving ? 'Saving...' : 'Save Drill'}
                        </button>
                    </div>
                ) : (
                    <div className="drill-modal-footer-split">
                        <button className="drill-btn drill-btn-danger" onClick={() => onDelete(drill)} disabled={saving}>
                            <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Delete
                        </button>
                        <div className="right">
                            <button className="drill-btn drill-btn-ghost" onClick={onClose} disabled={saving}>
                                Cancel
                            </button>
                            <button className="drill-btn drill-btn-primary" onClick={handleSubmit} disabled={saving}>
                                <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                                </svg>
                                {saving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// ── DELETE CONFIRM MODAL ──────────────────────────────────────────────────────
function DeleteModal({ drill, onConfirm, onClose, deleting }) {
    return (
        <div id="drill-modal-overlay">
            <div className="drill-modal">
                <div className="drill-modal-header">
                    <span className="drill-modal-title">Delete Drill</span>
                    <button className="drill-icon-btn close" onClick={onClose}>
                        <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <div className="drill-modal-body">
                    <div className="drill-delete-icon-wrap">
                        <svg width="24" height="24" fill="none" stroke="#dc2626" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </div>
                    <div className="drill-delete-title">Delete "{drill?.name}"?</div>
                    <div className="drill-delete-body">
                        This drill will be permanently removed from your library. Sessions that already include it will not be affected, but it will no longer be available for new sessions.
                    </div>
                </div>
                <div className="drill-modal-footer">
                    <button className="drill-btn drill-btn-ghost" onClick={onClose} disabled={deleting}>
                        Cancel
                    </button>
                    <button className="drill-btn drill-btn-danger-solid" onClick={onConfirm} disabled={deleting}>
                        {deleting ? 'Deleting...' : 'Delete Drill'}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── DRILL DETAIL VIEW ─────────────────────────────────────────────────────────
function DrillDetail({ drill, onBack, onEdit, onDelete }) {
    return (
        <div id="drill-library-page">
            <button id="drill-back-btn" onClick={onBack}>
                <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                </svg>
                Back to Library
            </button>

            <div id="drill-detail-header">
                <TypeBadge type={drill.type} />
                <div id="drill-detail-title">{drill.name}</div>

                <div id="drill-detail-meta">
                    <div className="drill-meta-item">
                        <span className="drill-meta-label">Difficulty</span>
                        <Stars level={drill.level} />
                    </div>
                    <div className="drill-meta-item">
                        <span className="drill-meta-label">Duration</span>
                        <span className="drill-meta-value">{drill.duration_mins} min</span>
                    </div>
                    <div className="drill-meta-item">
                        <span className="drill-meta-label">Date Added</span>
                        <span className="drill-meta-value">
                            {new Date(drill.date_added).toLocaleDateString('en-AU', {
                                day: 'numeric', month: 'short', year: 'numeric'
                            })}
                        </span>
                    </div>
                    <div className="drill-meta-item">
                        <span className="drill-meta-label">Level</span>
                        <span className="drill-meta-value">{drill.level}</span>
                    </div>
                </div>

                <div id="drill-detail-desc">{drill.description}</div>
            </div>

            {drill.notes && (
                <div className="content-box" style={{ padding: '20px' }}>
                    <span className="input-container-label">COACHING NOTES</span>
                    <p style={{
                        fontFamily: "'DM Sans Light', sans-serif",
                        fontSize: '13px',
                        color: 'var(--content-subhead-color)',
                        lineHeight: '1.75',
                        marginTop: '10px'
                    }}>
                        {drill.notes}
                    </p>
                </div>
            )}

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button className="drill-btn drill-btn-danger" onClick={() => onDelete(drill)}>
                    <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Delete
                </button>
                <button className="drill-btn drill-btn-secondary" onClick={() => onEdit(drill)}>
                    <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit Drill
                </button>
            </div>
        </div>
    );
}

// ── TOAST HOOK ────────────────────────────────────────────────────────────────
function useToast() {
    const [toast, setToast] = useState({ visible: false, message: '', type: 'green' });
    const timerRef = useRef(null);

    const show = (message, type = 'green') => {
        clearTimeout(timerRef.current);
        setToast({ visible: true, message, type });
        timerRef.current = setTimeout(() => setToast(t => ({ ...t, visible: false })), 3000);
    };

    return { toast, show };
}

// ── MAIN DRILL LIBRARY PAGE ───────────────────────────────────────────────────
export default function DrillLibrary() {
    const [drills, setDrills] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [fetchError, setFetchError] = useState(null);
    const [search, setSearch] = useState('');
    const [activeFilter, setActiveFilter] = useState('All');
    const [view, setView] = useState('list');
    const [selectedDrill, setSelectedDrill] = useState(null);
    const [modal, setModal] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const { toast, show: showToast } = useToast();

    // ── Fetch drills from Supabase ──
    const fetchDrills = async () => {
        setIsLoading(true);
        setFetchError(null);
        const { data, error } = await supabase
            .from('drill_library')
            .select('*')
            .order('date_added', { ascending: false });

        if (error) {
            console.error('Error fetching drills:', error);
            setFetchError('Failed to load drills. Please try again.');
        } else {
            setDrills(data || []);
        }
        setIsLoading(false);
    };

    useEffect(() => {
        fetchDrills();
    }, []);

    // ── Escape key closes modals ──
    useEffect(() => {
        const handler = (e) => { if (e.key === 'Escape') setModal(null); };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, []);

    // ── Filtering ──
    const filtered = drills.filter(d => {
        const matchesSearch =
            d.name?.toLowerCase().includes(search.toLowerCase()) ||
            d.description?.toLowerCase().includes(search.toLowerCase());
        const matchesFilter =
            activeFilter === 'All' || d.type === activeFilter.toLowerCase();
        return matchesSearch && matchesFilter;
    });

    // ── Stats ──
    const attributeCount = new Set(drills.map(d => d.type).filter(Boolean)).size;

    // ── Handlers ──
    const handleView = (drill) => {
        setSelectedDrill(drill);
        setView('detail');
    };

    const handleEdit = (drill) => {
        setSelectedDrill(drill);
        setModal('edit');
    };

    const handleDeleteRequest = (drill) => {
        setSelectedDrill(drill);
        setModal('delete');
    };

    const handleSave = async (form) => {
        if (modal === 'add') {
            // Optimistic insert
            const optimisticDrill = {
                ...form,
                id: 'temp-' + Date.now(),
                date_added: new Date().toISOString(),
            };
            setDrills(prev => [optimisticDrill, ...prev]);
            setModal(null);

            const { data, error } = await supabase
                .from('drill_library')
                .insert([{
                    name: form.name,
                    type: form.type,
                    duration_mins: form.duration_mins ? parseInt(form.duration_mins) : null,
                    description: form.description,
                    notes: form.notes || null,
                    level: form.level,
                }])
                .select()
                .single();

            if (error) {
                console.error('Error inserting drill:', error);
                // Roll back optimistic update
                setDrills(prev => prev.filter(d => d.id !== optimisticDrill.id));
                showToast('Failed to add drill. Please try again.', 'red');
            } else {
                // Replace optimistic entry with real data
                setDrills(prev => prev.map(d =>
                    d.id === optimisticDrill.id ? data : d
                ));
                showToast('Drill added successfully', 'green');
            }
        } else {
            // Optimistic update
            setDrills(prev => prev.map(d => d.id === form.id ? { ...form } : d));
            if (selectedDrill?.id === form.id) setSelectedDrill({ ...form });
            setModal(null);

            const { error } = await supabase
                .from('drill_library')
                .update({
                    name: form.name,
                    type: form.type,
                    duration_mins: form.duration_mins ? parseInt(form.duration_mins) : null,
                    description: form.description,
                    notes: form.notes || null,
                    level: form.level,
                })
                .eq('id', form.id);

            if (error) {
                console.error('Error updating drill:', error);
                showToast('Failed to update drill. Please try again.', 'red');
                fetchDrills(); // Re-fetch to restore correct state
            } else {
                showToast('Drill updated', 'orange');
            }
        }
    };

    const handleDeleteConfirm = async () => {
        if (!selectedDrill) return;
        setDeleting(true);

        // Optimistic delete
        const backup = [...drills];
        setDrills(prev => prev.filter(d => d.id !== selectedDrill.id));

        const { error } = await supabase
            .from('drill_library')
            .delete()
            .eq('id', selectedDrill.id);

        if (error) {
            console.error('Error deleting drill:', error);
            setDrills(backup); // Restore
            showToast('Failed to delete drill. Please try again.', 'red');
        } else {
            if (view === 'detail') setView('list');
            showToast('Drill deleted', 'red');
        }

        setDeleting(false);
        setModal(null);
        setSelectedDrill(null);
    };

    // ── Loading state ──
    if (isLoading) {
        return <LOADING_OVERLAY caption="drill library" />;
    }

    // ── Detail View ──
    if (view === 'detail' && selectedDrill) {
        return (
            <>
                <DrillDetail
                    drill={selectedDrill}
                    onBack={() => setView('list')}
                    onEdit={handleEdit}
                    onDelete={handleDeleteRequest}
                />
                {modal === 'edit' && (
                    <DrillFormModal
                        mode="edit"
                        drill={selectedDrill}
                        onSave={handleSave}
                        onClose={() => setModal(null)}
                        onDelete={handleDeleteRequest}
                    />
                )}
                {modal === 'delete' && (
                    <DeleteModal
                        drill={selectedDrill}
                        onConfirm={handleDeleteConfirm}
                        onClose={() => setModal(null)}
                        deleting={deleting}
                    />
                )}
                <div id="drill-toast" className={toast.visible ? 'show' : ''}>
                    <div className={`drill-toast-dot ${toast.type}`}></div>
                    <span>{toast.message}</span>
                </div>
            </>
        );
    }

    // ── List View ──
    return (
        <>
            <div id="drill-library-page">

                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <div>
                        <h2 className="content-header" style={{ padding: 0, marginBottom: '4px' }}>
                            Drill Library
                        </h2>
                        <p style={{
                            fontFamily: "'DM Sans Light', sans-serif",
                            fontSize: '13px',
                            color: 'var(--content-subhead-color)'
                        }}>
                            Manage your coaching drill catalogue — add, edit, and organise.
                        </p>
                    </div>
                </div>

                {/* Fetch error banner */}
                {fetchError && (
                    <div style={{
                        padding: '12px 16px',
                        backgroundColor: 'var(--danger-bg-color)',
                        border: '2px solid var(--danger-border-color)',
                        borderRadius: '8px',
                        color: 'var(--danger-body-color)',
                        fontFamily: "'DM Sans Light', sans-serif",
                        fontSize: '13px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}>
                        {fetchError}
                        <button
                            className="drill-btn drill-btn-danger"
                            onClick={fetchDrills}
                            style={{ marginLeft: '12px' }}
                        >
                            Retry
                        </button>
                    </div>
                )}

                {/* Stats */}
                <div id="drill-stats-row">
                    <div className="drill-stat-card">
                        <span className="drill-stat-label">Total Drills</span>
                        <span className="drill-stat-value accent">{drills.length}</span>
                        <span className="drill-stat-sub">Across all attributes</span>
                    </div>
                    <div className="drill-stat-card">
                        <span className="drill-stat-label">Attributes</span>
                        <span className="drill-stat-value">{attributeCount}</span>
                        <span className="drill-stat-sub">Active categories</span>
                    </div>
                    <div className="drill-stat-card">
                        <span className="drill-stat-label">Filtered</span>
                        <span className="drill-stat-value">{filtered.length}</span>
                        <span className="drill-stat-sub">Matching current filter</span>
                    </div>
                    <div className="drill-stat-card">
                        <span className="drill-stat-label">Last Added</span>
                        <span className="drill-stat-value" style={{
                            fontSize: '15px',
                            fontFamily: "'DM Sans Light', sans-serif",
                            fontWeight: 700,
                            paddingTop: '6px'
                        }}>
                            {drills.length > 0
                                ? drills[0].name.substring(0, 18) + (drills[0].name.length > 18 ? '...' : '')
                                : 'None yet'}
                        </span>
                    </div>
                </div>

                {/* Main Panel */}
                <div id="drill-main-panel">

                    {/* Toolbar */}
                    <div id="drill-toolbar">
                        <div id="drill-search-wrapper">
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <input
                                id="drill-search"
                                type="text"
                                placeholder="Search drills..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                            />
                        </div>

                        <div id="drill-filter-chips">
                            {FILTERS.map(f => (
                                <button
                                    key={f}
                                    className={`drill-filter-chip ${activeFilter === f ? 'active' : ''}`}
                                    onClick={() => setActiveFilter(f)}
                                >
                                    {f}
                                </button>
                            ))}
                        </div>

                        <div id="drill-toolbar-right">
                            <button id="add-drill-btn" onClick={() => setModal('add')}>
                                <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
                                </svg>
                                Add Drill
                            </button>
                        </div>
                    </div>

                    {/* Grid or Empty State */}
                    {filtered.length > 0 ? (
                        <div id="drill-grid">
                            {filtered.map(drill => (
                                <DrillCard
                                    key={drill.id}
                                    drill={drill}
                                    onView={handleView}
                                    onEdit={handleEdit}
                                    onDelete={handleDeleteRequest}
                                />
                            ))}
                        </div>
                    ) : (
                        <div id="drill-empty-state">
                            <div className="drill-empty-icon">
                                <svg width="30" height="30" fill="none" stroke="#ec7842" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                </svg>
                            </div>
                            <div className="drill-empty-title">
                                {drills.length === 0 ? 'No Drills Yet' : 'No Results Found'}
                            </div>
                            <div className="drill-empty-sub">
                                {drills.length === 0
                                    ? 'Start building your coaching catalogue by adding your first drill.'
                                    : "Try adjusting your search or filter to find what you're looking for."}
                            </div>
                            {drills.length === 0 && (
                                <button
                                    className="drill-btn drill-btn-primary"
                                    onClick={() => setModal('add')}
                                >
                                    <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
                                    </svg>
                                    Add First Drill
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Modals */}
            {modal === 'add' && (
                <DrillFormModal
                    mode="add"
                    onSave={handleSave}
                    onClose={() => setModal(null)}
                />
            )}
            {modal === 'edit' && selectedDrill && (
                <DrillFormModal
                    mode="edit"
                    drill={selectedDrill}
                    onSave={handleSave}
                    onClose={() => setModal(null)}
                    onDelete={handleDeleteRequest}
                />
            )}
            {modal === 'delete' && selectedDrill && (
                <DeleteModal
                    drill={selectedDrill}
                    onConfirm={handleDeleteConfirm}
                    onClose={() => setModal(null)}
                    deleting={deleting}
                />
            )}

            {/* Toast */}
            <div id="drill-toast" className={toast.visible ? 'show' : ''}>
                <div className={`drill-toast-dot ${toast.type}`}></div>
                <span>{toast.message}</span>
            </div>
        </>
    );
}