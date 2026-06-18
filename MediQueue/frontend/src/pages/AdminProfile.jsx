import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';
import { Building2, CheckCircle, XCircle } from 'lucide-react';
import './Pages.css';

function AdminProfile() {
    const { user } = useAuth();
    const [formData, setFormData] = useState({
        fullName: '',
        contactNumber: '',
        cnic: '',
        department: ''
    });
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
                cnic: response.data.CNIC || '',
                department: response.data.Department || ''
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
            await API.put('/admin/profile', formData);
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
                    <h1><Building2 size={28} style={{display: 'inline', marginRight: '8px', verticalAlign: 'middle'}} /> Staff Profile</h1>
                    <p>Manage your information</p>
                </div>

                {message.text && (
                    <div className={`message ${message.type}`}>
                        {message.type === 'success' ? <CheckCircle size={16} /> : <XCircle size={16} />} {message.text}
                    </div>
                )}

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

                    <div className="form-group">
                        <label>Department</label>
                        <input
                            type="text"
                            name="department"
                            value={formData.department}
                            onChange={handleChange}
                            disabled={true}
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

export default AdminProfile;
