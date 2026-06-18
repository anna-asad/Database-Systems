import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from '../api/axios';
import { Eye, EyeOff, XCircle, CheckCircle, User } from 'lucide-react';
import './Pages.css';

function PatientRegister() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        fullName: '',
        contactNumber: '',
        cnic: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [agreed, setAgreed] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        // Clear error for this field
        if (errors[e.target.name]) {
            setErrors({ ...errors, [e.target.name]: '' });
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
            newErrors.email = 'Invalid email format';
        }

        if (formData.password.length < 8) {
            newErrors.password = 'Password must be at least 8 characters';
        }

        if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
        }

        if (!formData.cnic.match(/^\d{5}-\d{7}-\d$/)) {
            newErrors.cnic = 'CNIC format should be: XXXXX-XXXXXXX-X';
        }

        if (formData.contactNumber.replace(/\D/g, '').length !== 11) {
            newErrors.contactNumber = 'Contact number must be 11 digits';
        }

        if (!agreed) {
            newErrors.terms = 'You must agree to Terms of Service';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) return;

        setLoading(true);
        try {
            await API.post('/auth/register', {
                email: formData.email,
                password: formData.password,
                role: 'Patient',
                fullName: formData.fullName,
                contactNumber: formData.contactNumber,
                cnic: formData.cnic
            });

            setErrors({ success: 'Registration successful! Redirecting to login...' });
            setTimeout(() => navigate('/login'), 2000);
        } catch (err) {
            setErrors({ submit: err.response?.data?.message || 'Registration failed' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-box">
                <Link to="/register" className="back-link">← Back to roles</Link>
                
                <div className="auth-header">
                    <h1><User size={28} style={{display: 'inline', marginRight: '8px', verticalAlign: 'middle'}} /> Patient Registration</h1>
                    <p>Complete your profile information</p>
                </div>

                {errors.submit && <div className="error-message"><XCircle size={16} /> {errors.submit}</div>}
                {errors.success && <div className="success-message"><CheckCircle size={16} /> {errors.success}</div>}

                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="form-section">
                        <h3 style={{ color: '#444' }}>ACCOUNT INFORMATION</h3>
                        
                        <div className="form-group">
                            <label style={{ color: '#333' }}>Email <span className="required">*</span></label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                className={errors.email ? 'input-error' : ''}
                                required
                            />
                            {errors.email && <span className="error-text">{errors.email}</span>}
                        </div>

                        <div className="form-group">
                            <label style={{ color: '#333' }}>Password <span className="required">*</span> (Min 8 characters)</label>
                            <div className="password-input">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    className={errors.password ? 'input-error' : ''}
                                    required
                                />
                                <span 
                                    className="password-toggle"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? <Eye size={20} /> : <EyeOff size={20} />}
                                </span>
                            </div>
                            {errors.password && <span className="error-text">{errors.password}</span>}
                        </div>

                        <div className="form-group">
                            <label style={{ color: '#333' }}>Confirm Password <span className="required">*</span></label>
                            <div className="password-input">
                                <input
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    className={errors.confirmPassword ? 'input-error' : ''}
                                    required
                                />
                                <span 
                                    className="password-toggle"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                >
                                    {showConfirmPassword ? <Eye size={20} /> : <EyeOff size={20} />}
                                </span>
                            </div>
                            {errors.confirmPassword && <span className="error-text">{errors.confirmPassword}</span>}
                        </div>
                    </div>

                    <div className="form-section">
                        <h3 style={{ color: '#444' }}>PERSONAL INFORMATION</h3>
                        
                        <div className="form-row">
                            <div className="form-group">
                                <label style={{ color: '#333' }}>Full Name <span className="required">*</span></label>
                                <input
                                    type="text"
                                    name="fullName"
                                    value={formData.fullName}
                                    onChange={handleChange}
                                    placeholder="e.g., John Doe"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label style={{ color: '#333' }}>Contact Number <span className="required">*</span></label>
                                <input
                                    type="text"
                                    name="contactNumber"
                                    value={formData.contactNumber}
                                    onChange={handleChange}
                                    placeholder="+92 300 1234567"
                                    className={errors.contactNumber ? 'input-error' : ''}
                                    required
                                />
                                {errors.contactNumber && <span className="error-text">{errors.contactNumber}</span>}
                            </div>
                        </div>

                        <div className="form-group">
                            <label style={{ color: '#333' }}>CNIC <span className="required">*</span></label>
                            <input
                                type="text"
                                name="cnic"
                                value={formData.cnic}
                                onChange={handleChange}
                                placeholder="XXXXX-XXXXXXX-X"
                                className={errors.cnic ? 'input-error' : ''}
                                required
                            />
                            <small>Format: XXXXX-XXXXXXX-X</small>
                            {errors.cnic && <span className="error-text">{errors.cnic}</span>}
                        </div>
                    </div>

                    <div className="checkbox-group">
                        <input
                            type="checkbox"
                            id="terms"
                            checked={agreed}
                            onChange={(e) => setAgreed(e.target.checked)}
                        />
                        <label htmlFor="terms" style={{ color: '#333' }}>
                            I agree to <a href="#">Terms of Service</a> & <a href="#">Privacy Policy</a>
                        </label>
                    </div>
                    {errors.terms && <span className="error-text">{errors.terms}</span>}

                    <button type="submit" className="auth-submit-btn" disabled={loading}>
                        {loading ? 'REGISTERING...' : 'COMPLETE PATIENT REGISTRATION'}
                    </button>
                </form>

                <div className="auth-footer">
                    <p style={{ color: '#444' }}>Already have an account? <Link to="/login" style={{ color: '#007bff', fontWeight: 'bold' }}>Sign in</Link></p>
                </div>
            </div>
        </div>
    );
}

export default PatientRegister;
