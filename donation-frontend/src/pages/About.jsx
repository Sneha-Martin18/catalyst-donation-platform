import React from 'react';
import './About.css';
import missionImg from '../assets/catalyst_about_mission.png';
import howItWorksImg from '../assets/catalyst_how_it_works.png';

const About = () => {
    return (
        <div className="about-container">
            <header className="about-header">
                <div className="header-content">
                    <h1>About <span className="highlight">Catalyst</span></h1>
                    <p className="subtitle">Empowering communities through transparent and direct giving.</p>
                </div>
            </header>

            <section className="about-section mission-section">
                <div className="section-content">
                    <div className="text-content">
                        <h2>Our Mission</h2>
                        <p>
                            At Catalyst, we believe that everyone has something to give and everyone, at some point, may need support.
                            Our mission is to create a high-transparency bridge between generous donors and communities in need,
                            ensuring that every donation reaches its destination efficiently and makes a tangible impact.
                        </p>
                        <div className="stats-grid">
                            <div className="stat-card">
                                <h3>100%</h3>
                                <p>Transparency</p>
                            </div>
                            <div className="stat-card">
                                <h3>5000+</h3>
                                <p>Donations Made</p>
                            </div>
                            <div className="stat-card">
                                <h3>1000+</h3>
                                <p>Active Volunteers</p>
                            </div>
                        </div>
                    </div>
                    <div className="image-content">
                        <img src={missionImg} alt="Our Mission" className="rounded-img" />
                    </div>
                </div>
            </section>

            <section className="about-section vision-section alt-bg">
                <div className="section-content reverse">
                    <div className="text-content">
                        <h2>Our Vision</h2>
                        <p>
                            We envision a world where technology serves humanity's most basic needs.
                            By leveraging AI-powered matching and optimized logistics, Catalyst aim to minimize waste
                            and maximize the effectiveness of community-driven philanthropy.
                        </p>
                        <ul className="vision-list">
                            <li>✨ Real-time transparency in donation tracking.</li>
                            <li>🤖 AI-driven recommendations for impactful giving.</li>
                            <li>🚚 Community-led volunteer delivery networks.</li>
                            <li>🤝 Verified recipients to ensure trust.</li>
                        </ul>
                    </div>
                    <div className="image-content">
                        <img src={howItWorksImg} alt="How It Works" className="rounded-img shadow-lg" />
                    </div>
                </div>
            </section>

            <section className="about-section values-section">
                <div className="section-header">
                    <h2>Our Core Values</h2>
                    <p>The principles that guide everything we do at Catalyst.</p>
                </div>
                <div className="values-grid">
                    <div className="value-card">
                        <div className="value-icon">🤝</div>
                        <h3>Integrity</h3>
                        <p>We operate with absolute honesty and transparency in all our interactions.</p>
                    </div>
                    <div className="value-card">
                        <div className="value-icon">🌱</div>
                        <h3>Impact</h3>
                        <p>We focus on creating measurable, positive changes in the lives of individuals.</p>
                    </div>
                    <div className="value-card">
                        <div className="value-icon">🚀</div>
                        <h3>Innovation</h3>
                        <p>We constantly seek new ways to use technology for social good.</p>
                    </div>
                    <div className="value-card">
                        <div className="value-icon">👫</div>
                        <h3>Community</h3>
                        <p>We believe in the power of collective action and mutual support.</p>
                    </div>
                </div>
            </section>

            <footer className="about-cta">
                <div className="cta-content">
                    <h2>Ready to make a difference?</h2>
                    <p>Join our community today and start your journey of impact.</p>
                    {!localStorage.getItem("access") && (
                        <div className="cta-buttons">
                            <a href="/register" className="btn btn-primary">Join Now</a>
                            <a href="/login" className="btn btn-secondary">Login</a>
                        </div>
                    )}
                </div>
            </footer>
        </div>
    );
};

export default About;
