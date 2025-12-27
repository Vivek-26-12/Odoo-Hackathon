import React from 'react';
import { useData } from '../../context/DataContext';
import { useNavigate } from 'react-router-dom';
import StatCard from '../../components/dashboard/StatCard';
import { Wrench, Clock, CheckCircle, Plus } from 'lucide-react';
import styles from './Dashboard.module.css';

const EmployeeDashboard = () => {
    const { requests, equipment, currentUser } = useData();
    const navigate = useNavigate();

    // Filter requests created by current user
    const myRequests = requests.filter(r => r.requesterId === currentUser?.id);
    const openRequests = myRequests.filter(r => r.status === 'New' || r.status === 'In Progress');
    const completedRequests = myRequests.filter(r => r.status === 'Repaired');
    const pendingRequests = myRequests.filter(r => r.status === 'New');

    return (
        <div className={styles.dashboard}>
            <div className={styles.header}>
                <h1>My Requests Dashboard</h1>
                <p>Track your maintenance requests</p>
            </div>

            {/* Stats Grid */}
            <div className={styles.statsGrid}>
                <StatCard
                    title="Total Requests"
                    value={myRequests.length}
                    icon={Wrench}
                    color="#3B82F6"
                />
                <StatCard
                    title="Open"
                    value={openRequests.length}
                    icon={Clock}
                    color="#F59E0B"
                />
                <StatCard
                    title="Completed"
                    value={completedRequests.length}
                    icon={CheckCircle}
                    color="#10B981"
                />
                <StatCard
                    title="Pending"
                    value={pendingRequests.length}
                    icon={Wrench}
                    color="#8B5CF6"
                />
            </div>

            {/* Quick Actions */}
            <div className={styles.section}>
                <h2>Quick Actions</h2>
                <div className={styles.actionsGrid}>
                    <button className="btn btn-primary" onClick={() => navigate('/maintenance')}>
                        <Plus size={18} />
                        <span>Create New Request</span>
                    </button>
                    <button className="btn btn-primary" onClick={() => navigate('/equipment')}>
                        <Wrench size={18} />
                        <span>View Equipment</span>
                    </button>
                </div>
            </div>

            {/* My Requests */}
            <div className={styles.section}>
                <h2>My Recent Requests</h2>
                {myRequests.length > 0 ? (
                    <div className={styles.activityList}>
                        {[...myRequests]
                            .sort((a, b) => new Date(b.createdDate) - new Date(a.createdDate))
                            .slice(0, 10)
                            .map(req => {
                                const eq = equipment.find(e => e.id === req.equipmentId);
                                return (
                                    <div key={req.id} className={styles.activityItem}>
                                        <div className={styles.activityIcon} style={{
                                            backgroundColor: req.status === 'New' ? '#FEF3C7' :
                                                req.status === 'In Progress' ? '#DBEAFE' :
                                                    req.status === 'Repaired' ? '#D1FAE5' : '#FEE2E2'
                                        }}>
                                            <Wrench size={16} />
                                        </div>
                                        <div className={styles.activityContent}>
                                            <p className={styles.activityTitle}>{req.subject}</p>
                                            <p className={styles.activityMeta}>
                                                Equipment: <strong>{eq?.name}</strong> •
                                                Type: {req.type} •
                                                Priority: {req.priority}
                                            </p>
                                        </div>
                                        <span className={`${styles.statusBadge} ${styles[`status${req.status.replace(' ', '')}`]}`}>
                                            {req.status}
                                        </span>
                                    </div>
                                );
                            })}
                    </div>
                ) : (
                    <div className={styles.emptyState}>
                        <Wrench size={48} color="#9CA3AF" />
                        <p>You haven't created any maintenance requests yet</p>
                        <button className="btn btn-primary" onClick={() => navigate('/maintenance')}>
                            Create Your First Request
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default EmployeeDashboard;
