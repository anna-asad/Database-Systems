import { useNavigate } from 'react-router-dom';
import { User, Stethoscope, Building2 } from 'lucide-react';
import './RoleSelection.css';

function RoleSelection() {
    const navigate = useNavigate();

    const roles = [
        {
            icon: <User size={48} />,
            title: 'PATIENT',
            description: 'Book appointments and manage health records',
            path: '/register/patient'
        },
        {
            icon: <Stethoscope size={48} />,
            title: 'DOCTOR',
            description: 'Manage appointments and patient care',
            path: '/register/doctor'
        },
        {
            icon: <Building2 size={48} />,
            title: 'ADMIN',
            description: 'Manage clinic operations',
            path: '/register/admin'
        }
    ];

    return (
        <div className="role-selection-container">
            <div className="role-header">
                <h1>MEDIQUEUE</h1>
                <p>Clinic Appointment Management System</p>
            </div>

            <div className="role-cards">
                {roles.map((role) => (
                    <div key={role.title} className="role-card" onClick={() => navigate(role.path)}>
                        <div className="role-icon">{role.icon}</div>
                        <h2>{role.title}</h2>
                        <p>{role.description}</p>
                        <button className="role-select-btn">SELECT</button>
                    </div>
                ))}
            </div>

            <p className="role-footer">Select your role to get started with MediQueue</p>
            <p className="login-link">
                Already have an account? <span onClick={() => navigate('/login')}>Sign in</span>
            </p>
        </div>
    );
}

export default RoleSelection;
