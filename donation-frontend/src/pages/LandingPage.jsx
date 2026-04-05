import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import heroImg from '../assets/hero_illustration.png';
import warmthIcon from '../assets/cat_warmth_icon.png';
import foodIcon from '../assets/cat_food_icon.png';
// Using standard placeholders for those I couldn't generate due to quota
const healthIcon = "https://cdn-icons-png.flaticon.com/512/2966/2966486.png";
const eduIcon = "https://cdn-icons-png.flaticon.com/512/2232/2232688.png";
const shelterIcon = "https://cdn-icons-png.flaticon.com/512/619/619153.png";
const toysIcon = "https://cdn-icons-png.flaticon.com/512/3082/3082060.png";

import './LandingPage.css';

function LandingPage() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('All');

    const categories = [
        { name: 'Warmth', icon: warmthIcon, items: '24 Donations' },
        { name: 'Food', icon: foodIcon, items: '15 Donations' },
        { name: 'Health', icon: healthIcon, items: '10 Donations', active: true },
        { name: 'Education', icon: eduIcon, items: '18 Donations' },
        { name: 'Shelter', icon: shelterIcon, items: '12 Donations' },
        { name: 'Toys', icon: toysIcon, items: '9 Donations' },
    ];

    const collection = [
        {
            id: 1,
            name: 'Heavy Winter Parka',
            type: 'Warmth',
            rating: 5,
            image: warmthIcon
        },
        {
            id: 2,
            name: 'Essential Food Kit',
            type: 'Food',
            rating: 4,
            image: foodIcon
        },
        {
            id: 3,
            name: 'Advanced Health Kit',
            type: 'Health',
            rating: 5,
            image: healthIcon
        },
        {
            id: 4,
            name: 'Oxford Science Books',
            type: 'Education',
            rating: 5,
            image: eduIcon
        },
        {
            id: 5,
            name: 'Infant Care Set',
            type: 'Health',
            rating: 4,
            image: healthIcon
        },
        {
            id: 6,
            name: 'Power Tool Set',
            type: 'Shelter',
            rating: 5,
            image: shelterIcon
        },
        {
            id: 7,
            name: 'Fresh Season Fruit',
            type: 'Food',
            rating: 5,
            image: foodIcon
        },
        {
            id: 8,
            name: 'Primary School Kit',
            type: 'Education',
            rating: 5,
            image: eduIcon
        },
    ];

    const handleAuth = (type) => {
        navigate(`/${type.toLowerCase()}`);
    };

    return (
        <div className="landing-page">
            {/* MAIN NAVIGATION */}
            <nav className="main-nav">
                <a href="/" className="logo">
                    <span style={{ color: '#1f7a6e' }}>🎁</span> CATALYST
                </a>

                <div className="nav-actions">
                    <a href="#" className="btn-join" onClick={() => handleAuth('Register')}>Join Catalyst</a>
                </div>
            </nav>

            {/* HERO SECTION */}
            <header className="hero">
                <div className="hero-content">
                    <div className="hero-tag">Empowering Philanthropy</div>
                    <h1>Transform Lives Through <span style={{ color: '#1f7a6e' }}>Direct</span> Giving</h1>
                    <p>
                        Catalyst provides a high-transparency bridge between generous donors and
                        communities in need. Every item shared is a step towards a better world.
                    </p>
                    <a href="#browse" className="hero-btn" onClick={() => handleAuth('Register')}>
                        START YOUR IMPACT TODAY <span> →</span>
                    </a>
                </div>

                <div className="hero-visual">
                    <img src={heroImg} alt="Impact Illustration" />
                </div>
            </header>

            {/* FOOTER */}
            <footer className="landing-footer">
                <div className="footer-content">
                    <div className="footer-logo">
                        <span>🎁</span> CATALYST
                    </div>
                    <div className="footer-links">
                        <a href="/about" className="footer-link">About Us</a>
                        <a href="/login" className="footer-link">Login</a>
                        <a href="/register" className="footer-link">Join Now</a>
                    </div>
                    <p className="copyright">© 2026 Catalyst Donation Platform. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );

}

export default LandingPage;
