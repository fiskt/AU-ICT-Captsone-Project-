import { useEffect, useState, useRef } from "react";
import { supabase } from "../supabaseClient";
import {
    Chart as ChartJS,
    RadialLinearScale,
    PointElement,
    LineElement,
    Filler,
    Tooltip,
    Legend,
} from 'chart.js';
import { Radar } from 'react-chartjs-2';

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

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

function getRating(value, metric, gender, phv) {
    if (value === null || value === undefined || value === '') return null;
    const bench = BENCHMARKS[gender]?.[phv]?.[metric];
    if (!bench) return null;
    const v = parseFloat(value);
    const { lower_is_better } = bench;
    if (lower_is_better) {
        if (bench.excellent[1] !== null && v < bench.excellent[1]) return 'excellent';
        if (bench.good[1] !== null && v <= bench.good[1]) return 'good';
        if (bench.average[1] !== null && v <= bench.average[1]) return 'average';
        return 'poor';
    } else {
        if (bench.excellent[0] !== null && v >= bench.excellent[0]) return 'excellent';
        if (bench.good[0] !== null && v >= bench.good[0]) return 'good';
        if (bench.average[0] !== null && v >= bench.average[0]) return 'average';
        return 'poor';
    }
}

function RatingBadge({ rating }) {
    if (!rating) return <span className="pt-rating pt-rating-na">N/A</span>;
    return <span className={`pt-rating pt-rating-${rating}`}>{rating}</span>;
}

function MetricRow({ label, value, unit, metric, gender, phv }) {
    const rating = value !== null && value !== undefined && value !== ''
        ? getRating(value, metric, gender, phv) : null;
    return (
        <div className="pt-metric-row">
            <span className="pt-metric-label">{label}</span>
            <span className="pt-metric-value">
                {value !== null && value !== undefined && value !== ''
                    ? `${value}${unit ? ' ' + unit : ''}` : '—'}
            </span>
            <RatingBadge rating={rating} />
        </div>
    );
}

function metricToScore(value, metric, gender, phv) {
    if (value === null || value === undefined || value === '') return null;
    const rating = getRating(value, metric, gender, phv);
    if (!rating) return null;
    const bench = BENCHMARKS[gender]?.[phv]?.[metric];
    if (!bench) return null;
    const v = parseFloat(value);
    const { lower_is_better } = bench;
    if (lower_is_better) {
        const excMax = bench.excellent[1];
        const goodMax = bench.good[1];
        const avgMax = bench.average[1];
        if (excMax !== null && v < excMax) {
            const ratio = Math.max(0, 1 - (v / excMax) * 0.5);
            return Math.min(100, Math.round(85 + ratio * 15));
        }
        if (goodMax !== null && v <= goodMax) {
            const range = goodMax - (excMax ?? goodMax * 0.9);
            const ratio = range > 0 ? 1 - ((v - (excMax ?? goodMax * 0.9)) / range) : 0.5;
            return Math.round(70 + ratio * 15);
        }
        if (avgMax !== null && v <= avgMax) {
            const range = avgMax - (goodMax ?? avgMax * 0.9);
            const ratio = range > 0 ? 1 - ((v - (goodMax ?? avgMax * 0.9)) / range) : 0.5;
            return Math.round(40 + ratio * 30);
        }
        return 35;
    } else {
        const excMin = bench.excellent[0];
        const goodMin = bench.good[0];
        const avgMin = bench.average[0];
        if (excMin !== null && v >= excMin) {
            const ratio = Math.min(1, (v - excMin) / (excMin * 0.15 + 1));
            return Math.min(100, Math.round(85 + ratio * 15));
        }
        if (goodMin !== null && v >= goodMin) {
            const range = (excMin ?? goodMin * 1.1) - goodMin;
            const ratio = range > 0 ? (v - goodMin) / range : 0.5;
            return Math.round(70 + ratio * 15);
        }
        if (avgMin !== null && v >= avgMin) {
            const range = (goodMin ?? avgMin * 1.1) - avgMin;
            const ratio = range > 0 ? (v - avgMin) / range : 0.5;
            return Math.round(40 + ratio * 30);
        }
        return 35;
    }
}

function useIsMobile() {
    const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
    useEffect(() => {
        const handler = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handler);
        return () => window.removeEventListener('resize', handler);
    }, []);
    return isMobile;
}

function SpiderGraph({ test }) {
    const isMobile = useIsMobile();
    const g = test.gender;
    const p = test.phv_stage;

    const allMetrics = [
        { key: 'sprint_5m',         label: isMobile ? '5m' : '5m Speed'      },
        { key: 'sprint_10m',        label: isMobile ? '10m' : '10m Speed'     },
        { key: 'agility_505_left',  label: isMobile ? 'Agil L' : 'Agility (L)'   },
        { key: 'agility_505_right', label: isMobile ? 'Agil R' : 'Agility (R)'   },
        { key: 'vertical_jump',     label: 'Jump'          },
        { key: 'front_plank',       label: 'Plank'         },
        { key: 'beep_test',         label: isMobile ? 'Beep' : 'Beep Test'     },
        ...(test.phv_stage === 'post' ? [{ key: 'yoyo_test', label: 'Yo-Yo' }] : []),
    ];

    const metrics = allMetrics.filter(m =>
        test[m.key] !== null && test[m.key] !== undefined && test[m.key] !== ''
    );

    if (metrics.length < 3) {
        return (
            <div className="pt-spider-empty">
                <span>Enter at least 3 metrics to display the performance chart.</span>
            </div>
        );
    }

    const scores = metrics.map(m => metricToScore(test[m.key], m.key, g, p) ?? 0);
    const labels = metrics.map(m => m.label);

    const ratingCounts = { excellent: 0, good: 0, average: 0, poor: 0 };
    scores.forEach(s => {
        if (s >= 85) ratingCounts.excellent++;
        else if (s >= 70) ratingCounts.good++;
        else if (s >= 40) ratingCounts.average++;
        else ratingCounts.poor++;
    });

    const data = {
        labels,
        datasets: [
            {
                label: 'Performance Score',
                data: scores,
                backgroundColor: 'rgba(236, 120, 66, 0.15)',
                borderColor: '#ec7842',
                borderWidth: 2.5,
                pointBackgroundColor: '#ec7842',
                pointBorderColor: '#ffffff',
                pointBorderWidth: 2,
                pointRadius: isMobile ? 4 : 5,
                pointHoverRadius: isMobile ? 6 : 7,
                pointHoverBackgroundColor: '#ec7842',
                pointHoverBorderColor: '#ffffff',
                pointHoverBorderWidth: 2,
            },
            {
                label: 'Good Threshold',
                data: metrics.map(() => 70),
                backgroundColor: 'transparent',
                borderColor: 'rgba(100, 116, 139, 0.3)',
                borderWidth: 1.5,
                borderDash: [4, 4],
                pointRadius: 0,
                pointHoverRadius: 0,
            },
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: true,
        interaction: { mode: 'nearest' },
        plugins: {
            legend: {
                display: true,
                position: 'bottom',
                labels: {
                    font: { family: "'DM Sans Light', sans-serif", size: isMobile ? 10 : 11 },
                    color: '#6b6760',
                    usePointStyle: true,
                    pointStyleWidth: 8,
                    padding: isMobile ? 10 : 16,
                    filter: (item) => item.text !== 'Good Threshold',
                },
            },
            tooltip: {
                backgroundColor: '#1a1917',
                titleFont: { family: "'DM Mono Light', sans-serif", size: 11 },
                bodyFont: { family: "'DM Sans Light', sans-serif", size: 12 },
                padding: 12,
                cornerRadius: 8,
                callbacks: {
                    title: (items) => items[0]?.label || '',
                    label: (item) => {
                        if (item.datasetIndex === 1) return null;
                        const score = item.raw;
                        const rating =
                            score >= 85 ? 'Excellent' :
                            score >= 70 ? 'Good' :
                            score >= 40 ? 'Average' : 'Poor';
                        const metricKey = metrics[item.dataIndex]?.key;
                        const rawValue = test[metricKey];
                        const bench = BENCHMARKS[g]?.[p]?.[metricKey];
                        const unit = bench?.lower_is_better ? 'sec' :
                            metricKey === 'vertical_jump' ? 'cm' :
                            metricKey === 'front_plank' ? 'min' : '';
                        return [
                            ` Score: ${score}/100 (${rating})`,
                            ` Value: ${rawValue}${unit ? ' ' + unit : ''}`,
                        ];
                    },
                    labelColor: () => ({
                        borderColor: '#ec7842',
                        backgroundColor: '#ec7842',
                        borderRadius: 3,
                    }),
                },
            },
        },
        scales: {
            r: {
                min: 0,
                max: 100,
                ticks: {
                    stepSize: 25,
                    font: { family: "'DM Mono Light', sans-serif", size: isMobile ? 7 : 9 },
                    color: '#a09d96',
                    backdropColor: 'transparent',
                    callback: (value) => {
                        if (value === 0) return '';
                        if (value === 40) return 'Avg';
                        if (value === 70) return 'Good';
                        if (value === 100) return 'Exc';
                        return '';
                    },
                },
                grid: {
                    color: (ctx) => ctx.tick?.value === 70
                        ? 'rgba(100, 116, 139, 0.35)'
                        : 'rgba(221, 219, 214, 0.6)',
                    lineWidth: (ctx) => ctx.tick?.value === 70 ? 1.5 : 1,
                },
                angleLines: { color: 'rgba(221, 219, 214, 0.8)', lineWidth: 1 },
                pointLabels: {
                    font: { family: "'DM Mono Light', sans-serif", size: isMobile ? 9 : 10 },
                    color: '#2e2c29',
                    padding: isMobile ? 4 : 8,
                },
            },
        },
    };

    return (
        <div className="pt-spider-card">
            <div className="pt-spider-header">
                <div className="pt-section-title" style={{ marginBottom: 0, border: 'none', paddingBottom: 0 }}>
                    Performance Overview
                </div>
                <div className="pt-spider-summary">
                    {ratingCounts.excellent > 0 && <span className="pt-rating pt-rating-excellent">{ratingCounts.excellent} Excellent</span>}
                    {ratingCounts.good > 0 && <span className="pt-rating pt-rating-good">{ratingCounts.good} Good</span>}
                    {ratingCounts.average > 0 && <span className="pt-rating pt-rating-average">{ratingCounts.average} Average</span>}
                    {ratingCounts.poor > 0 && <span className="pt-rating pt-rating-poor">{ratingCounts.poor} Poor</span>}
                </div>
            </div>
            <div className="pt-spider-chart-wrap">
                <Radar data={data} options={options} />
            </div>
            <p className="pt-spider-note">
                Scores normalised to 0–100. Dashed line = Good threshold (70). Hover each point for details.
            </p>
        </div>
    );
}

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
            <div className="pt-card-ratings-row">
                {metrics.map(m => {
                    const rating = test[m] !== null && test[m] !== undefined && test[m] !== ''
                        ? getRating(test[m], m, test.gender, test.phv_stage) : null;
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

// Field is defined outside TestFormModal so its identity stays stable across renders.
// Defining it inside TestFormModal caused React to treat it as a new component type on every
// keystroke (because the function reference changes), which unmounted/remounted the input
// and stole focus after each character typed.
function Field({ label, field, placeholder, step = '0.01', hint, form, update }) {
    return (
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
}

function TestFormModal({ players, onSave, onClose }) {
    const isMobile = useIsMobile();
    const EMPTY = {
        player_id: '', test_date: new Date().toISOString().split('T')[0],
        gender: 'male', phv_stage: 'post',
        sprint_5m: '', sprint_10m: '', agility_505_left: '', agility_505_right: '',
        vertical_jump: '', front_plank: '', beep_test: '', yoyo_test: '', notes: '',
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

                    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '14px' }}>
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

                    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '14px' }}>
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

                    <div className="pt-section-label"><span>1. Court Movement — Speed & Acceleration</span></div>
                    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '14px' }}>
                        <Field label="5m Sprint (sec)" field="sprint_5m" placeholder="e.g. 1.10" hint="Lower is better"  form={form} update={update} />
                        <Field label="10m Sprint (sec)" field="sprint_10m" placeholder="e.g. 2.00" hint="Lower is better"  form={form} update={update} />
                    </div>

                    <div className="pt-section-label"><span>1. Court Movement — Modified 505 Agility</span></div>
                    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '14px' }}>
                        <Field label="505 Left Foot (sec)" field="agility_505_left" placeholder="e.g. 2.80" hint="Lower is better"  form={form} update={update} />
                        <Field label="505 Right Foot (sec)" field="agility_505_right" placeholder="e.g. 2.80" hint="Lower is better"  form={form} update={update} />
                    </div>

                    <div className="pt-section-label"><span>2. Lower Body Power — CMJ</span></div>
                    <Field label="Vertical Jump (cm)" field="vertical_jump" placeholder="e.g. 55" step="0.5" hint="Higher is better"  form={form} update={update} />

                    <div className="pt-section-label"><span>3. Strength — Plank Endurance</span></div>
                    <Field label="Front Plank (min)" field="front_plank" placeholder="e.g. 4.5" hint="Higher is better"  form={form} update={update} />

                    <div className="pt-section-label"><span>4. Aerobic Endurance</span></div>
                    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '14px' }}>
                        <Field label="Beep Test (level.shuttle)" field="beep_test" placeholder="e.g. 11.4" hint="e.g. 11.4 = Level 11, Shuttle 4"  form={form} update={update} />
                        {showYoyo
                            ? <Field label="Yo-Yo IR1 (level.shuttle)" field="yoyo_test" placeholder="e.g. 21" hint="Post-PHV only"  form={form} update={update} />
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

function TestDetail({ test, players, onBack, onDelete }) {
    const isMobile = useIsMobile();
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
                <div style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    gap: '16px',
                    flexDirection: isMobile ? 'column' : 'row',
                }}>
                    <div>
                        <h2 className="content-header" style={{ padding: 0, marginBottom: '4px' }}>{playerName}</h2>
                        <div className="pt-detail-meta-row">
                            <span className="pt-badge">{date}</span>
                            <span className="pt-badge">{test.gender === 'male' ? 'Male' : 'Female'}</span>
                            <span className="pt-badge">{phvLabel}</span>
                        </div>
                    </div>
                    <button
                        className="drill-btn drill-btn-danger"
                        onClick={() => onDelete(test)}
                        style={isMobile ? { alignSelf: 'flex-start' } : {}}
                    >
                        <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Delete
                    </button>
                </div>
            </div>

            <SpiderGraph test={test} />

            <div style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
                gap: '16px',
            }}>
                <div className="pt-section-card">
                    <div className="pt-section-title">Court Movement — Speed</div>
                    <MetricRow label="5m Sprint" value={test.sprint_5m} unit="sec" metric="sprint_5m" gender={g} phv={p} />
                    <MetricRow label="10m Sprint" value={test.sprint_10m} unit="sec" metric="sprint_10m" gender={g} phv={p} />
                </div>

                <div className="pt-section-card">
                    <div className="pt-section-title">Court Movement — Agility</div>
                    <MetricRow label="505 Left Foot" value={test.agility_505_left} unit="sec" metric="agility_505_left" gender={g} phv={p} />
                    <MetricRow label="505 Right Foot" value={test.agility_505_right} unit="sec" metric="agility_505_right" gender={g} phv={p} />
                </div>

                <div className="pt-section-card">
                    <div className="pt-section-title">Lower Body Power</div>
                    <MetricRow label="Vertical Jump (CMJ)" value={test.vertical_jump} unit="cm" metric="vertical_jump" gender={g} phv={p} />
                </div>

                <div className="pt-section-card">
                    <div className="pt-section-title">Strength</div>
                    <MetricRow label="Front Plank" value={test.front_plank} unit="min" metric="front_plank" gender={g} phv={p} />
                </div>

                <div className="pt-section-card" style={{ gridColumn: isMobile ? '1' : 'span 2' }}>
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

export default function Testing() {
    const isMobile = useIsMobile();
    const [tests, setTests] = useState([]);
    const [players, setPlayers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [fetchError, setFetchError] = useState(null);
    const [view, setView] = useState('list');
    const [selectedTest, setSelectedTest] = useState(null);
    const [modal, setModal] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const [playerFilter, setPlayerFilter] = useState('all');
    const [search, setSearch] = useState('');
    const { toast, show: showToast } = useToast();

    const fetchData = async () => {
        setIsLoading(true);
        setFetchError(null);
        const [testsRes, playersRes] = await Promise.all([
            supabase.from('performance_tests').select('*').order('test_date', { ascending: false }),
            supabase.from('signin_details').select('id, first_name, last_name, email, role').order('first_name'),
        ]);
        if (testsRes.error) setFetchError('Failed to load test results. Please try again.');
        else setTests(testsRes.data || []);
        if (!playersRes.error) setPlayers(playersRes.data || []);
        setIsLoading(false);
    };

    useEffect(() => { fetchData(); }, []);
    useEffect(() => {
        const handler = e => { if (e.key === 'Escape') setModal(null); };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, []);
    const metricLabels = {
    sprint_5m: "5m Sprint",
    sprint_10m: "10m Sprint",
    agility_505_left: "505 Agility Left",
    agility_505_right: "505 Agility Right",
    vertical_jump: "Vertical Jump",
    front_plank: "Front Plank",
    beep_test: "Beep Test",
    yoyo_test: "Yo-Yo Test",
    };

    function getStrengthWeaknessFromTest(test) {
        const metrics = Object.keys(metricLabels);
        const strengths = [];
        const weaknesses = [];

        metrics.forEach(metric => {
            const value = test[metric];
            if (value === null || value === undefined || value === "") return;
            const rating = getRating(value, metric, test.gender, test.phv_stage);
            if (rating === "excellent" || rating === "good") {strengths.push(metricLabels[metric]);}
            if (rating === "average" || rating === "poor") {weaknesses.push(metricLabels[metric]);}
        });

        return { strengths, weaknesses };
    }

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
        const optimistic = { ...payload, id: 'temp-' + Date.now(), created_at: new Date().toISOString() };
        setTests(prev => [optimistic, ...prev]);
        setModal(null);
        const { data, error } = await supabase.from('performance_tests').insert([payload]).select().single();
        if (error) {
            setTests(prev => prev.filter(t => t.id !== optimistic.id));
            showToast('Failed to save. Please try again.', 'red');
        } else {
        const { strengths, weaknesses } = getStrengthWeaknessFromTest(data);

        const { error: detailsError } = await supabase.from("player_details").upsert({
                id: data.player_id,
                strengths: strengths,
                weaknesses: weaknesses,
            });

        if (detailsError) {
            console.error("Failed to update player details:", detailsError.message);
            showToast("Test saved, but player details failed.", "red");
        } else {
            showToast("Test result saved", "green");
        }

        setTests(prev => prev.map(t => t.id === optimistic.id ? data : t));
    }
    };

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

    const filtered = tests.filter(t => {
        const player = players.find(p => p.id === t.player_id);
        const name = player ? `${player.first_name || ''} ${player.last_name || ''}`.toLowerCase() : '';
        return name.includes(search.toLowerCase()) && (playerFilter === 'all' || t.player_id === playerFilter);
    });

    const uniquePlayers = new Set(tests.map(t => t.player_id)).size;
    const latestTest = tests[0];
    const latestPlayer = latestTest ? players.find(p => p.id === latestTest.player_id) : null;
    const latestName = latestPlayer
        ? `${latestPlayer.first_name || ''} ${latestPlayer.last_name || ''}`.trim() : '—';

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

    return (
        <>
            <div id="pt-page">
                <div style={{
                    display: 'flex',
                    alignItems: isMobile ? 'stretch' : 'flex-start',
                    justifyContent: 'space-between',
                    flexDirection: isMobile ? 'column' : 'row',
                    gap: '12px',
                }}>
                    <div>
                        <h2 className="content-header" style={{ padding: 0, marginBottom: '4px' }}>
                            Performance Testing
                        </h2>
                        <p className="pt-subtitle">
                            Record and track fitness test results against Tennis Australia benchmarks.
                        </p>
                    </div>
                    <button
                        className="pt-btn pt-btn-primary"
                        onClick={() => setModal('add')}
                        style={isMobile ? { width: '100%', justifyContent: 'center' } : {}}
                    >
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

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
                    gap: isMobile ? '10px' : '16px',
                }}>
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

                <div className="pt-main-panel">
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        flexWrap: 'wrap',
                        flexDirection: isMobile ? 'column' : 'row',
                    }}>
                        <div id="drill-search-wrapper" style={{ maxWidth: isMobile ? '100%' : '280px', width: isMobile ? '100%' : undefined }}>
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <input
                                id="drill-search"
                                type="text"
                                placeholder="Search players..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                style={isMobile ? { width: '100%' } : {}}
                            />
                        </div>
                        <select
                            className="pt-player-filter"
                            value={playerFilter}
                            onChange={e => setPlayerFilter(e.target.value)}
                            style={isMobile ? { width: '100%' } : {}}
                        >
                            <option value="all">All Players</option>
                            {players.map(p => (
                                <option key={p.id} value={p.id}>
                                    {`${p.first_name || ''} ${p.last_name || ''}`.trim() || p.email}
                                </option>
                            ))}
                        </select>
                    </div>

                    {filtered.length > 0 ? (
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
                            gap: '14px',
                            overflowY: 'auto',
                        }}>
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
