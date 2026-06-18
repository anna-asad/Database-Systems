import { Stethoscope, CheckCircle } from 'lucide-react';
import './DoctorCard.css';

function DoctorCard({ doctor, onSelect, isSelected }) {
    return (
        <div 
            className={`doctor-card ${isSelected ? 'selected' : ''} ${!doctor.IsAvailable ? 'unavailable' : ''}`}
            onClick={() => doctor.IsAvailable && onSelect(doctor)}
        >
            <div className="doctor-icon"><Stethoscope size={32} /></div>
            <div className="doctor-info">
                <h3>{doctor.FullName}</h3>
                <p className="specialization">{doctor.Specialization || 'General Practitioner'}</p>
                <div className="doctor-meta">
                    <span className="fee">PKR {doctor.ConsultationFee}</span>
                    <span className={`availability ${doctor.IsAvailable ? 'available' : 'unavailable'}`}>
                        {doctor.IsAvailable ? '● Available' : '● Unavailable'}
                    </span>
                </div>
            </div>
            {isSelected && <div className="selected-badge"><CheckCircle size={20} /></div>}
        </div>
    );
}

export default DoctorCard;
