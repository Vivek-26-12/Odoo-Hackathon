import React, { useState, useEffect } from 'react';
import { useData } from '../../context/DataContext';
import styles from './PreventiveMaintenanceModal.module.css';
import { addMonths, format } from 'date-fns';

const PreventiveMaintenanceModal = ({ onClose, initialDate }) => {
    const { createBatchRequests, equipment, users, teams } = useData();

    // Form State
    const [formData, setFormData] = useState({
        equipmentId: '',
        teamId: '',
        frequency: 1, // Months
        startDate: initialDate ? format(initialDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
        durationMonths: 12, // Default plan for 1 year
        technicianId: '',
        description: 'Routine Preventive Maintenance'
    });

    const [previewDates, setPreviewDates] = useState([]);

    // Calculate dates whenever form changes
    useEffect(() => {
        if (!formData.startDate || !formData.frequency || !formData.durationMonths) return;

        const start = new Date(formData.startDate);
        const dates = [];
        let current = start;
        const end = addMonths(start, parseInt(formData.durationMonths));

        while (current < end) {
            dates.push(current);
            current = addMonths(current, parseInt(formData.frequency));
        }
        setPreviewDates(dates);
    }, [formData.startDate, formData.frequency, formData.durationMonths]);

    const handleEquipmentChange = (e) => {
        const val = e.target.value;
        const eqId = val ? parseInt(val) : '';
        const selectedEq = equipment.find(eq => eq.id === eqId);

        setFormData(prev => ({
            ...prev,
            equipmentId: eqId,
            teamId: selectedEq ? selectedEq.teamId : '',
            technicianId: selectedEq && selectedEq.technicianId ? selectedEq.technicianId : ''
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.equipmentId) return alert('Please select equipment');

        const requests = previewDates.map(date => ({
            subject: `Preventive Maintenance - ${format(date, 'MMM yyyy')}`,
            description: formData.description,
            type: 'Preventive',
            priority: 'Medium',
            equipmentId: formData.equipmentId,
            teamId: formData.teamId,
            technicianId: formData.technicianId || null,
            scheduledDate: format(date, 'yyyy-MM-dd')
        }));

        await createBatchRequests(requests);
        onClose();
    };

    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                <div className={styles.modalHeader}>
                    <div>
                        <h2>Schedule Maintenance Plan</h2>
                        <p>Plan recurring preventive maintenance (SIP Style)</p>
                    </div>
                    <button type="button" onClick={onClose} className={styles.closeBtn}>✕</button>
                </div>

                <div className={styles.modalContent}>
                    <div className={styles.leftPanel}>
                        <form onSubmit={handleSubmit}>
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

                            <div className={styles.row}>
                                <div className={styles.formGroup}>
                                    <label>Start From</label>
                                    <input
                                        type="date"
                                        required
                                        min={format(new Date(), 'yyyy-MM-dd')}
                                        value={formData.startDate}
                                        onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label>Frequency</label>
                                    <select
                                        value={formData.frequency}
                                        onChange={e => setFormData({ ...formData, frequency: parseInt(e.target.value) })}
                                    >
                                        <option value="1">Monthly</option>
                                        <option value="2">Bi-Monthly (2 Mo)</option>
                                        <option value="3">Quarterly (3 Mo)</option>
                                        <option value="6">Half-Yearly (6 Mo)</option>
                                        <option value="12">Yearly (12 Mo)</option>
                                    </select>
                                </div>
                            </div>

                            <div className={styles.formGroup}>
                                <label>Planning Horizon</label>
                                <select
                                    value={formData.durationMonths}
                                    onChange={e => setFormData({ ...formData, durationMonths: parseInt(e.target.value) })}
                                >
                                    <option value="3">Next 3 Months</option>
                                    <option value="6">Next 6 Months</option>
                                    <option value="12">Next 1 Year</option>
                                    <option value="24">Next 2 Years</option>
                                    <option value="60">Next 5 Years</option>
                                </select>
                            </div>

                            <div className={styles.formGroup}>
                                <label>Assign Technician</label>
                                <select
                                    value={formData.technicianId}
                                    onChange={e => setFormData({ ...formData, technicianId: e.target.value ? parseInt(e.target.value) : '' })}
                                >
                                    <option value="">Unassigned</option>
                                    {users.filter(u => u.role === 'Technician').map(tech => (
                                        <option key={tech.id} value={tech.id}>{tech.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className={styles.formGroup}>
                                <label>Notes</label>
                                <textarea
                                    rows="2"
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>

                            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
                                Confirm & Schedule
                            </button>
                        </form>
                    </div>

                    <div className={styles.rightPanel}>
                        <h3>Plan Summary</h3>
                        <div className={styles.summaryCard}>
                            <div className={styles.summaryItem}>
                                <span>Total Visits</span>
                                <strong>{previewDates.length}</strong>
                            </div>
                            <div className={styles.summaryItem}>
                                <span>First Visit</span>
                                <strong>{previewDates.length > 0 ? format(previewDates[0], 'MMM d, yyyy') : '-'}</strong>
                            </div>
                            <div className={styles.summaryItem}>
                                <span>Last Visit</span>
                                <strong>{previewDates.length > 0 ? format(previewDates[previewDates.length - 1], 'MMM d, yyyy') : '-'}</strong>
                            </div>
                        </div>

                        <h4>Projected Schedule</h4>
                        <div className={styles.scheduleList}>
                            {previewDates.map((date, idx) => (
                                <div key={idx} className={styles.scheduleItem}>
                                    <span className={styles.scheduleIndex}>{idx + 1}</span>
                                    <span>{format(date, 'EEEE, MMMM d, yyyy')}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PreventiveMaintenanceModal;
