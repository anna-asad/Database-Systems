import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';
import { User, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import './Pages.css';

function PatientProfile() {
    const { user } = useAuth();
    const [formData, setFormData] = useState({
        fullName: '',
        contactNumber: '',
        cnic: ''
    });
    const [medicalHistory, setMedicalHistory] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const response = await API.get('/auth/me');
            setFormData({
                fullName: response.data.FullName || '',
                contactNumber: response.data.ContactNumber || '',
                cnic: response.data.CNIC || ''
            });
        } catch (err) {
            setMessage({ type: 'error', text: 'Failed to load profile' });
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: '', text: '' });

        try {
            await API.put('/patients/profile', formData);
            setMessage({ type: 'success', text: 'Profile updated successfully!' });
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.message || 'Update failed' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="profile-container">
            <div className="profile-box">
                <div className="profile-header">
                    <h1><User size={28} style={{display: 'inline', marginRight: '8px', verticalAlign: 'middle'}} /> Patient Profile</h1>
                    <p>Manage your personal information</p>
                </div>

                {message.text && (
                    <div className={`message ${message.type}`}>
                        {message.type === 'success' ? <CheckCircle size={16} /> : <XCircle size={16} />} {message.text}
                    </div>
                )}

                <div className="profile-stats">
                    <div className="stat-card">
                        <span className="stat-value">{user?.TotalVisits || 0}</span>
                        <span className="stat-label">Total Visits</span>
                    </div>
                    <div className="stat-card">
                        <span className="stat-value">{user?.SuccessfulVisits || 0}</span>
                        <span className="stat-label">Successful</span>
                    </div>
                    <div className="stat-card">
                        <span className="stat-value">{user?.MissedVisits || 0}</span>
                        <span className="stat-label">Missed</span>
                    </div>
                    {user?.IsBlacklisted && (
                        <div className="stat-card blacklist">
                            <span className="stat-label"><AlertTriangle size={16} style={{display: 'inline', marginRight: '4px', verticalAlign: 'middle'}} /> Blacklisted</span>
                        </div>
                    )}
                </div>

                <form onSubmit={handleSubmit} className="profile-form">
                    <h3>Personal Information</h3>

                    <div className="form-group">
                        <label>Full Name</label>
                        <input
                            type="text"
                            name="fullName"
                            value={formData.fullName}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Contact Number</label>
                            <input
                                type="text"
                                name="contactNumber"
                                value={formData.contactNumber}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>CNIC</label>
                            <input
                                type="text"
                                name="cnic"
                                value={formData.cnic}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>

                    <h3>Medical History</h3>
                    <div className="form-group">
                        <textarea
                            value={medicalHistory}
                            onChange={(e) => setMedicalHistory(e.target.value)}
                            placeholder="Add your medical history, allergies, chronic conditions..."
                            rows="6"
                        />
                    </div>

                    <button 
                        type="submit" 
                        className="save-btn-fixed"
                        disabled={loading}
                    >
                        {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default PatientProfile;
