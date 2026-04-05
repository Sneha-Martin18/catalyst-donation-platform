import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import GameController from './GameController';
import './LogicGame.css';

const LogicGame = () => {
    const [isOpen, setIsOpen] = useState(false);
    const location = useLocation();

    // Hide puzzle on login and register pages
    const isAuthPage = location.pathname === '/login' || location.pathname === '/register';
    if (isAuthPage) return null;

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className={`logic-game-fab ${isOpen ? 'hidden' : ''}`}
                aria-label="Open Logic Puzzle"
                title="Start Brain Challenge"
            >
                <span>🧩</span>
            </button>

            {isOpen && (
                <GameController onClose={() => setIsOpen(false)} />
            )}
        </>
    );
};

export default LogicGame;
