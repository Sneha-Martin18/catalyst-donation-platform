import React from 'react';
import './LogicGame.css';

const GameCard = ({ children, title, onClose }) => {
    return (
        <div className="logic-modal-overlay">
            <div className="logic-modal-card">
                <div className="logic-modal-header">
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>{title}</h2>
                    <button onClick={onClose} className="logic-close-btn" style={{ fontSize: '1.5rem', lineHeight: '1' }}>
                        &times;
                    </button>
                </div>
                <div className="logic-modal-body">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default GameCard;
