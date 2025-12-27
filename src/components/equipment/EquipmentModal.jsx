import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { X } from 'lucide-react';
import styles from './EquipmentModal.module.css';

const EquipmentModal = ({ onClose }) => {
    const { departments, categories, locations, users, createEquipment, createCategory, createTeam } = useData();

    const [formData, setFormData] = useState({
        equipmentName: '',
        serialNumber: '',
        equipmentCategoryId: '',
        departmentId: '',
        assignedEmployeeId: '',
        purchaseDate: '',
        warrantyStartDate: '',
        warrantyEndDate: '',
        locationId: '',
        status: 'Operational'
    });

    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Inline Category Creation State
    const [isAddingCategory, setIsAddingCategory] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [newCategoryTeamId, setNewCategoryTeamId] = useState('');

    // Inline Team Creation State
    const [isAddingTeam, setIsAddingTeam] = useState(false);
    const [newTeamName, setNewTeamName] = useState('');

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        // Clear error for this field
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const validate = () => {
        const newErrors = {};

        if (!formData.equipmentName.trim()) {
            newErrors.equipmentName = 'Equipment name is required';
        }

        if (!formData.serialNumber.trim()) {
            newErrors.serialNumber = 'Serial number is required';
        }

        if (!formData.equipmentCategoryId) {
            newErrors.equipmentCategoryId = 'Category is required';
        }

        if (!formData.departmentId) {
            newErrors.departmentId = 'Department is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validate()) {
            return;
        }

        setIsSubmitting(true);

        try {
            // Convert string IDs to integers
            const equipmentData = {
                ...formData,
                equipmentCategoryId: parseInt(formData.equipmentCategoryId),
                departmentId: parseInt(formData.departmentId),
                assignedEmployeeId: formData.assignedEmployeeId ? parseInt(formData.assignedEmployeeId) : null,
                locationId: formData.locationId ? parseInt(formData.locationId) : null,
                purchaseDate: formData.purchaseDate || null,
                warrantyStartDate: formData.warrantyStartDate || null,
                warrantyEndDate: formData.warrantyEndDate || null
            };

            const result = await createEquipment(equipmentData);

            if (result.success) {
                alert('Equipment created successfully!');
                onClose();
            } else {
                alert(`Error: ${result.error || 'Failed to create equipment'}`);
            }
        } catch (error) {
            alert(`Error: ${error.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <form onSubmit={handleSubmit}>
                    <div className={styles.modalHeader}>
                        <h2>Add New Equipment</h2>
                        <button type="button" onClick={onClose} className="btn">
                            <X size={20} />
                        </button>
                    </div>

                    <div className={styles.modalContent}>
                        {/* Basic Information */}
                        <div className={styles.section}>
                            <h3>Basic Information</h3>
                            <div className={styles.formGrid}>
                                <div className={styles.formGroup}>
                                    <label>Equipment Name <span className={styles.required}>*</span></label>
                                    <input
                                        type="text"
                                        name="equipmentName"
                                        value={formData.equipmentName}
                                        onChange={handleChange}
                                        placeholder="e.g., CNC Machine X1"
                                        className={errors.equipmentName ? styles.error : ''}
                                    />
                                    {errors.equipmentName && <span className={styles.errorText}>{errors.equipmentName}</span>}
                                </div>

                                <div className={styles.formGroup}>
                                    <label>Serial Number <span className={styles.required}>*</span></label>
                                    <input
                                        type="text"
                                        name="serialNumber"
                                        value={formData.serialNumber}
                                        onChange={handleChange}
                                        placeholder="e.g., CNC-2023-001"
                                        className={errors.serialNumber ? styles.error : ''}
                                    />
                                    {errors.serialNumber && <span className={styles.errorText}>{errors.serialNumber}</span>}
                                </div>

                                <div className={styles.formGroup}>
                                    <label>Category <span className={styles.required}>*</span></label>
                                    {!isAddingCategory ? (
                                        <select
                                            name="equipmentCategoryId"
                                            value={formData.equipmentCategoryId}
                                            onChange={(e) => {
                                                if (e.target.value === 'NEW_CATEGORY') {
                                                    setIsAddingCategory(true);
                                                } else {
                                                    handleChange(e);
                                                }
                                            }}
                                            className={errors.equipmentCategoryId ? styles.error : ''}
                                        >
                                            <option value="">Select Category...</option>
                                            {categories.map(cat => (
                                                <option key={cat.id} value={cat.id}>
                                                    {cat.name} (Team: {cat.defaultTeamName})
                                                </option>
                                            ))}
                                            <option value="NEW_CATEGORY" style={{ fontWeight: 'bold', color: '#2563eb' }}>
                                                + Add New Category
                                            </option>
                                        </select>
                                    ) : (
                                        <div className={styles.inlineForm}>
                                            <input
                                                type="text"
                                                placeholder="New Category Name"
                                                value={newCategoryName}
                                                onChange={(e) => setNewCategoryName(e.target.value)}
                                                autoFocus
                                            />
                                            {!isAddingTeam ? (
                                                <select
                                                    value={newCategoryTeamId}
                                                    onChange={(e) => {
                                                        if (e.target.value === 'NEW_TEAM') {
                                                            setIsAddingTeam(true);
                                                        } else {
                                                            setNewCategoryTeamId(e.target.value);
                                                        }
                                                    }}
                                                    style={{ marginTop: '0.5rem' }}
                                                >
                                                    <option value="">Select Default Team...</option>
                                                    {useData().teams.map(t => (
                                                        <option key={t.id} value={t.id}>{t.name}</option>
                                                    ))}
                                                    <option value="NEW_TEAM" style={{ fontWeight: 'bold', color: '#2563eb' }}>
                                                        + Add New Team
                                                    </option>
                                                </select>
                                            ) : (
                                                <div className={styles.inlineForm} style={{ background: '#eff6ff', borderColor: '#bfdbfe' }}>
                                                    <input
                                                        type="text"
                                                        placeholder="New Team Name"
                                                        value={newTeamName}
                                                        onChange={(e) => setNewTeamName(e.target.value)}
                                                        autoFocus
                                                    />
                                                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                                                        <button
                                                            type="button"
                                                            className="btn btn-sm btn-primary"
                                                            onClick={async () => {
                                                                if (newTeamName) {
                                                                    const team = await createTeam(newTeamName);
                                                                    if (team) {
                                                                        setNewCategoryTeamId(team.id);
                                                                        setIsAddingTeam(false);
                                                                        setNewTeamName('');
                                                                    }
                                                                }
                                                            }}
                                                        >
                                                            Create Team
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className="btn btn-sm"
                                                            onClick={() => {
                                                                setIsAddingTeam(false);
                                                                setNewTeamName('');
                                                            }}
                                                        >
                                                            Cancel
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                                                <button
                                                    type="button"
                                                    className="btn btn-sm btn-primary"
                                                    onClick={async () => {
                                                        if (newCategoryName && newCategoryTeamId) {
                                                            const newCat = await createCategory(newCategoryName, newCategoryTeamId);
                                                            if (newCat) {
                                                                setFormData(prev => ({ ...prev, equipmentCategoryId: newCat.id }));
                                                                setIsAddingCategory(false);
                                                                setNewCategoryName('');
                                                                setNewCategoryTeamId('');
                                                            }
                                                        } else {
                                                            alert('Please enter name and select a team');
                                                        }
                                                    }}
                                                >
                                                    Save
                                                </button>
                                                <button
                                                    type="button"
                                                    className="btn btn-sm"
                                                    onClick={() => {
                                                        setIsAddingCategory(false);
                                                        setNewCategoryName('');
                                                        setNewCategoryTeamId('');
                                                    }}
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                    {errors.equipmentCategoryId && <span className={styles.errorText}>{errors.equipmentCategoryId}</span>}
                                </div>

                                <div className={styles.formGroup}>
                                    <label>Status</label>
                                    <select
                                        name="status"
                                        value={formData.status}
                                        onChange={handleChange}
                                    >
                                        <option value="Operational">Operational</option>
                                        <option value="Maintenance">Maintenance</option>
                                        <option value="Down">Down</option>
                                        <option value="Scrapped">Scrapped</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Assignment & Location */}
                        <div className={styles.section}>
                            <h3>Assignment & Location</h3>
                            <div className={styles.formGrid}>
                                <div className={styles.formGroup}>
                                    <label>Department <span className={styles.required}>*</span></label>
                                    <select
                                        name="departmentId"
                                        value={formData.departmentId}
                                        onChange={handleChange}
                                        className={errors.departmentId ? styles.error : ''}
                                    >
                                        <option value="">Select Department...</option>
                                        {departments.map(dept => (
                                            <option key={dept.id} value={dept.id}>{dept.name}</option>
                                        ))}
                                    </select>
                                    {errors.departmentId && <span className={styles.errorText}>{errors.departmentId}</span>}
                                </div>

                                <div className={styles.formGroup}>
                                    <label>Assigned Employee</label>
                                    <select
                                        name="assignedEmployeeId"
                                        value={formData.assignedEmployeeId}
                                        onChange={handleChange}
                                    >
                                        <option value="">None</option>
                                        {users.map(user => (
                                            <option key={user.id} value={user.id}>
                                                {user.name} ({user.role})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className={styles.formGroup}>
                                    <label>Location</label>
                                    <select
                                        name="locationId"
                                        value={formData.locationId}
                                        onChange={handleChange}
                                    >
                                        <option value="">Select Location...</option>
                                        {locations.map(loc => (
                                            <option key={loc.id} value={loc.id}>{loc.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Warranty Information */}
                        <div className={styles.section}>
                            <h3>Warranty & Purchase Information</h3>
                            <div className={styles.formGrid}>
                                <div className={styles.formGroup}>
                                    <label>Purchase Date</label>
                                    <input
                                        type="date"
                                        name="purchaseDate"
                                        value={formData.purchaseDate}
                                        onChange={handleChange}
                                    />
                                </div>

                                <div className={styles.formGroup}>
                                    <label>Warranty Start Date</label>
                                    <input
                                        type="date"
                                        name="warrantyStartDate"
                                        value={formData.warrantyStartDate}
                                        onChange={handleChange}
                                    />
                                </div>

                                <div className={styles.formGroup}>
                                    <label>Warranty End Date</label>
                                    <input
                                        type="date"
                                        name="warrantyEndDate"
                                        value={formData.warrantyEndDate}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className={styles.modalFooter}>
                        <button type="button" onClick={onClose} className="btn" disabled={isSubmitting}>
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                            {isSubmitting ? 'Creating...' : 'Create Equipment'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EquipmentModal;
