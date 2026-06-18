import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Calendar, Clock, Users, TrendingUp, CheckCircle, ArrowRight, Stethoscope, ClipboardList, Activity } from 'lucide-react';
import heroImage from '../assets/Hero Image.png';
import './Home.css';

function Home() {
    const { user } = useAuth();
    
    // Redirect logged-in users to their dashboard
    if (user) {
        if (user.RoleName === 'Patient') return <Navigate to="/patient/dashboard" />;
        if (user.RoleName === 'Doctor') return <Navigate to="/doctor/dashboard" />;
        if (user.RoleName === 'Admin' || user.RoleName === 'Reception') return <Navigate to="/admin/dashboard" />;
    }

    return (
        <div className="home-container">
            {/* Hero Section */}
            <section className="hero-section">
                <div className="hero-content">
                    <div className="hero-text">
                        <div className="hero-badge">
                            <Activity size={16} />
                            <span>Smart Healthcare Management</span>
                        </div>
                        <h1 className="hero-title">
                            Skip the Waiting Room.<br />
                            <span className="gradient-text">Join the Queue Digitally.</span>
                        </h1>
                        <p className="hero-subtitle">
                            MediQueue revolutionizes clinic management with digital appointments, 
                            real-time queue tracking, and seamless patient-doctor coordination.
                        </p>
                        <div className="hero-actions">
                            <Link to="/register" className="btn btn-primary">
                                Get Started <ArrowRight size={20} />
                            </Link>
                            <Link to="/login" className="btn btn-secondary">
                                Sign In
                            </Link>
                        </div>
                    </div>
                    <div className="hero-image">
                        <img src={heroImage} alt="Smart Clinic Queue" className="hero-main-image" />
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="features-section">
                <div className="section-header">
                    <h2>Why Choose MediQueue?</h2>
                    <p>Streamline your clinic operations with our comprehensive management system</p>
                </div>
                <div className="features-grid">
                    <div className="feature-card">
                        <div className="feature-icon">
                            <Calendar size={32} />
                        </div>
                        <h3>Online Booking</h3>
                        <p>Book appointments anytime, anywhere. Choose your preferred doctor, date, and time slot with ease.</p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon">
                            <ClipboardList size={32} />
                        </div>
                        <h3>Digital Tokens</h3>
                        <p>Receive unique token numbers for each appointment. No more physical queues or confusion.</p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon">
                            <Activity size={32} />
                        </div>
                        <h3>Real-Time Tracking</h3>
                        <p>Track your position in the queue live. Know exactly when it's your turn to see the doctor.</p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon">
                            <Users size={32} />
                        </div>
                        <h3>Walk-In Support</h3>
                        <p>Missed your appointment? Register as a walk-in patient and join the queue on the same day.</p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon">
                            <Stethoscope size={32} />
                        </div>
                        <h3>Doctor Dashboard</h3>
                        <p>Doctors can manage appointments, call patients, and maintain records efficiently.</p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon">
                            <TrendingUp size={32} />
                        </div>
                        <h3>Analytics & Reports</h3>
                        <p>Track patient history, visit statistics, and clinic performance with detailed insights.</p>
                    </div>
                </div>
            </section>

            {/* How It Works Section */}
            <section className="how-it-works-section">
                <div className="section-header">
                    <h2>How It Works</h2>
                    <p>Get started in three simple steps</p>
                </div>
                <div className="steps-container">
                    <div className="step-card">
                        <div className="step-number">1</div>
                        <div className="step-icon">
                            <Users size={40} />
                        </div>
                        <h3>Create Account</h3>
                        <p>Register as a patient, doctor, or clinic staff member in minutes.</p>
                    </div>
                    <div className="step-arrow">
                        <ArrowRight size={32} />
                    </div>
                    <div className="step-card">
                        <div className="step-number">2</div>
                        <div className="step-icon">
                            <Calendar size={40} />
                        </div>
                        <h3>Book Appointment</h3>
                        <p>Select your doctor, choose a convenient time slot, and confirm your booking.</p>
                    </div>
                    <div className="step-arrow">
                        <ArrowRight size={32} />
                    </div>
                    <div className="step-card">
                        <div className="step-number">3</div>
                        <div className="step-icon">
                            <CheckCircle size={40} />
                        </div>
                        <h3>Track & Visit</h3>
                        <p>Monitor your queue position in real-time and visit the clinic at the right time.</p>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="cta-section">
                <div className="cta-content">
                    <h2>Ready to Transform Your Clinic Experience?</h2>
                    <p>Join hundreds of patients and healthcare providers using MediQueue</p>
                    <div className="cta-buttons">
                        <Link to="/register" className="btn btn-primary btn-large">
                            Join MediQueue Today <ArrowRight size={20} />
                        </Link>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="home-footer">
                <div className="footer-content">
                    <div className="footer-section">
                        <h4>MediQueue</h4>
                        <p>Modern clinic appointment and queue management system</p>
                    </div>
                    <div className="footer-section">
                        <h4>Quick Links</h4>
                        <Link to="/login">Login</Link>
                        <Link to="/register">Register</Link>
                    </div>
                    <div className="footer-section">
                        <h4>For Users</h4>
                        <Link to="/register/patient">Patient Registration</Link>
                        <Link to="/register/doctor">Doctor Registration</Link>
                        <Link to="/register/admin">Staff Registration</Link>
                    </div>
                    <div className="footer-section">
                        <h4>Project Team</h4>
                        <p>Gul-e-Zara</p>
                        <p>Aina Asad</p>
                        <p>Tehreem Tariq</p>
                        <p>Mubeen Nadeem</p>
                    </div>
                </div>
                <div className="footer-bottom">
                    <p>&copy; 2024 MediQueue. All rights reserved. | University Project</p>
                </div>
            </footer>
        </div>
    );
}

export default Home;
