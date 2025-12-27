import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { Plus, AlertCircle, Clock, CheckCircle, Trash2, Calendar } from 'lucide-react';
import styles from './Kanban.module.css';
import RequestModal from '../../components/maintenance/RequestModal';

// --- Kanban Card Component ---
const KanbanCard = ({ request, onDragStart }) => {
    const { getEquipmentById, getUserById } = useData();
    const equipment = getEquipmentById(request.equipmentId);
    const assignedUser = request.technicianId ? getUserById(request.technicianId) : null;

    // Priority and Overdue Logic
    const isOverdue = request.isOverdue;
    const priorityClass = `priority${request.priority || 'Medium'}`;

    return (
        <div
            className={`${styles.card} ${isOverdue ? styles.overdue : ''}`}
            draggable // Enable HTML5 Drag
            onDragStart={(e) => onDragStart(e, request.id)}
        >
            <div className={styles.cardHeader}>
                <span className={styles.cardTitle}>{request.subject}</span>
                <span className={`${styles.priorityBadge} ${styles[priorityClass]}`} title={`Priority: ${request.priority}`}></span>
            </div>

            <div className={styles.cardMeta}>
                <div className={styles.equipmentName} title="Equipment">
                    <strong>EQ:</strong> {equipment ? equipment.name : 'Unknown Equipment'}
                </div>
                {request.scheduledDate && (
                    <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                        <Calendar size={12} /> {new Date(request.scheduledDate).toLocaleDateString()}
                    </div>
                )}
            </div>

            <div className={styles.cardFooter}>
                <div className={styles.assignee}>
                    {assignedUser ? (
                        <>
                            <img src={assignedUser.avatar} alt={assignedUser.name} />
                            <span>{assignedUser.name.split(' ')[0]}</span>
                        </>
                    ) : (
                        <span style={{ color: '#9CA3AF' }}>Unassigned</span>
                    )}
                </div>
                {isOverdue && <AlertCircle size={16} color="var(--color-danger)" />}
            </div>
        </div>
    );
};



// --- Main Kanban Board ---
const KanbanBoard = ({ equipmentId }) => {
    const { requests, updateRequestStatus, equipment } = useData();
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Filter requests
    const filteredRequests = equipmentId
        ? requests.filter(r => r.equipmentId === equipmentId)
        : requests;

    const currentEquipment = equipmentId ? equipment.find(e => e.id === equipmentId) : null;

    // Columns Configuration
    const columns = [
        { id: 'New', label: 'New', icon: AlertCircle },
        { id: 'In Progress', label: 'In Progress', icon: Clock },
        { id: 'Repaired', label: 'Repaired', icon: CheckCircle },
        { id: 'Scrap', label: 'Scrap', icon: Trash2 },
    ];

    // Drag & Drop Handlers
    const onDragStart = (e, id) => {
        e.dataTransfer.setData('requestId', id);
    };

    const onDragOver = (e) => {
        e.preventDefault(); // Necessary to allow dropping
    };

    const onDrop = (e, status) => {
        const id = e.dataTransfer.getData('requestId');
        updateRequestStatus(id, status);
    };

    return (
        <div className={styles.boardContainer}>
            <div className={styles.controls}>
                <h3>
                    {currentEquipment ? `Requests for ${currentEquipment.name}` : 'Request Board'}
                    {equipmentId && (
                        <a href="/maintenance" className="btn" style={{ fontSize: '0.8rem', marginLeft: '1rem', background: '#e5e7eb', color: '#374151' }}>
                            Clear Filter
                        </a>
                    )}
                </h3>
                <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
                    <Plus size={18} />
                    <span>New Request</span>
                </button>
            </div>

            <div className={styles.board}>
                {columns.map(col => {
                    const colRequests = filteredRequests.filter(r => r.status === col.id);
                    return (
                        <div
                            key={col.id}
                            className={styles.column}
                            onDragOver={onDragOver}
                            onDrop={(e) => onDrop(e, col.id)}
                        >
                            <div className={styles.columnHeader}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <col.icon size={16} />
                                    <span>{col.label}</span>
                                </div>
                                <span className={styles.countBadge}>{colRequests.length}</span>
                            </div>
                            <div className={styles.columnContent}>
                                {colRequests.map(req => (
                                    <KanbanCard
                                        key={req.id}
                                        request={req}
                                        onDragStart={onDragStart}
                                    />
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>

            {isModalOpen && (
                <RequestModal
                    onClose={() => setIsModalOpen(false)}
                    initialEquipmentId={equipmentId}
                />
            )}
        </div>
    );
};

export default KanbanBoard;
