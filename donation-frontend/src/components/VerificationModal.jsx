import React from 'react';
import { useNavigate } from 'react-router-dom';
import './VerificationModal.css';

const VerificationModal = ({ isOpen, onClose }) => {
    const navigate = useNavigate();

    if (!isOpen) return null;

    const handleVerifyClick = () => {
        onClose();
        navigate('/profile'); // Assuming profile page has the verification link
    };

    return (
        <div className="v-modal-overlay">
            <div className="v-modal-content">
                <div className="v-modal-icon">🔒</div>
                <h2>Email Verification Required</h2>
                <p>
                    You need to verify your email address to access this feature.
                    Verification helps us maintain a secure and trusted community.
                </p>
                <div className="v-modal-actions">
                    <button className="v-btn v-btn-secondary" onClick={onClose}>
                        Maybe Later
                    </button>
                    <button className="v-btn v-btn-primary" onClick={handleVerifyClick}>
                        Verify Now
                    </button>
                </div>
            </div>
        </div>
    );
};

export default VerificationModal;
