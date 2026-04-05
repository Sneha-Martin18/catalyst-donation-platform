import React, { useState, useEffect } from 'react';
import { LEVEL_3_PUZZLES } from './puzzleData';

const Level3 = ({ onComplete, onFail }) => {
    const [puzzle, setPuzzle] = useState(null);
    const [slots, setSlots] = useState(['?', '?', '?']);
    const [feedback, setFeedback] = useState('');
    const [submitted, setSubmitted] = useState(false);

    // Pick random puzzle on mount
    useEffect(() => {
        const randomIndex = Math.floor(Math.random() * LEVEL_3_PUZZLES.length);
        setPuzzle(LEVEL_3_PUZZLES[randomIndex]);
    }, []);

    if (!puzzle) return <div>Loading Logic Grids...</div>;

    const handleSlotClick = (index) => {
        if (submitted) return;

        setSlots(current => {
            const newSlots = [...current];
            const currentColor = newSlots[index];
            let nextColorIndex = 0;

            if (currentColor !== '?') {
                const currentIndex = puzzle.items.indexOf(currentColor);
                nextColorIndex = (currentIndex + 1) % puzzle.items.length;
            }

            newSlots[index] = puzzle.items[nextColorIndex];
            return newSlots;
        });
        setFeedback(''); // Clear error on change
    };

    const validate = () => {
        // Check if all slots are filled
        if (slots.includes('?')) {
            setFeedback('Please fill all slots before submitting.');
            return false;
        }

        const counts = {};
        slots.forEach(c => counts[c] = (counts[c] || 0) + 1);
        const isPermutation = Object.values(counts).every(c => c === 1) && Object.keys(counts).length === 3;

        if (!isPermutation) {
            setFeedback("You must use each item exactly once.");
            return false;
        }

        const result = puzzle.validate(slots);
        if (!result.valid) {
            setFeedback("Rule Violation: " + result.message);
            return false;
        }

        return true;
    };

    const handleSubmit = () => {
        if (submitted) return;

        if (validate()) {
            setSubmitted(true);
            setFeedback('All constraints satisfied! logic verified.');
            setTimeout(() => onComplete(), 1500);
        } else {
            // Allow user to see feedback briefly before marking attempt
            setTimeout(() => onFail(), 1500);
        }
    };

    const getColorStyle = (item) => {
        if (item === '?') return { backgroundColor: '#e5e7eb', color: '#9ca3af', borderColor: '#d1d5db' };

        const colorsMap = {
            'Red': { backgroundColor: '#ef4444', color: 'white', borderColor: '#b91c1c' },
            'Green': { backgroundColor: '#22c55e', color: 'white', borderColor: '#15803d' },
            'Blue': { backgroundColor: '#3b82f6', color: 'white', borderColor: '#1d4ed8' },
            'Apple': { backgroundColor: '#ef4444', color: 'white', borderColor: '#b91c1c' },
            'Banana': { backgroundColor: '#fbbf24', color: 'black', borderColor: '#d97706' },
            'Cherry': { backgroundColor: '#be123c', color: 'white', borderColor: '#4c0519' },
            'Cat': { backgroundColor: '#f97316', color: 'white', borderColor: '#c2410c' },
            'Dog': { backgroundColor: '#78350f', color: 'white', borderColor: '#451a03' },
            'Bird': { backgroundColor: '#06b6d4', color: 'white', borderColor: '#0891b2' }
        };

        const key = Object.keys(colorsMap).find(k => item.includes(k));
        return colorsMap[key] || { backgroundColor: 'var(--mint-main)', color: 'white', borderColor: 'var(--mint-dark)' };
    };

    return (
        <div>
            <h3 className="logic-level-title">Level 3: Constraint Logic</h3>
            <p className="logic-level-desc">Arrange the colors to satisfy all conditions.</p>

            <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', marginBottom: '1.5rem' }}>
                <h4 style={{ fontWeight: '600', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Rules:</h4>
                <ul style={{ paddingLeft: '0', listStyle: 'none', fontSize: '0.875rem', color: '#334155' }}>
                    {puzzle.rules.map((rule, idx) => (
                        <li key={idx} style={{ marginBottom: '0.25rem', display: 'flex', alignItems: 'flex-start' }}>
                            <span style={{ marginRight: '0.5rem' }}>•</span> {rule}
                        </li>
                    ))}
                </ul>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                {slots.map((color, index) => (
                    <div key={index} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <span style={{ marginBottom: '0.25rem', fontSize: '0.75rem', color: '#64748b' }}>Slot {index + 1}</span>
                        <button
                            onClick={() => handleSlotClick(index)}
                            style={{
                                width: '4rem',
                                height: '4rem',
                                borderRadius: '0.5rem',
                                borderWidth: '2px',
                                borderStyle: 'solid',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                                transition: 'transform 0.1s',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                ...getColorStyle(color)
                            }}
                            disabled={submitted}
                        >
                            <div style={{ fontSize: color === '?' ? '1rem' : '0.7rem', textAlign: 'center', lineHeight: '1.1' }}>
                                {color === '?' ? 'Tap' : color}
                            </div>
                        </button>
                    </div>
                ))}
            </div>

            {feedback && (
                <div className={`logic-feedback ${feedback.includes('Violation') || feedback.includes('fill') || feedback.includes('once') ? 'error' : 'success'}`}>
                    {feedback}
                </div>
            )}

            <button
                onClick={handleSubmit}
                disabled={submitted}
                className="logic-action-btn"
            >
                {submitted ? "System Unlocked" : "Validate Sequence"}
            </button>
        </div>
    );
};

export default Level3;
