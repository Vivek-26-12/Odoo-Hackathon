import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { X, Calendar, User, Wrench, AlertCircle, Clock } from 'lucide-react';
import styles from './RequestDetailModal.module.css';

const RequestDetailModal = ({ request, onClose }) => {
    const { getEquipmentById, getUserById, getTeamById, updateRequestStatus, users } = useData();
    const [isEditing, setIsEditing] = useState(false);
    const [duration, setDuration] = useState(request.durationHours || '');
    const [assignedTech, setAssignedTech] = useState(request.technicianId || '');

    const equipment = getEquipmentById(request.equipmentId);
    const team = getTeamById(request.teamId);
    const requester = getUserById(request.requesterId);
    const technician = request.technicianId ? getUserById(request.technicianId) : null;

    // Get team members for assignment dropdown
    const teamMembers = users.filter(u => u.teamId === request.teamId && u.role === 'Technician');

    const handleStatusChange = (newStatus) => {
        if (newStatus === 'Repaired' && !duration) {
            alert('Please enter duration hours before marking as repaired');
            return;
        }
        updateRequestStatus(request.id, newStatus, { durationHours: duration || 0 });
        onClose();
    };

    const handleAssign = () => {
        if (!assignedTech) {
            alert('Please select a technician');
            return;
        }
        updateRequestStatus(request.id, request.status, { assignedTechnicianId: assignedTech });
        onClose();
    };

    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div className={styles.modalHeader}>
                    <div>
                        <h2>{request.subject}</h2>
                        <span className={`${styles.statusBadge} ${styles[`status${request.status.replace(' ', '')}`]}`}>
                            {request.status}
                        </span>
                    </div>
                    <button className="btn" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <div className={styles.modalContent}>
                    {/* Request Info Grid */}
                    <div className={styles.infoGrid}>
                        <div className={styles.infoItem}>
                            <label><Wrench size={16} /> Equipment</label>
                            <p>{equipment?.name || 'Unknown'}</p>
                            <span className={styles.meta}>{equipment?.serialNumber}</span>
                        </div>

                        <div className={styles.infoItem}>
                            <label><User size={16} /> Requested By</label>
                            <p>{requester?.name || 'Unknown'}</p>
                        </div>

                        <div className={styles.infoItem}>
                            <label><Users size={16} /> Team</label>
                            <p>{team?.name || 'Unknown'}</p>
                        </div>

                        <div className={styles.infoItem}>
                            <label><AlertCircle size={16} /> Priority</label>
                            <p className={styles[`priority${request.priority}`]}>{request.priority}</p>
                        </div>

                        <div className={styles.infoItem}>
                            <label><Clock size={16} /> Type</label>
                            <p>{request.type}</p>
                        </div>

                        {request.scheduledDate && (
                            <div className={styles.infoItem}>
                                <label><Calendar size={16} /> Scheduled Date</label>
                                <p>{new Date(request.scheduledDate).toLocaleDateString('en-US', {
                                    month: 'long',
                                    day: 'numeric',
                                    year: 'numeric'
                                })}</p>
                            </div>
                        )}
                    </div>

                    {/* Description */}
                    {request.description && (
                        <div className={styles.section}>
                            <h3>Description</h3>
                            <p>{request.description}</p>
                        </div>
                    )}

                    {/* Assignment Section */}
                    <div className={styles.section}>
                        <h3>Assignment</h3>
                        {technician ? (
                            <div className={styles.technicianCard}>
                                <img src={technician.avatar} alt={technician.name} />
                                <div>
                                    <p className={styles.techName}>{technician.name}</p>
                                    <p className={styles.techRole}>{technician.role}</p>
                                </div>
                            </div>
                        ) : (
                            <div className={styles.assignmentForm}>
                                <select
                                    value={assignedTech}
                                    onChange={(e) => setAssignedTech(parseInt(e.target.value))}
                                    className={styles.select}
                                >
                                    <option value="">Select Technician...</option>
                                    {teamMembers.map(tech => (
                                        <option key={tech.id} value={tech.id}>{tech.name}</option>
                                    ))}
                                </select>
                                <button className="btn btn-primary" onClick={handleAssign}>
                                    Assign
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Duration (for completion) */}
                    {(request.status === 'In Progress' || request.status === 'Repaired') && (
                        <div className={styles.section}>
                            <h3>Work Duration</h3>
                            <div className={styles.durationForm}>
                                <input
                                    type="number"
                                    step="0.5"
                                    min="0"
                                    placeholder="Hours spent"
                                    value={duration}
                                    onChange={(e) => setDuration(e.target.value)}
                                    className={styles.input}
                                />
                                <span>hours</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className={styles.modalFooter}>
                    {request.status === 'New' && (
                        <button
                            className="btn btn-primary"
                            onClick={() => handleStatusChange('In Progress')}
                        >
                            Start Work
                        </button>
                    )}
                    {request.status === 'In Progress' && (
                        <>
                            <button
                                className="btn btn-primary"
                                onClick={() => handleStatusChange('Repaired')}
                            >
                                Mark as Repaired
                            </button>
                            <button
                                className="btn"
                                style={{ background: '#EF4444', color: 'white' }}
                                onClick={() => handleStatusChange('Scrap')}
                            >
                                Scrap Equipment
                            </button>
                        </>
                    )}
                    <button className="btn" onClick={onClose}>Close</button>
                </div>
            </div>
        </div>
    );
};

const Users = ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
        <circle cx="9" cy="7" r="4"></circle>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
    </svg>
);

export default RequestDetailModal;
