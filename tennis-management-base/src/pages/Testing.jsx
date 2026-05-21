import { useEffect, useState, useRef } from "react";
import { supabase } from "../supabaseClient";

// ═══════════════════════════════════════════════════════════
// BENCHMARK DATA — from Tennis Australia Fitness Testing PDF
// ═══════════════════════════════════════════════════════════

const BENCHMARKS = {
    male: {
        pre: {
            sprint_5m:         { excellent: [null, 1.10],  good: [1.10, 1.19], average: [1.20, 1.26], poor: [1.26, null],  lower_is_better: true  },
            sprint_10m:        { excellent: [null, 2.00],  good: [2.00, 2.05], average: [2.06, 2.15], poor: [2.15, null],  lower_is_better: true  },
            agility_505_left:  { excellent: [null, 2.80],  good: [2.80, 2.89], average: [2.90, 3.00], poor: [3.00, null],  lower_is_better: true  },
            agility_505_right: { excellent: [null, 2.80],  good: [2.80, 2.89], average: [2.90, 3.00], poor: [3.00, null],  lower_is_better: true  },
            vertical_jump:     { excellent: [42, null],    good: [39, 42],     average: [34, 38],     poor: [null, 34],    lower_is_better: false },
            front_plank:       { excellent: [5, null],     good: [4.5, 5],     average: [3.5, 4.5],   poor: [null, 3.5],   lower_is_better: false },
            beep_test:         { excellent: [11.4, null],  good: [10.4, 11.4], average: [9.0, 10.39], poor: [null, 9.0],   lower_is_better: false },
            yoyo_test:         null,
        },
        during: {
            sprint_5m:         { excellent: [null, 1.05],  good: [1.05, 1.13], average: [1.14, 1.20], poor: [1.20, null],  lower_is_better: true  },
            sprint_10m:        { excellent: [null, 1.85],  good: [1.85, 1.90], average: [1.91, 2.00], poor: [2.00, null],  lower_is_better: true  },
            agility_505_left:  { excellent: [null, 2.60],  good: [2.60, 2.75], average: [2.76, 2.83], poor: [2.83, null],  lower_is_better: true  },
            agility_505_right: { excellent: [null, 2.60],  good: [2.60, 2.75], average: [2.76, 2.83], poor: [2.83, null],  lower_is_better: true  },
            vertical_jump:     { excellent: [52, null],    good: [45, 52],     average: [40, 44],     poor: [null, 40],    lower_is_better: false },
            front_plank:       { excellent: [5, null],     good: [4.5, 5],     average: [3.5, 4.5],   poor: [null, 3.5],   lower_is_better: false },
            beep_test:         { excellent: [12.5, null],  good: [11.8, 12.5], average: [10.8, 11.79],poor: [null, 10.8],  lower_is_better: false },
            yoyo_test:         null,
        },
        post: {
            sprint_5m:         { excellent: [null, 0.98],  good: [0.98, 1.05], average: [1.06, 1.11], poor: [1.11, null],  lower_is_better: true  },
            sprint_10m:        { excellent: [null, 1.75],  good: [1.75, 1.80], average: [1.81, 1.87], poor: [1.87, null],  lower_is_better: true  },
            agility_505_left:  { excellent: [null, 2.40],  good: [2.40, 2.55], average: [2.56, 2.66], poor: [2.66, null],  lower_is_better: true  },
            agility_505_right: { excellent: [null, 2.40],  good: [2.40, 2.55], average: [2.56, 2.66], poor: [2.66, null],  lower_is_better: true  },
            vertical_jump:     { excellent: [62, null],    good: [58, 62],     average: [51, 57],     poor: [null, 51],    lower_is_better: false },
            front_plank:       { excellent: [5, null],     good: [4.5, 5],     average: [3.5, 4.5],   poor: [null, 3.5],   lower_is_better: false },
            beep_test:         { excellent: [14.0, null],  good: [13.5, 14.0], average: [12.4, 13.49],poor: [null, 12.4],  lower_is_better: false },
            yoyo_test:         { excellent: [21, null],    good: [19, 21],     average: [17, 18.99],  poor: [null, 17],    lower_is_better: false },
        },
    },
    female: {
        pre: {
            sprint_5m:         { excellent: [null, 1.20],  good: [1.20, 1.25], average: [1.26, 1.30], poor: [1.30, null],  lower_is_better: true  },
            sprint_10m:        { excellent: [null, 2.10],  good: [2.10, 2.15], average: [2.16, 2.25], poor: [2.25, null],  lower_is_better: true  },
            agility_505_left:  { excellent: [null, 2.90],  good: [2.90, 3.00], average: [3.01, 3.12], poor: [3.12, null],  lower_is_better: true  },
            agility_505_right: { excellent: [null, 2.90],  good: [2.90, 3.00], average: [3.01, 3.12], poor: [3.12, null],  lower_is_better: true  },
            vertical_jump:     { excellent: [39, null],    good: [35, 39],     average: [30, 34],     poor: [null, 30],    lower_is_better: false },
            front_plank:       { excellent: [5, null],     good: [4.5, 5],     average: [3.5, 4.5],   poor: [null, 3.5],   lower_is_better: false },
            beep_test:         { excellent: [9.5, null],   good: [8.5, 9.5],   average: [8.0, 8.49],  poor: [null, 8.0],   lower_is_better: false },
            yoyo_test:         null,
        },
        during: {
            sprint_5m:         { excellent: [null, 1.12],  good: [1.12, 1.19], average: [1.20, 1.25], poor: [1.25, null],  lower_is_better: true  },
            sprint_10m:        { excellent: [null, 1.95],  good: [1.95, 2.07], average: [2.08, 2.15], poor: [2.15, null],  lower_is_better: true  },
            agility_505_left:  { excellent: [null, 2.80],  good: [2.80, 2.89], average: [2.90, 3.00], poor: [3.00, null],  lower_is_better: true  },
            agility_505_right: { excellent: [null, 2.80],  good: [2.80, 2.89], average: [2.90, 3.00], poor: [3.00, null],  lower_is_better: true  },
            vertical_jump:     { excellent: [43, null],    good: [39, 43],     average: [35, 38],     poor: [null, 35],    lower_is_better: false },
            front_plank:       { excellent: [5, null],     good: [4.5, 5],     average: [3.5, 4.5],   poor: [null, 3.5],   lower_is_better: false },
            beep_test:         { excellent: [11.0, null],  good: [10.0, 11.0], average: [9.0, 9.99],  poor: [null, 9.0],   lower_is_better: false },
            yoyo_test:         null,
        },
        post: {
            sprint_5m:         { excellent: [null, 1.09],  good: [1.09, 1.14], average: [1.15, 1.20], poor: [1.20, null],  lower_is_better: true  },
            sprint_10m:        { excellent: [null, 1.90],  good: [1.90, 1.99], average: [2.00, 2.05], poor: [2.05, null],  lower_is_better: true  },
            agility_505_left:  { excellent: [null, 2.60],  good: [2.60, 2.75], average: [2.76, 2.85], poor: [2.85, null],  lower_is_better: true  },
            agility_505_right: { excellent: [null, 2.60],  good: [2.60, 2.75], average: [2.76, 2.85], poor: [2.85, null],  lower_is_better: true  },
            vertical_jump:     { excellent: [50, null],    good: [44, 50],     average: [40, 44],     poor: [null, 40],    lower_is_better: false },
            front_plank:       { excellent: [5, null],     good: [4.5, 5],     average: [3.5, 4.5],   poor: [null, 3.5],   lower_is_better: false },
            beep_test:         { excellent: [12.0, null],  good: [11.2, 12.0], average: [10.0, 11.19],poor: [null, 10.0],  lower_is_better: false },
            yoyo_test:         { excellent: [19, null],    good: [18, 19],     average: [16, 17.99],  poor: [null, 16],    lower_is_better: false },
        },
    },
};

// ── Rating calculator ─────────────────────────────────────
function getRating(value, metric, gender, phv) {
    if (value === null || value === undefined || value === '') return null;
    const bench = BENCHMARKS[gender]?.[phv]?.[metric];
    if (!bench) return null;

    const v = parseFloat(value);
    const { lower_is_better } = bench;

    if (lower_is_better) {
        if (bench.excellent[1] !== null && v < bench.excellent[1]) return 'excellent';
        if (bench.good[1] !== null && v <= bench.good[1])          return 'good';
        if (bench.average[1] !== null && v <= bench.average[1])    return 'average';
        return 'poor';
    } else {
        if (bench.excellent[0] !== null && v >= bench.excellent[0]) return 'excellent';
        if (bench.good[0] !== null && v >= bench.good[0])           return 'good';
        if (bench.average[0] !== null && v >= bench.average[0])     return 'average';
        return 'poor';
    }
}

// ── Rating badge component ────────────────────────────────
function RatingBadge({ rating }) {
    if (!rating) return <span className="pt-rating pt-rating-na">N/A</span>;
    return <span className={`pt-rating pt-rating-${rating}`}>{rating}</span>;
}

// ── Metric display row ────────────────────────────────────
function MetricRow({ label, value, unit, metric, gender, phv }) {
    const rating = value !== null && value !== undefined && value !== ''
        ? getRating(value, metric, gender, phv)
        : null;
    return (
        <div className="pt-metric-row">
            <span className="pt-metric-label">{label}</span>
            <span className="pt-metric-value">
                {value !== null && value !== undefined && value !== ''
                    ? `${value}${unit ? ' ' + unit : ''}`
                    : '—'}
            </span>
            <RatingBadge rating={rating} />
        </div>
    );
}

// ── Empty state ───────────────────────────────────────────
function EmptyState({ onAdd }) {
    return (
        <div className="pt-empty-state">
            <div className="pt-empty-icon">
                <svg width="30" height="30" fill="none" stroke="#ec7842" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5"
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
            </div>
            <div className="pt-empty-title">No Test Records Yet</div>
            <div className="pt-empty-sub">Start recording performance test results for your players.</div>
            <button className="pt-btn pt-btn-primary" onClick={onAdd}>
                <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
                </svg>
                Add Test Result
            </button>
        </div>
    );
}

// ── Test Card ─────────────────────────────────────────────
function TestCard({ test, players, onView, onDelete }) {
    const player = players.find(p => p.id === test.player_id);
    const playerName = player
        ? `${player.first_name || ''} ${player.last_name || ''}`.trim()
        : 'Unknown Player';

    const date = new Date(test.test_date).toLocaleDateString('en-AU', {
        day: 'numeric', month: 'short', year: 'numeric'
    });

    const phvLabel = { pre: 'Pre-PHV', during: 'During PHV', post: 'Post-PHV' }[test.phv_stage] || test.phv_stage;
    const genderLabel = test.gender === 'male' ? 'Male' : 'Female';

    // Count how many metrics have excellent/good ratings
    const metrics = ['sprint_5m','sprint_10m','agility_505_left','agility_505_right','vertical_jump','front_plank','beep_test','yoyo_test'];
    const ratings = metrics
        .filter(m => test[m] !== null && test[m] !== undefined && test[m] !== '')
        .map(m => getRating(test[m], m, test.gender, test.phv_stage));
    const goodCount = ratings.filter(r => r === 'excellent' || r === 'good').length;
    const totalCount = ratings.length;

    return (
        <div className="pt-card" onClick={() => onView(test)}>
            <div className="pt-card-top">
                <div className="pt-card-meta">
                    <span className="pt-card-date">{date}</span>
                    <div className="pt-card-badges">
                        <span className="pt-badge">{genderLabel}</span>
                        <span className="pt-badge">{phvLabel}</span>
                    </div>
                </div>
                <div className="pt-card-actions">
                    <button
                        className="drill-icon-btn danger"
                        title="Delete"
                        onClick={e => { e.stopPropagation(); onDelete(test); }}
                    >
                        <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </button>
                </div>
            </div>

            <div className="pt-card-player">{playerName}</div>

            <div className="pt-card-summary">
                <div className="pt-card-score">
                    <span className="pt-card-score-num">{goodCount}</span>
                    <span className="pt-card-score-den">/{totalCount}</span>
                </div>
                <span className="pt-card-score-label">Good or Excellent ratings</span>
            </div>

            {/* Sparkline of ratings */}
            <div className="pt-card-ratings-row">
                {metrics.map(m => {
                    const rating = test[m] !== null && test[m] !== undefined && test[m] !== ''
                        ? getRating(test[m], m, test.gender, test.phv_stage)
                        : null;
                    return (
                        <div
                            key={m}
                            className={`pt-rating-dot ${rating ? `pt-rating-dot-${rating}` : 'pt-rating-dot-na'}`}
                            title={m.replace(/_/g, ' ')}
                        />
                    );
                })}
            </div>
        </div>
    );
}

// ── Test Form Modal ───────────────────────────────────────
function TestFormModal({ players, onSave, onClose }) {
    const EMPTY = {
        player_id: '',
        test_date: new Date().toISOString().split('T')[0],
        gender: 'male',
        phv_stage: 'post',
        sprint_5m: '',
        sprint_10m: '',
        agility_505_left: '',
        agility_505_right: '',
        vertical_jump: '',
        front_plank: '',
        beep_test: '',
        yoyo_test: '',
        notes: '',
    };

    const [form, setForm] = useState({ ...EMPTY });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);

    const update = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

    const handleSave = async () => {
        if (!form.player_id) { setError('Please select a player.'); return; }
        if (!form.test_date) { setError('Please enter a test date.'); return; }
        setSaving(true);
        setError(null);
        await onSave(form);
        setSaving(false);
    };

    const showYoyo = form.phv_stage === 'post';

    const Field = ({ label, field, placeholder, step = '0.01', hint }) => (
        <div className="drill-form-group">
            <label className="drill-form-label">{label}</label>
            <input
                className="drill-form-input"
                type="number"
                step={step}
                min="0"
                placeholder={placeholder}
                value={form[field]}
                onChange={e => update(field, e.target.value)}
            />
            {hint && <span className="pt-field-hint">{hint}</span>}
            {form[field] !== '' && form.gender && form.phv_stage && (
                <div className="pt-field-rating">
                    <RatingBadge rating={getRating(form[field], field, form.gender, form.phv_stage)} />
                </div>
            )}
        </div>
    );

    return (
        <div id="drill-modal-overlay">
            <div className="drill-modal" style={{ maxWidth: '620px' }}>
                <div className="drill-modal-header">
                    <span className="drill-modal-title">Add Test Result</span>
                    <button className="drill-icon-btn" onClick={onClose} style={{ border: 'none', background: 'transparent' }}>
                        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="drill-modal-body">
                    {error && <div className="drill-error-banner">{error}</div>}

                    {/* Player + Date */}
                    <div className="drill-form-row">
                        <div className="drill-form-group">
                            <label className="drill-form-label">Player *</label>
                            <select className="drill-form-select" value={form.player_id} onChange={e => update('player_id', e.target.value)}>
                                <option value="">Select player...</option>
                                {players.map(p => (
                                    <option key={p.id} value={p.id}>
                                        {`${p.first_name || ''} ${p.last_name || ''}`.trim() || p.email}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="drill-form-group">
                            <label className="drill-form-label">Test Date *</label>
                            <input className="drill-form-input" type="date" value={form.test_date} onChange={e => update('test_date', e.target.value)} />
                        </div>
                    </div>

                    {/* Gender + PHV */}
                    <div className="drill-form-row">
                        <div className="drill-form-group">
                            <label className="drill-form-label">Gender *</label>
                            <div className="drill-difficulty-picker">
                                {['male', 'female'].map(g => (
                                    <div key={g} className={`drill-diff-option ${form.gender === g ? 'selected' : ''}`} onClick={() => update('gender', g)}>
                                        {g.charAt(0).toUpperCase() + g.slice(1)}
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="drill-form-group">
                            <label className="drill-form-label">PHV Stage *</label>
                            <div className="drill-difficulty-picker">
                                {[['pre', 'Pre'], ['during', 'During'], ['post', 'Post']].map(([val, lbl]) => (
                                    <div key={val} className={`drill-diff-option ${form.phv_stage === val ? 'selected' : ''}`} onClick={() => update('phv_stage', val)}>
                                        {lbl}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Section: Speed */}
                    <div className="pt-section-label">
                        <span>1. Court Movement — Speed & Acceleration</span>
                    </div>
                    <div className="drill-form-row">
                        <Field label="5m Sprint (sec)" field="sprint_5m" placeholder="e.g. 1.10" hint="Lower is better" />
                        <Field label="10m Sprint (sec)" field="sprint_10m" placeholder="e.g. 2.00" hint="Lower is better" />
                    </div>

                    {/* Section: Agility */}
                    <div className="pt-section-label">
                        <span>1. Court Movement — Modified 505 Agility</span>
                    </div>
                    <div className="drill-form-row">
                        <Field label="505 Left Foot (sec)" field="agility_505_left" placeholder="e.g. 2.80" hint="Lower is better" />
                        <Field label="505 Right Foot (sec)" field="agility_505_right" placeholder="e.g. 2.80" hint="Lower is better" />
                    </div>

                    {/* Section: Power */}
                    <div className="pt-section-label">
                        <span>2. Lower Body Power — CMJ</span>
                    </div>
                    <Field label="Vertical Jump (cm)" field="vertical_jump" placeholder="e.g. 55" step="0.5" hint="Higher is better" />

                    {/* Section: Strength */}
                    <div className="pt-section-label">
                        <span>3. Strength — Plank Endurance</span>
                    </div>
                    <Field label="Front Plank (min)" field="front_plank" placeholder="e.g. 4.5" hint="Higher is better" />

                    {/* Section: Aerobic */}
                    <div className="pt-section-label">
                        <span>4. Aerobic Endurance</span>
                    </div>
                    <div className="drill-form-row">
                        <Field label="Beep Test (level.shuttle)" field="beep_test" placeholder="e.g. 11.4" hint="e.g. 11.4 = Level 11, Shuttle 4" />
                        {showYoyo
                            ? <Field label="Yo-Yo IR1 (level.shuttle)" field="yoyo_test" placeholder="e.g. 21" hint="Post-PHV only" />
                            : (
                                <div className="drill-form-group">
                                    <label className="drill-form-label">Yo-Yo IR1</label>
                                    <div style={{ padding: '9px 12px', border: '2px solid var(--content-input-border-color)', borderRadius: '8px', background: 'var(--main-bg-color)', fontFamily: "'DM Sans Light', sans-serif", fontSize: '12px', color: 'var(--content-input-placeholder-color)' }}>
                                        Post-PHV players only
                                    </div>
                                </div>
                            )
                        }
                    </div>

                    {/* Notes */}
                    <div className="drill-form-group">
                        <label className="drill-form-label">Notes (optional)</label>
                        <textarea className="drill-form-textarea" placeholder="Any additional observations..." value={form.notes} onChange={e => update('notes', e.target.value)} />
                    </div>
                </div>

                <div className="drill-modal-footer">
                    <button className="drill-btn drill-btn-ghost" onClick={onClose} disabled={saving}>Cancel</button>
                    <button className="drill-btn drill-btn-primary" onClick={handleSave} disabled={saving}>
                        <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                        </svg>
                        {saving ? 'Saving...' : 'Save Result'}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── Delete Confirm Modal ──────────────────────────────────
function DeleteModal({ test, players, onConfirm, onClose, deleting }) {
    const player = players.find(p => p.id === test?.player_id);
    const name = player ? `${player.first_name || ''} ${player.last_name || ''}`.trim() : 'this player';
    const date = test ? new Date(test.test_date).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' }) : '';

    return (
        <div id="drill-modal-overlay">
            <div className="drill-modal">
                <div className="drill-modal-header">
                    <span className="drill-modal-title">Delete Test Result</span>
                    <button className="drill-icon-btn" onClick={onClose} style={{ border: 'none', background: 'transparent' }}>
                        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <div className="drill-modal-body">
                    <div className="drill-delete-icon-wrap">
                        <svg width="24" height="24" fill="none" stroke="#dc2626" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </div>
                    <div className="drill-delete-title">Delete test result for {name} on {date}?</div>
                    <div className="drill-delete-body">This record will be permanently removed and cannot be recovered.</div>
                </div>
                <div className="drill-modal-footer">
                    <button className="drill-btn drill-btn-ghost" onClick={onClose} disabled={deleting}>Cancel</button>
                    <button className="drill-btn drill-btn-danger-solid" onClick={onConfirm} disabled={deleting}>
                        {deleting ? 'Deleting...' : 'Delete'}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── Detail View ───────────────────────────────────────────
function TestDetail({ test, players, onBack, onDelete }) {
    const player = players.find(p => p.id === test.player_id);
    const playerName = player
        ? `${player.first_name || ''} ${player.last_name || ''}`.trim()
        : 'Unknown Player';
    const date = new Date(test.test_date).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' });
    const phvLabel = { pre: 'Pre-PHV', during: 'During PHV', post: 'Post-PHV' }[test.phv_stage] || test.phv_stage;

    const g = test.gender;
    const p = test.phv_stage;

    return (
        <div id="pt-page">
            <button id="drill-back-btn" onClick={onBack}>
                <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                </svg>
                Back to Results
            </button>

            <div className="pt-detail-header">
                <div className="pt-detail-top">
                    <div>
                        <h2 className="content-header" style={{ padding: 0, marginBottom: '4px' }}>{playerName}</h2>
                        <div className="pt-detail-meta-row">
                            <span className="pt-badge">{date}</span>
                            <span className="pt-badge">{test.gender === 'male' ? 'Male' : 'Female'}</span>
                            <span className="pt-badge">{phvLabel}</span>
                        </div>
                    </div>
                    <button className="drill-btn drill-btn-danger" onClick={() => onDelete(test)}>
                        <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Delete
                    </button>
                </div>
            </div>

            {/* Metrics */}
            <div className="pt-sections-grid">
                {/* Speed */}
                <div className="pt-section-card">
                    <div className="pt-section-title">Court Movement — Speed</div>
                    <MetricRow label="5m Sprint" value={test.sprint_5m} unit="sec" metric="sprint_5m" gender={g} phv={p} />
                    <MetricRow label="10m Sprint" value={test.sprint_10m} unit="sec" metric="sprint_10m" gender={g} phv={p} />
                </div>

                {/* Agility */}
                <div className="pt-section-card">
                    <div className="pt-section-title">Court Movement — Agility</div>
                    <MetricRow label="505 Left Foot" value={test.agility_505_left} unit="sec" metric="agility_505_left" gender={g} phv={p} />
                    <MetricRow label="505 Right Foot" value={test.agility_505_right} unit="sec" metric="agility_505_right" gender={g} phv={p} />
                </div>

                {/* Power */}
                <div className="pt-section-card">
                    <div className="pt-section-title">Lower Body Power</div>
                    <MetricRow label="Vertical Jump (CMJ)" value={test.vertical_jump} unit="cm" metric="vertical_jump" gender={g} phv={p} />
                </div>

                {/* Strength */}
                <div className="pt-section-card">
                    <div className="pt-section-title">Strength</div>
                    <MetricRow label="Front Plank" value={test.front_plank} unit="min" metric="front_plank" gender={g} phv={p} />
                </div>

                {/* Aerobic */}
                <div className="pt-section-card" style={{ gridColumn: 'span 2' }}>
                    <div className="pt-section-title">Aerobic Endurance</div>
                    <MetricRow label="Beep Test" value={test.beep_test} unit="" metric="beep_test" gender={g} phv={p} />
                    {test.phv_stage === 'post' && (
                        <MetricRow label="Yo-Yo IR1" value={test.yoyo_test} unit="" metric="yoyo_test" gender={g} phv={p} />
                    )}
                </div>
            </div>

            {test.notes && (
                <div className="content-box" style={{ padding: '16px 20px' }}>
                    <span className="input-container-label">NOTES</span>
                    <p style={{ fontFamily: "'DM Sans Light', sans-serif", fontSize: '13px', color: 'var(--content-subhead-color)', lineHeight: '1.7', marginTop: '8px' }}>
                        {test.notes}
                    </p>
                </div>
            )}
        </div>
    );
}

// ── TOAST ─────────────────────────────────────────────────
function useToast() {
    const [toast, setToast] = useState({ visible: false, message: '', type: 'green' });
    const timer = useRef(null);
    const show = (message, type = 'green') => {
        clearTimeout(timer.current);
        setToast({ visible: true, message, type });
        timer.current = setTimeout(() => setToast(t => ({ ...t, visible: false })), 3000);
    };
    return { toast, show };
}

// ═══════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════
export default function Testing() {
    const [tests, setTests] = useState([]);
    const [players, setPlayers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [fetchError, setFetchError] = useState(null);

    const [view, setView] = useState('list'); // 'list' | 'detail'
    const [selectedTest, setSelectedTest] = useState(null);
    const [modal, setModal] = useState(null);  // null | 'add' | 'delete'
    const [deleting, setDeleting] = useState(false);

    const [playerFilter, setPlayerFilter] = useState('all');
    const [search, setSearch] = useState('');

    const { toast, show: showToast } = useToast();

    // ── Fetch ──────────────────────────────────────────────
    const fetchData = async () => {
        setIsLoading(true);
        setFetchError(null);

        const [testsRes, playersRes] = await Promise.all([
            supabase.from('performance_tests').select('*').order('test_date', { ascending: false }),
            supabase.from('signin_details').select('id, first_name, last_name, email, role').order('first_name'),
        ]);

        if (testsRes.error) {
            setFetchError('Failed to load test results. Please try again.');
        } else {
            setTests(testsRes.data || []);
        }

        if (!playersRes.error) {
            setPlayers(playersRes.data || []);
        }

        setIsLoading(false);
    };

    useEffect(() => { fetchData(); }, []);

    useEffect(() => {
        const handler = e => { if (e.key === 'Escape') setModal(null); };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, []);

    // ── Save new test ──────────────────────────────────────
    const handleSave = async (form) => {
        const payload = {
            player_id: form.player_id,
            test_date: form.test_date,
            gender: form.gender,
            phv_stage: form.phv_stage,
            sprint_5m: form.sprint_5m !== '' ? parseFloat(form.sprint_5m) : null,
            sprint_10m: form.sprint_10m !== '' ? parseFloat(form.sprint_10m) : null,
            agility_505_left: form.agility_505_left !== '' ? parseFloat(form.agility_505_left) : null,
            agility_505_right: form.agility_505_right !== '' ? parseFloat(form.agility_505_right) : null,
            vertical_jump: form.vertical_jump !== '' ? parseFloat(form.vertical_jump) : null,
            front_plank: form.front_plank !== '' ? parseFloat(form.front_plank) : null,
            beep_test: form.beep_test !== '' ? parseFloat(form.beep_test) : null,
            yoyo_test: form.yoyo_test !== '' ? parseFloat(form.yoyo_test) : null,
            notes: form.notes || null,
        };

        // Optimistic
        const optimistic = { ...payload, id: 'temp-' + Date.now(), created_at: new Date().toISOString() };
        setTests(prev => [optimistic, ...prev]);
        setModal(null);

        const { data, error } = await supabase.from('performance_tests').insert([payload]).select().single();

        if (error) {
            console.error(error);
            setTests(prev => prev.filter(t => t.id !== optimistic.id));
            showToast('Failed to save. Please try again.', 'red');
        } else {
            setTests(prev => prev.map(t => t.id === optimistic.id ? data : t));
            showToast('Test result saved', 'green');
        }
    };

    // ── Delete ─────────────────────────────────────────────
    const handleDeleteConfirm = async () => {
        if (!selectedTest) return;
        setDeleting(true);
        const backup = [...tests];
        setTests(prev => prev.filter(t => t.id !== selectedTest.id));

        const { error } = await supabase.from('performance_tests').delete().eq('id', selectedTest.id);

        if (error) {
            setTests(backup);
            showToast('Failed to delete. Please try again.', 'red');
        } else {
            if (view === 'detail') setView('list');
            showToast('Test result deleted', 'red');
        }

        setDeleting(false);
        setModal(null);
        setSelectedTest(null);
    };

    // ── Filtering ──────────────────────────────────────────
    const filtered = tests.filter(t => {
        const player = players.find(p => p.id === t.player_id);
        const name = player ? `${player.first_name || ''} ${player.last_name || ''}`.toLowerCase() : '';
        const matchesSearch = name.includes(search.toLowerCase());
        const matchesPlayer = playerFilter === 'all' || t.player_id === playerFilter;
        return matchesSearch && matchesPlayer;
    });

    // ── Stats ──────────────────────────────────────────────
    const uniquePlayers = new Set(tests.map(t => t.player_id)).size;
    const latestTest = tests[0];
    const latestPlayer = latestTest ? players.find(p => p.id === latestTest.player_id) : null;
    const latestName = latestPlayer
        ? `${latestPlayer.first_name || ''} ${latestPlayer.last_name || ''}`.trim()
        : '—';

    // ── Loading ────────────────────────────────────────────
    if (isLoading) {
        return (
            <div className="loading-overlay">
                <div className="loading-overlay-spinner"></div>
                <span style={{ color: 'white', fontFamily: "'DM Mono Light', sans-serif", fontSize: '13px' }}>
                    Loading performance tests...
                </span>
            </div>
        );
    }

    // ── Detail view ────────────────────────────────────────
    if (view === 'detail' && selectedTest) {
        return (
            <>
                <TestDetail
                    test={selectedTest}
                    players={players}
                    onBack={() => setView('list')}
                    onDelete={(t) => { setSelectedTest(t); setModal('delete'); }}
                />
                {modal === 'delete' && (
                    <DeleteModal
                        test={selectedTest}
                        players={players}
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

    // ── List view ──────────────────────────────────────────
    return (
        <>
            <div id="pt-page">

                {/* Header */}
                <div className="pt-page-header">
                    <div>
                        <h2 className="content-header" style={{ padding: 0, marginBottom: '4px' }}>
                            Performance Testing
                        </h2>
                        <p className="pt-subtitle">
                            Record and track fitness test results against Tennis Australia benchmarks.
                        </p>
                    </div>
                    <button className="pt-btn pt-btn-primary" onClick={() => setModal('add')}>
                        <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
                        </svg>
                        Add Test Result
                    </button>
                </div>

                {fetchError && (
                    <div className="drill-error-banner">
                        {fetchError}
                        <button className="drill-btn drill-btn-danger" onClick={fetchData}>Retry</button>
                    </div>
                )}

                {/* Stats */}
                <div className="pt-stats-row">
                    <div className="drill-stat-card">
                        <span className="drill-stat-label">Total Records</span>
                        <span className="drill-stat-value accent">{tests.length}</span>
                        <span className="drill-stat-sub">Test sessions logged</span>
                    </div>
                    <div className="drill-stat-card">
                        <span className="drill-stat-label">Players Tested</span>
                        <span className="drill-stat-value">{uniquePlayers}</span>
                        <span className="drill-stat-sub">Unique players</span>
                    </div>
                    <div className="drill-stat-card">
                        <span className="drill-stat-label">Filtered</span>
                        <span className="drill-stat-value">{filtered.length}</span>
                        <span className="drill-stat-sub">Matching filter</span>
                    </div>
                    <div className="drill-stat-card">
                        <span className="drill-stat-label">Last Tested</span>
                        <span className="drill-stat-value" style={{ fontSize: '15px', fontFamily: "'DM Sans Light', sans-serif", fontWeight: 700, paddingTop: '6px' }}>
                            {latestName.substring(0, 18) + (latestName.length > 18 ? '...' : '')}
                        </span>
                    </div>
                </div>

                {/* Toolbar */}
                <div className="pt-main-panel">
                    <div className="pt-toolbar">
                        <div id="drill-search-wrapper" style={{ maxWidth: '280px' }}>
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <input id="drill-search" type="text" placeholder="Search players..." value={search} onChange={e => setSearch(e.target.value)} />
                        </div>

                        {/* Player filter */}
                        <select
                            className="pt-player-filter"
                            value={playerFilter}
                            onChange={e => setPlayerFilter(e.target.value)}
                        >
                            <option value="all">All Players</option>
                            {players.map(p => (
                                <option key={p.id} value={p.id}>
                                    {`${p.first_name || ''} ${p.last_name || ''}`.trim() || p.email}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Results grid or empty */}
                    {filtered.length > 0 ? (
                        <div className="pt-grid">
                            {filtered.map(test => (
                                <TestCard
                                    key={test.id}
                                    test={test}
                                    players={players}
                                    onView={t => { setSelectedTest(t); setView('detail'); }}
                                    onDelete={t => { setSelectedTest(t); setModal('delete'); }}
                                />
                            ))}
                        </div>
                    ) : (
                        <EmptyState onAdd={() => setModal('add')} />
                    )}
                </div>
            </div>

            {modal === 'add' && (
                <TestFormModal
                    players={players}
                    onSave={handleSave}
                    onClose={() => setModal(null)}
                />
            )}
            {modal === 'delete' && selectedTest && (
                <DeleteModal
                    test={selectedTest}
                    players={players}
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
