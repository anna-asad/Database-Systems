import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';
import { Stethoscope, CheckCircle, XCircle } from 'lucide-react';
import './Pages.css';

function DoctorProfile() {
    const { user } = useAuth();
    const [formData, setFormData] = useState({
        fullName: '',
        specialization: '',
        consultationFee: ''
    });
    const [schedule, setSchedule] = useState([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    const specializations = [
        'General Practitioner',
        'Cardiologist',
        'Dermatologist',
        'Neurologist',
        'Pediatrician',
        'Orthopedic',
        'Gynecologist',
        'ENT Specialist',
        'Psychiatrist',
        'Dentist'
    ];

    useEffect(() => {
        fetchProfile();
        fetchSchedule();
    }, []);

    const fetchProfile = async () => {
        try {
            const response = await API.get('/auth/me');
            setFormData({
                fullName: response.data.FullName || '',
                specialization: response.data.Specialization || '',
                consultationFee: response.data.ConsultationFee || ''
            });
        } catch (err) {
            setMessage({ type: 'error', text: 'Failed to load profile' });
        }
    };

    const fetchSchedule = async () => {
        try {
            const response = await API.get('/doctors/my-schedule');
            setSchedule(response.data || []);
        } catch (err) {
            console.error('Failed to load schedule');
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
            await API.put('/doctors/profile', formData);
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
                    <h1><Stethoscope size={28} style={{display: 'inline', marginRight: '8px', verticalAlign: 'middle'}} /> Doctor Profile</h1>
                    <p>Manage your professional information</p>
                </div>

                {message.text && (
                    <div className={`message ${message.type}`}>
                        {message.type === 'success' ? <CheckCircle size={16} /> : <XCircle size={16} />} {message.text}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="profile-form">
                    <h3>Professional Information</h3>

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
                            <label>Specialization</label>
                            <select
                                name="specialization"
                                value={formData.specialization}
                                onChange={handleChange}
                                required
                            >
                                <option value="">Select Specialization</option>
                                {specializations.map((spec) => (
                                    <option key={spec} value={spec}>{spec}</option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Consultation Fee (PKR)</label>
                            <input
                                type="number"
                                name="consultationFee"
                                value={formData.consultationFee}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>

                    <h3>Weekly Schedule</h3>
                    <div className="schedule-list">
                        {schedule.length > 0 ? (
                            schedule.map((slot, index) => (
                                <div key={index} className="schedule-item">
                                    <span className="day">{slot.DayName}</span>
                                    <span className="time">{slot.StartTime} - {slot.EndTime}</span>
                                </div>
                            ))
                        ) : (
                            <p className="no-data">No schedule set. Contact admin to set your schedule.</p>
                        )}
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

export default DoctorProfile;
