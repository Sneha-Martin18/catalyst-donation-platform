import React, { useState, useEffect } from 'react';
import { LEVEL_1_PUZZLES } from './puzzleData';

const Level1 = ({ onComplete, onFail }) => {
    const [puzzle, setPuzzle] = useState(null);
    const [selectedOption, setSelectedOption] = useState(null);
    const [submitted, setSubmitted] = useState(false);

    // Pick random puzzle on mount
    useEffect(() => {
        const randomIndex = Math.floor(Math.random() * LEVEL_1_PUZZLES.length);
        setPuzzle(LEVEL_1_PUZZLES[randomIndex]);
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
            <h3 className="logic-level-title">Level 1: Pattern Recognition</h3>
            <p className="logic-level-desc">{puzzle.description || "Find the missing number in the sequence."}</p>

            <div className="logic-sequence-display">
                {puzzle.sequence.map((item, index) => (
                    <span key={index} style={{ color: item === '?' ? 'var(--mint-dark, #1f7a6e)' : 'inherit', fontWeight: item === '?' ? 'bold' : 'normal' }}>
                        {item}
                    </span>
                ))}
            </div>

            <div className="logic-grid-opts">
                {puzzle.options.map((option) => (
                    <button
                        key={option}
                        onClick={() => {
                            if (!submitted) setSelectedOption(option);
                        }}
                        disabled={submitted}
                        className={`
              logic-opt-btn
              ${selectedOption === option ? 'selected' : ''}
              ${submitted && option === puzzle.correctAnswer ? 'correct' : ''}
              ${submitted && selectedOption === option && option !== puzzle.correctAnswer ? 'wrong' : ''}
            `}
                        style={{ width: '100%', fontSize: '1.25rem' }}
                    >
                        {option}
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
                    : "Submit Answer"}
            </button>
        </div>
    );
};

export default Level1;
