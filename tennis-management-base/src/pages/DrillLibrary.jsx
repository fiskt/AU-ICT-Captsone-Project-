import { useState, useRef, useEffect } from 'react';
import '../App.css';
import './DrillLibrary.css';
import { supabase } from '../supabaseClient';
import { LOADING_OVERLAY } from '../Components/SharedComponents';

// ── CONSTANTS ─────────────────────────────────────────────────────────────────
const DIFFICULTY_LEVELS = ['Beginner', 'Intermediate', 'Advanced', 'Elite'];

// ── TAG INPUT COMPONENT ───────────────────────────────────────────────────────
// Allows typing new tags, selecting existing ones, removing selected tags
function TagInput({ selectedTags, onTagsChange, allTags }) {
    const [inputValue, setInputValue] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);
    const inputRef = useRef(null);
    const containerRef = useRef(null);

    // Filter suggestions: existing tags that match input and aren't already selected
    const suggestions = allTags.filter(tag =>
        tag.name.toLowerCase().includes(inputValue.toLowerCase()) &&
        !selectedTags.some(t => t.id === tag.id)
    );

    // Whether to show "Create new tag" option
    const showCreateNew = inputValue.trim().length > 0 &&
        !allTags.some(t => t.name.toLowerCase() === inputValue.trim().toLowerCase()) &&
        !selectedTags.some(t => t.name.toLowerCase() === inputValue.trim().toLowerCase());

    const addTag = (tag) => {
        if (!selectedTags.some(t => t.id === tag.id)) {
            onTagsChange([...selectedTags, tag]);
        }
        setInputValue('');
        setShowSuggestions(false);
        inputRef.current?.focus();
    };

    const createAndAddTag = () => {
        const name = inputValue.trim();
        if (!name) return;
        // Temporary tag with no id — will get real id after Supabase insert
        const tempTag = { id: 'temp-' + Date.now(), name };
        onTagsChange([...selectedTags, tempTag]);
        setInputValue('');
        setShowSuggestions(false);
        inputRef.current?.focus();
    };

    const removeTag = (tagId) => {
        onTagsChange(selectedTags.filter(t => t.id !== tagId));
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (suggestions.length > 0 && !showCreateNew) {
                addTag(suggestions[0]);
            } else if (showCreateNew) {
                createAndAddTag();
            }
        }
        if (e.key === 'Backspace' && inputValue === '' && selectedTags.length > 0) {
            removeTag(selectedTags[selectedTags.length - 1].id);
        }
        if (e.key === 'Escape') {
            setShowSuggestions(false);
        }
    };

    // Close suggestions when clicking outside
    useEffect(() => {
        const handler = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    return (
        <div ref={containerRef} style={{ position: 'relative' }}>
            <div
                className="drill-tag-input-area"
                onClick={() => inputRef.current?.focus()}
            >
                {selectedTags.map(tag => (
                    <span key={tag.id} className="drill-tag-selected">
                        {tag.name}
                        <button
                            className="drill-tag-remove"
                            onClick={(e) => { e.stopPropagation(); removeTag(tag.id); }}
                            type="button"
                        >
                            ×
                        </button>
                    </span>
                ))}
                <input
                    ref={inputRef}
                    className="drill-tag-text-input"
                    type="text"
                    placeholder={selectedTags.length === 0 ? 'Type a tag and press Enter...' : ''}
                    value={inputValue}
                    onChange={(e) => {
                        setInputValue(e.target.value);
                        setShowSuggestions(true);
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    onKeyDown={handleKeyDown}
                />
            </div>

            {showSuggestions && (suggestions.length > 0 || showCreateNew) && (
                <div className="drill-tag-suggestions">
                    {suggestions.map(tag => (
                        <div
                            key={tag.id}
                            className="drill-tag-suggestion-item"
                            onMouseDown={(e) => { e.preventDefault(); addTag(tag); }}
                        >
                            {tag.name}
                        </div>
                    ))}
                    {showCreateNew && (
                        <div
                            className="drill-tag-suggestion-item drill-tag-suggestion-new"
                            onMouseDown={(e) => { e.preventDefault(); createAndAddTag(); }}
                        >
                            + Create "{inputValue.trim()}"
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// ── STARS ─────────────────────────────────────────────────────────────────────
function Stars({ level }) {
    const levelMap = { Beginner: 1, Intermediate: 2, Advanced: 3, Elite: 5 };
    const filled = levelMap[level] ?? 2;
    return (
        <div className="drill-stars">
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

// ── TAG CHIPS (display only) ──────────────────────────────────────────────────
function TagChips({ tags }) {
    if (!tags || tags.length === 0) return null;
    return (
        <div className="drill-tags-row">
            {tags.map(tag => (
                <span key={tag.id} className="drill-tag-chip accent">
                    {tag.name}
                </span>
            ))}
        </div>
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
                <TagChips tags={drill.tags} />
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

// ── DRILL FORM MODAL ──────────────────────────────────────────────────────────
function DrillFormModal({ mode, drill, allTags, onSave, onClose, onDelete }) {
    const EMPTY_FORM = {
        name: '',
        duration_mins: '',
        description: '',
        notes: '',
        level: 'Intermediate',
        tags: [],
    };

    const [form, setForm] = useState(
        mode === 'edit' && drill
            ? { ...drill, tags: drill.tags || [] }
            : { ...EMPTY_FORM }
    );
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);

    const update = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

    const handleSubmit = async () => {
        if (!form.name.trim() || !form.description.trim()) {
            setError('Name and description are required.');
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
                    <button className="drill-icon-btn" onClick={onClose} style={{ border: 'none', background: 'transparent' }}>
                        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="drill-modal-body">
                    {error && (
                        <div className="drill-error-banner">{error}</div>
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

                    <div className="drill-form-group">
                        <label className="drill-form-label">Tags</label>
                        <TagInput
                            selectedTags={form.tags}
                            onTagsChange={(tags) => update('tags', tags)}
                            allTags={allTags}
                        />
                        <span style={{
                            fontFamily: "'DM Sans Light', sans-serif",
                            fontSize: '11px',
                            color: 'var(--content-input-placeholder-color)',
                            marginTop: '4px'
                        }}>
                            Type a tag and press Enter. New tags will be saved for future use.
                        </span>
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
                        <div className="modal-right">
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
                    <button className="drill-icon-btn" onClick={onClose} style={{ border: 'none', background: 'transparent' }}>
                        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                <TagChips tags={drill.tags} />
                <div id="drill-detail-title">{drill.name}</div>

                <div id="drill-detail-meta">
                    <div className="drill-meta-item">
                        <span className="drill-meta-label">Difficulty</span>
                        <Stars level={drill.level} />
                    </div>
                    <div className="drill-meta-item">
                        <span className="drill-meta-label">Duration</span>
                        <span className="drill-meta-value">
                            {drill.duration_mins ? `${drill.duration_mins} min` : 'Not set'}
                        </span>
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

// ── MAIN PAGE ─────────────────────────────────────────────────────────────────
export default function DrillLibrary() {
    const [drills, setDrills] = useState([]);
    const [allTags, setAllTags] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [fetchError, setFetchError] = useState(null);
    const [search, setSearch] = useState('');
    const [activeTagFilter, setActiveTagFilter] = useState(null); // null = All
    const [view, setView] = useState('list');
    const [selectedDrill, setSelectedDrill] = useState(null);
    const [modal, setModal] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const { toast, show: showToast } = useToast();

    // ── Fetch drills and tags ──
    const fetchData = async () => {
        setIsLoading(true);
        setFetchError(null);

        // Fetch all tags
        const { data: tagsData, error: tagsError } = await supabase
            .from('drill_tags')
            .select('*')
            .order('name');

        if (tagsError) {
            console.error('Error fetching tags:', tagsError);
        } else {
            setAllTags(tagsData || []);
        }

        // Fetch drills with their tags via junction table
        const { data: drillsData, error: drillsError } = await supabase
            .from('drill_library')
            .select(`
                *,
                drill_library_tags (
                    drill_tags ( id, name )
                )
            `)
            .order('date_added', { ascending: false });

        if (drillsError) {
            console.error('Error fetching drills:', drillsError);
            setFetchError('Failed to load drills. Please try again.');
        } else {
            // Flatten tags from junction table
            const drillsWithTags = (drillsData || []).map(drill => ({
                ...drill,
                tags: (drill.drill_library_tags || []).map(jt => jt.drill_tags).filter(Boolean),
            }));
            setDrills(drillsWithTags);
        }

        setIsLoading(false);
    };

    useEffect(() => { fetchData(); }, []);

    // ── Escape closes modals ──
    useEffect(() => {
        const handler = (e) => { if (e.key === 'Escape') setModal(null); };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, []);

    // ── Ensure new tags are persisted and return their real ids ──
    const ensureTagsExist = async (tags) => {
        const resolvedTags = [];
        for (const tag of tags) {
            if (!String(tag.id).startsWith('temp-')) {
                resolvedTags.push(tag);
                continue;
            }
            // New tag — insert into drill_tags
            const { data, error } = await supabase
                .from('drill_tags')
                .insert([{ name: tag.name }])
                .select()
                .single();

            if (error) {
                // Tag might already exist (race condition) — try to find it
                const { data: existing } = await supabase
                    .from('drill_tags')
                    .select('*')
                    .eq('name', tag.name)
                    .single();
                if (existing) resolvedTags.push(existing);
            } else {
                resolvedTags.push(data);
                // Add to allTags state
                setAllTags(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
            }
        }
        return resolvedTags;
    };

    // ── Save drill tags to junction table ──
    const saveDrillTags = async (drillId, tags) => {
        // Delete existing tag links for this drill
        await supabase
            .from('drill_library_tags')
            .delete()
            .eq('drill_id', drillId);

        if (tags.length === 0) return;

        // Insert new tag links
        const inserts = tags.map(tag => ({ drill_id: drillId, tag_id: tag.id }));
        const { error } = await supabase
            .from('drill_library_tags')
            .insert(inserts);

        if (error) console.error('Error saving drill tags:', error);
    };

    // ── Filtering ──
    const filtered = drills.filter(d => {
        const matchesSearch =
            d.name?.toLowerCase().includes(search.toLowerCase()) ||
            d.description?.toLowerCase().includes(search.toLowerCase()) ||
            d.tags?.some(t => t.name.toLowerCase().includes(search.toLowerCase()));

        const matchesTag = !activeTagFilter ||
            d.tags?.some(t => t.id === activeTagFilter);

        return matchesSearch && matchesTag;
    });

    // ── Unique tags used across all drills (for filter chips) ──
    const usedTags = allTags.filter(tag =>
        drills.some(d => d.tags?.some(t => t.id === tag.id))
    );

    // ── Handlers ──
    const handleView = (drill) => { setSelectedDrill(drill); setView('detail'); };
    const handleEdit = (drill) => { setSelectedDrill(drill); setModal('edit'); };
    const handleDeleteRequest = (drill) => { setSelectedDrill(drill); setModal('delete'); };

    const handleSave = async (form) => {
        const resolvedTags = await ensureTagsExist(form.tags || []);

        if (modal === 'add') {
            // Optimistic
            const optimistic = {
                ...form,
                id: 'temp-' + Date.now(),
                date_added: new Date().toISOString(),
                tags: resolvedTags,
            };
            setDrills(prev => [optimistic, ...prev]);
            setModal(null);

            const { data, error } = await supabase
                .from('drill_library')
                .insert([{
                    name: form.name,
                    duration_mins: form.duration_mins ? parseInt(form.duration_mins) : null,
                    description: form.description,
                    notes: form.notes || null,
                    level: form.level,
                }])
                .select()
                .single();

            if (error) {
                console.error('Error inserting drill:', error);
                setDrills(prev => prev.filter(d => d.id !== optimistic.id));
                showToast('Failed to add drill. Please try again.', 'red');
            } else {
                await saveDrillTags(data.id, resolvedTags);
                setDrills(prev => prev.map(d =>
                    d.id === optimistic.id ? { ...data, tags: resolvedTags } : d
                ));
                showToast('Drill added successfully', 'green');
            }

        } else {
            // Optimistic update
            const updated = { ...form, tags: resolvedTags };
            setDrills(prev => prev.map(d => d.id === form.id ? updated : d));
            if (selectedDrill?.id === form.id) setSelectedDrill(updated);
            setModal(null);

            const { error } = await supabase
                .from('drill_library')
                .update({
                    name: form.name,
                    duration_mins: form.duration_mins ? parseInt(form.duration_mins) : null,
                    description: form.description,
                    notes: form.notes || null,
                    level: form.level,
                })
                .eq('id', form.id);

            if (error) {
                console.error('Error updating drill:', error);
                showToast('Failed to update drill. Please try again.', 'red');
                fetchData();
            } else {
                await saveDrillTags(form.id, resolvedTags);
                showToast('Drill updated', 'orange');
            }
        }
    };

    const handleDeleteConfirm = async () => {
        if (!selectedDrill) return;
        setDeleting(true);
        const backup = [...drills];
        setDrills(prev => prev.filter(d => d.id !== selectedDrill.id));

        const { error } = await supabase
            .from('drill_library')
            .delete()
            .eq('id', selectedDrill.id);

        if (error) {
            console.error('Error deleting drill:', error);
            setDrills(backup);
            showToast('Failed to delete drill. Please try again.', 'red');
        } else {
            if (view === 'detail') setView('list');
            showToast('Drill deleted', 'red');
        }

        setDeleting(false);
        setModal(null);
        setSelectedDrill(null);
    };

    // ── Loading ──
    if (isLoading) return <LOADING_OVERLAY caption="drill library" />;

    // ── Detail view ──
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
                        allTags={allTags}
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

    // ── List view ──
    return (
        <>
            <div id="drill-library-page">

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
                            Manage your coaching drill catalogue.
                        </p>
                    </div>
                </div>

                {fetchError && (
                    <div className="drill-error-banner">
                        {fetchError}
                        <button className="drill-btn drill-btn-danger" onClick={fetchData}>
                            Retry
                        </button>
                    </div>
                )}

                {/* Stats */}
                <div id="drill-stats-row">
                    <div className="drill-stat-card">
                        <span className="drill-stat-label">Total Drills</span>
                        <span className="drill-stat-value accent">{drills.length}</span>
                        <span className="drill-stat-sub">In your library</span>
                    </div>
                    <div className="drill-stat-card">
                        <span className="drill-stat-label">Tags</span>
                        <span className="drill-stat-value">{allTags.length}</span>
                        <span className="drill-stat-sub">Across all drills</span>
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

                {/* Main panel */}
                <div id="drill-main-panel">
                    <div id="drill-toolbar">
                        <div id="drill-search-wrapper">
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <input
                                id="drill-search"
                                type="text"
                                placeholder="Search drills or tags..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                            />
                        </div>

                        {/* Tag filter chips */}
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                            <button
                                style={{
                                    padding: '6px 14px',
                                    borderRadius: '100px',
                                    border: '2px solid',
                                    borderColor: !activeTagFilter ? 'var(--accent-color)' : 'var(--content-input-border-color)',
                                    background: !activeTagFilter ? 'var(--accent-color)' : 'var(--content-bg-color)',
                                    color: !activeTagFilter ? 'white' : 'var(--content-subhead-color)',
                                    fontFamily: "'DM Mono Light', sans-serif",
                                    fontSize: '11px',
                                    cursor: 'pointer',
                                }}
                                onClick={() => setActiveTagFilter(null)}
                            >
                                All
                            </button>
                            {usedTags.map(tag => (
                                <button
                                    key={tag.id}
                                    style={{
                                        padding: '6px 14px',
                                        borderRadius: '100px',
                                        border: '2px solid',
                                        borderColor: activeTagFilter === tag.id ? 'var(--accent-color)' : 'var(--content-input-border-color)',
                                        background: activeTagFilter === tag.id ? 'var(--accent-color)' : 'var(--content-bg-color)',
                                        color: activeTagFilter === tag.id ? 'white' : 'var(--content-subhead-color)',
                                        fontFamily: "'DM Mono Light', sans-serif",
                                        fontSize: '11px',
                                        cursor: 'pointer',
                                    }}
                                    onClick={() => setActiveTagFilter(tag.id)}
                                >
                                    {tag.name}
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
                                    : "Try adjusting your search or filter."}
                            </div>
                            {drills.length === 0 && (
                                <button className="drill-btn drill-btn-primary" onClick={() => setModal('add')}>
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

            {modal === 'add' && (
                <DrillFormModal
                    mode="add"
                    allTags={allTags}
                    onSave={handleSave}
                    onClose={() => setModal(null)}
                />
            )}
            {modal === 'edit' && selectedDrill && (
                <DrillFormModal
                    mode="edit"
                    drill={selectedDrill}
                    allTags={allTags}
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

            <div id="drill-toast" className={toast.visible ? 'show' : ''}>
                <div className={`drill-toast-dot ${toast.type}`}></div>
                <span>{toast.message}</span>
            </div>
        </>
    );
}
