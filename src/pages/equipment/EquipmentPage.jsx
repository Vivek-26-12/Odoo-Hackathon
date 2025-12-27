import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { Plus, Search, MapPin, Wrench } from 'lucide-react';
import styles from './Equipment.module.css';
import { useNavigate } from 'react-router-dom';

const EquipmentCard = ({ equipment, requestCount }) => {
    const { getUserById } = useData();
    const tech = equipment.technicianId ? getUserById(equipment.technicianId) : null;
    const navigate = useNavigate();

    return (
        <div className={styles.card}>
            <div className={styles.cardHeader}>
                <h3>{equipment.name}</h3>
                <span
                    className={`${styles.statusIndicator} ${styles['status' + equipment.status]}`}
                    title={equipment.status}
                ></span>
            </div>

            <div className={styles.cardContent}>
                <div className={styles.dataRow}>
                    <span className={styles.label}>Serial:</span>
                    <span className={styles.value}>{equipment.serialNumber}</span>
                </div>
                <div className={styles.dataRow}>
                    <span className={styles.label}>Dept:</span>
                    <span className={styles.value}>{equipment.department}</span>
                </div>

                <div className={styles.techInfo}>
                    <MapPin size={14} color="#6B7280" />
                    <span className={styles.label}>{equipment.location}</span>
                </div>

                {tech && (
                    <div className={styles.techInfo}>
                        <img src={tech.avatar} alt={tech.name} className={styles.techAvatar} />
                        <span className={styles.value}>{tech.name}</span>
                    </div>
                )}
            </div>

            <div className={styles.cardActions}>
                <button
                    className={styles.smartButton}
                    onClick={() => navigate(`/maintenance?equipmentId=${equipment.id}`)}
                >
                    <Wrench size={14} />
                    <span>Maintenance</span>
                    <span className="badge" style={{ background: '#E5E7EB', color: '#374151', marginLeft: '4px' }}>
                        {requestCount}
                    </span>
                </button>
            </div>
        </div>
    );
};

const EquipmentPage = () => {
    const { equipment, getRequestsByEquipment } = useData();
    const [searchTerm, setSearchTerm] = useState('');

    const filteredEquipment = equipment.filter(eq =>
        eq.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        eq.serialNumber.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className={styles.pageContainer}>
            <div className={styles.controls}>
                <div style={{ position: 'relative' }}>
                    <Search
                        size={18}
                        style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }}
                    />
                    <input
                        type="text"
                        placeholder="Search Equipment..."
                        className={styles.searchBar}
                        style={{ paddingLeft: '36px' }}
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
                <button className="btn btn-primary">
                    <Plus size={18} />
                    <span>Add Equipment</span>
                </button>
            </div>

            <div className={styles.grid}>
                {filteredEquipment.map(eq => (
                    <EquipmentCard
                        key={eq.id}
                        equipment={eq}
                        requestCount={getRequestsByEquipment(eq.id).length}
                    />
                ))}
            </div>
        </div>
    );
};

export default EquipmentPage;
