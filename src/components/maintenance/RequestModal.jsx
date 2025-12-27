import React, { useState, useEffect } from 'react';
import { useData } from '../../context/DataContext';
import styles from './RequestModal.module.css';

const RequestModal = ({ onClose, initialEquipmentId, initialDate }) => {
    const { createRequest, equipment, teams } = useData();

    // Format helper
    const formatDate = (date) => {
        if (!date) return '';
        const d = new Date(date);
        return d.toISOString().split('T')[0];
    };

    const [formData, setFormData] = useState({
        subject: '',
        equipmentId: initialEquipmentId || '',
        teamId: '',
        type: initialDate ? 'Preventive' : 'Corrective',
        priority: 'Medium',
        description: '',
        scheduledDate: formatDate(initialDate)
    });

    // Effect to auto-fill team if initialEquipmentId is provided
    useEffect(() => {
        if (initialEquipmentId) {
            const selectedEq = equipment.find(eq => eq.id === initialEquipmentId);
            if (selectedEq) {
                setFormData(prev => ({
                    ...prev,
                    equipmentId: initialEquipmentId,
                    teamId: selectedEq.teamId,
                    subject: prev.subject || `Repair request for ${selectedEq.name}`
                }));
            }
        }
    }, [initialEquipmentId, equipment]);

    // Handle equipment change manually if user changes it
    const handleEquipmentChange = (e) => {
        const eqId = parseInt(e.target.value);
        const selectedEq = equipment.find(eq => eq.id === eqId);

        setFormData(prev => ({
            ...prev,
            equipmentId: eqId,
            teamId: selectedEq ? selectedEq.teamId : '',
            subject: selectedEq ? `${prev.type === 'Preventive' ? 'Checkup' : 'Repair'} for ${selectedEq.name}` : ''
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        createRequest({
            ...formData,
            status: 'New'
        });
        onClose();
    };

    return (
        <div className={styles.modalOverlay}>
            <div className={styles.modal}>
                <form onSubmit={handleSubmit}>
                    <div className={styles.modalHeader}>
                        <h3>{initialDate ? 'Schedule Preventive Maintenance' : 'New Maintenance Request'}</h3>
                        <button type="button" onClick={onClose} className="btn">✕</button>
                    </div>
                    <div className={styles.modalContent}>
                        <div className={styles.formGroup}>
                            <label>Equipment</label>
                            <select
                                required
                                value={formData.equipmentId}
                                onChange={handleEquipmentChange}
                            >
                                <option value="">Select Equipment...</option>
                                {equipment.map(eq => (
                                    <option key={eq.id} value={eq.id}>{eq.name} ({eq.serialNumber})</option>
                                ))}
                            </select>
                        </div>

                        <div className={styles.formGroup}>
                            <label>Subject</label>
                            <input
                                required
                                type="text"
                                value={formData.subject}
                                onChange={e => setFormData({ ...formData, subject: e.target.value })}
                                placeholder="e.g. Leaking Oil"
                            />
                        </div>

                        <div className="grid-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div className={styles.formGroup}>
                                <label>Type</label>
                                <select
                                    value={formData.type}
                                    onChange={e => setFormData({ ...formData, type: e.target.value })}
                                >
                                    <option value="Corrective">Corrective</option>
                                    <option value="Preventive">Preventive</option>
                                </select>
                            </div>

                            <div className={styles.formGroup}>
                                <label>Priority</label>
                                <select
                                    value={formData.priority}
                                    onChange={e => setFormData({ ...formData, priority: e.target.value })}
                                >
                                    <option value="Low">Low</option>
                                    <option value="Medium">Medium</option>
                                    <option value="High">High</option>
                                    <option value="Critical">Critical</option>
                                </select>
                            </div>
                        </div>

                        {formData.type === 'Preventive' && (
                            <div className={styles.formGroup}>
                                <label>Scheduled Date</label>
                                <input
                                    type="date"
                                    required
                                    value={formData.scheduledDate}
                                    onChange={e => setFormData({ ...formData, scheduledDate: e.target.value })}
                                />
                            </div>
                        )}

                        <div className={styles.formGroup}>
                            <label>Assigned Team (Auto-filled)</label>
                            <select
                                value={formData.teamId}
                                onChange={e => setFormData({ ...formData, teamId: e.target.value })}
                            >
                                <option value="">Select Team...</option>
                                {teams.map(t => (
                                    <option key={t.id} value={t.id}>{t.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className={styles.formGroup}>
                            <label>Description</label>
                            <textarea
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                rows={3}
                            />
                        </div>
                    </div>
                    <div className={styles.modalFooter}>
                        <button type="button" onClick={onClose} className="btn">Cancel</button>
                        <button type="submit" className="btn btn-primary">Create Request</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default RequestModal;
