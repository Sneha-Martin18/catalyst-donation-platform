import React, { useState, useEffect } from 'react';
import { LEVEL_2_PUZZLES } from './puzzleData';

const Level2 = ({ onComplete, onFail }) => {
    const [puzzle, setPuzzle] = useState(null);
    const [selectedOption, setSelectedOption] = useState(null);
    const [submitted, setSubmitted] = useState(false);

    // Pick random puzzle on mount
    useEffect(() => {
        const randomIndex = Math.floor(Math.random() * LEVEL_2_PUZZLES.length);
        setPuzzle(LEVEL_2_PUZZLES[randomIndex]);
    }, []);

    const handleSubmit = () => {
        if (selectedOption === null || !puzzle) return;
        setSubmitted(true);

        if (selectedOption === puzzle.correctAnswer) {
            setTimeout(() => onComplete(), 1000);
        } else {
            setTimeout(() => onFail(), 1000);
        }
    };

    if (!puzzle) return <div>Loading Puzzle...</div>;

    return (
        <div>
            <h3 className="logic-level-title">Level 2: Logical Deduction</h3>
            <p className="logic-level-desc">{puzzle.description || "Read the statements carefully and identify the winner."}</p>

            <div style={{ background: '#fef3c7', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #fcd34d', marginBottom: '1.5rem', whiteSpace: 'pre-line', fontSize: '0.95rem', color: '#78350f', fontWeight: '500' }}>
                {puzzle.question}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
                {puzzle.options.map((option) => (
                    <button
                        key={option.id}
                        onClick={() => {
                            if (!submitted) setSelectedOption(option.id);
                        }}
                        disabled={submitted}
                        className={`
              logic-opt-btn
              ${selectedOption === option.id ? 'selected' : ''}
              ${submitted && option.id === puzzle.correctAnswer ? 'correct' : ''}
              ${submitted && selectedOption === option.id && option.id !== puzzle.correctAnswer ? 'wrong' : ''}
            `}
                        style={{ width: '100%', textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                    >
                        <span>{option.label}</span>
                        {submitted && option.id === puzzle.correctAnswer && <span style={{ color: '#16a34a' }}>✓</span>}
                        {submitted && selectedOption === option.id && option.id !== puzzle.correctAnswer && <span style={{ color: '#dc2626' }}>✗</span>}
                    </button>
                ))}
            </div>

            <button
                onClick={handleSubmit}
                disabled={selectedOption === null || submitted}
                className="logic-action-btn"
            >
                {submitted
                    ? (selectedOption === puzzle.correctAnswer ? "Correct!" : "Incorrect")
                    : "Submit Deduction"}
            </button>
        </div>
    );
};

export default Level2;
