import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { Plus, Search, MapPin, Wrench } from 'lucide-react';
import styles from './Equipment.module.css';
import { useNavigate } from 'react-router-dom';
import EquipmentModal from '../../components/equipment/EquipmentModal';

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
    const [isModalOpen, setIsModalOpen] = useState(false);

    const filteredEquipment = equipment.filter(eq =>
        eq.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        eq.serialNumber.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Calculate stats
    const stats = {
        total: equipment.length,
        operational: equipment.filter(e => e.status === 'Operational').length,
        down: equipment.filter(e => e.status === 'Down').length,
        maintenance: equipment.filter(e => e.status === 'Maintenance').length,
        scrapped: equipment.filter(e => e.status === 'Scrapped').length
    };

    return (
        <div className={styles.pageContainer}>
            {/* Stats Header */}
            <div style={{
                display: 'flex',
                gap: '1rem',
                padding: '1rem',
                background: 'white',
                borderRadius: '8px',
                border: '1px solid #E5E7EB',
                flexWrap: 'wrap'
            }}>
                <div style={{ flex: 1, minWidth: '150px' }}>
                    <div style={{ fontSize: '0.875rem', color: '#6B7280', marginBottom: '0.25rem' }}>Total Equipment</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#111827' }}>{stats.total}</div>
                </div>
                <div style={{ flex: 1, minWidth: '150px' }}>
                    <div style={{ fontSize: '0.875rem', color: '#6B7280', marginBottom: '0.25rem' }}>Operational</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#10B981' }}>{stats.operational}</div>
                </div>
                <div style={{ flex: 1, minWidth: '150px' }}>
                    <div style={{ fontSize: '0.875rem', color: '#6B7280', marginBottom: '0.25rem' }}>Down</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#EF4444' }}>{stats.down}</div>
                </div>
                <div style={{ flex: 1, minWidth: '150px' }}>
                    <div style={{ fontSize: '0.875rem', color: '#6B7280', marginBottom: '0.25rem' }}>Maintenance</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#F59E0B' }}>{stats.maintenance}</div>
                </div>
            </div>

            {/* Controls */}
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
                <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
                    <Plus size={18} />
                    <span>Add Equipment</span>
                </button>
            </div>

            {/* Equipment Grid */}
            <div className={styles.grid}>
                {filteredEquipment.length > 0 ? (
                    filteredEquipment.map(eq => (
                        <EquipmentCard
                            key={eq.id}
                            equipment={eq}
                            requestCount={getRequestsByEquipment(eq.id).length}
                        />
                    ))
                ) : (
                    <div className={styles.emptyState}>
                        <Wrench size={48} color="#D1D5DB" style={{ marginBottom: '1rem' }} />
                        <h3>No Equipment Found</h3>
                        <p>
                            {searchTerm
                                ? `No equipment matches "${searchTerm}"`
                                : 'Start by adding your first equipment'}
                        </p>
                        {!searchTerm && (
                            <button
                                className="btn btn-primary"
                                onClick={() => setIsModalOpen(true)}
                                style={{ marginTop: '1rem' }}
                            >
                                <Plus size={18} />
                                <span>Add Equipment</span>
                            </button>
                        )}
                    </div>
                )}
            </div>

            {isModalOpen && (
                <EquipmentModal onClose={() => setIsModalOpen(false)} />
            )}
        </div>
    );
};

export default EquipmentPage;
