import React, { useState, useEffect } from 'react';
import GameCard from './GameCard';
import Level1 from './Level1';
import Level2 from './Level2';
import Level3 from './Level3';
import RewardService from '../../api/mockRewardService'; // Import Service

const GameController = ({ onClose }) => {
    const [currentLevel, setCurrentLevel] = useState(1);
    const [gameStatus, setGameStatus] = useState('start'); // start, playing, won, lost
    const [timeLeft, setTimeLeft] = useState(300); // 5 minutes total
    const [reward, setReward] = useState(null); // Store won reward
    const [attempts, setAttempts] = useState(0);
    const maxAttempts = 3;

    useEffect(() => {
        let timer;
        if (gameStatus === 'playing' && timeLeft > 0) {
            timer = setInterval(() => {
                setTimeLeft(prev => {
                    if (prev <= 1) {
                        setGameStatus('lost');
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [gameStatus, timeLeft]);

    const startGame = () => {
        setGameStatus('playing');
        setCurrentLevel(1);
        setTimeLeft(300);
        setAttempts(0);
    };

    const handleLevelComplete = () => {
        if (currentLevel < 3) {
            setCurrentLevel(prev => prev + 1);
        } else {
            setGameStatus('won');
            claimReward();
        }
    };

    const handleLevelFail = () => {
        setAttempts(prev => prev + 1);
        if (attempts + 1 >= maxAttempts) {
            setGameStatus('lost');
        }
    };

    const claimReward = async () => {
        try {
            console.log('Claiming reward...');
            const newReward = RewardService.claimReward();
            if (newReward) {
                setReward(newReward);
            } else {
                // Handle case where user already has a reward or something
                setReward(RewardService.getUnusedReward());
            }
        } catch (error) {
            console.error('Error claiming reward:', error);
        }
    };

    const formatTime = (seconds) => {
        const min = Math.floor(seconds / 60);
        const sec = seconds % 60;
        return `${min}:${sec < 10 ? '0' : ''}${sec}`;
    };

    const renderContent = () => {
        if (gameStatus === 'start') {
            return (
                <div style={{ textAlign: 'center', padding: '1rem' }}>
                    <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--mint-dark, #1f7a6e)' }}>Logic Challenge</h3>
                    <p style={{ marginBottom: '1.5rem', color: '#4b5563' }}>
                        Complete 3 levels of logic puzzles to unlock a special reward.
                    </p>
                    <ul style={{ textAlign: 'left', marginBottom: '2rem', background: '#f0fdf4', padding: '1rem', borderRadius: '0.5rem', fontSize: '0.875rem', color: '#065f46' }}>
                        <li style={{ marginBottom: '0.5rem' }}>• Level 1: Pattern Recognition</li>
                        <li style={{ marginBottom: '0.5rem' }}>• Level 2: Logical Deduction</li>
                        <li style={{ marginBottom: '0.5rem' }}>• Level 3: Constraint Logic</li>
                        <li>• Time Limit: 5 Minutes Total</li>
                    </ul>
                    <button
                        onClick={startGame}
                        className="logic-action-btn"
                        style={{ fontSize: '1.1rem', padding: '1rem' }}
                    >
                        Start Challenge
                    </button>
                </div>
            );
        }

        if (gameStatus === 'won') {
            return (
                <div style={{ textAlign: 'center', padding: '1rem' }}>
                    <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🏆</div>
                    <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: '#15803d' }}>Challenge Complete!</h3>
                    <p style={{ marginBottom: '1.5rem', color: '#166534' }}>
                        {reward ? `You've unlocked: ${reward.rewardLabel}` : "You've unlocked a special donation boost."}
                    </p>
                    {reward && (
                        <div style={{ background: '#f0fdf4', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #bbf7d0', marginBottom: '1.5rem' }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#15803d', textTransform: 'uppercase' }}>Your Reward Code</span>
                            <div style={{ fontSize: '1.5rem', fontFamily: 'monospace', fontWeight: 'bold', color: '#166534', marginTop: '0.5rem' }}>{reward.code}</div>
                            <p style={{ fontSize: '0.9rem', color: '#15803d', marginTop: '0.5rem' }}>{reward.rewardDescription}</p>
                            <p style={{ fontSize: '0.75rem', color: '#78350f', marginTop: '0.5rem', fontStyle: 'italic' }}>
                                Note: This reward will be automatically applied to your next donation.
                            </p>
                        </div>
                    )}
                    {!reward && (
                        <div style={{ padding: '1rem', background: '#fffbeb', color: '#92400e', borderRadius: '0.5rem', marginBottom: '1rem' }}>
                            You might already have an active reward! Check your dashboard.
                        </div>
                    )}
                    <button
                        onClick={onClose}
                        className="logic-action-btn"
                        style={{ backgroundColor: '#15803d' }}
                    >
                        Claim & Close
                    </button>
                </div>
            );
        }

        if (gameStatus === 'lost') {
            return (
                <div style={{ textAlign: 'center', padding: '1rem' }}>
                    <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>❌</div>
                    <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: '#b91c1c' }}>Game Over</h3>
                    <p style={{ marginBottom: '1.5rem', color: '#4b5563' }}>
                        {timeLeft === 0 ? "Time's up!" : "Too many incorrect attempts."}
                    </p>
                    <button
                        onClick={startGame}
                        className="logic-action-btn"
                        style={{ marginBottom: '0.5rem' }}
                    >
                        Try Again
                    </button>
                    <button
                        onClick={onClose}
                        style={{ background: 'none', border: 'none', color: '#6b7280', marginTop: '1rem', cursor: 'pointer', textDecoration: 'underline' }}
                    >
                        Close
                    </button>
                </div>
            );
        }

        return (
            <div style={{ position: 'relative' }}>
                {/* Progress Bar */}
                <div style={{ background: '#f3f4f6', height: '8px', width: '100%', borderRadius: '4px', overflow: 'hidden', marginBottom: '1rem' }}>
                    <div
                        style={{
                            background: 'var(--mint-dark, #1f7a6e)',
                            height: '100%',
                            width: `${(currentLevel - 1) * 33.33}%`,
                            transition: 'width 0.5s ease'
                        }}
                    />
                </div>

                {/* Header HUD */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '1rem', borderBottom: '1px solid #e5e7eb', marginBottom: '1rem', fontSize: '0.875rem', fontWeight: 'bold', color: '#4b5563' }}>
                    <span>Level {currentLevel}/3</span>
                    <span style={{ color: timeLeft < 60 ? '#ef4444' : 'var(--mint-dark, #1f7a6e)' }}>
                        ⏱ {formatTime(timeLeft)}
                    </span>
                </div>

                {currentLevel === 1 && <Level1 onComplete={handleLevelComplete} onFail={handleLevelFail} />}
                {currentLevel === 2 && <Level2 onComplete={handleLevelComplete} onFail={handleLevelFail} />}
                {currentLevel === 3 && <Level3 onComplete={handleLevelComplete} onFail={handleLevelFail} />}
            </div>
        );
    };

    return (
        <GameCard title="Brain Challenge" onClose={onClose}>
            {renderContent()}
        </GameCard>
    );
};

export default GameController;
