import React from 'react';
import { useData } from '../../context/DataContext';
import { useNavigate } from 'react-router-dom';
import StatCard from '../../components/dashboard/StatCard';
import { Package, Wrench, AlertCircle, CheckCircle, TrendingUp, Users } from 'lucide-react';
import styles from './Dashboard.module.css';

const AdminDashboard = () => {
    const { equipment, requests, users, teams } = useData();
    const navigate = useNavigate();

    // Calculate stats
    const totalEquipment = equipment.length;
    const operationalEquipment = equipment.filter(e => e.status === 'Operational').length;
    const downEquipment = equipment.filter(e => e.status === 'Down').length;
    const scrappedEquipment = equipment.filter(e => e.status === 'Scrapped').length;

    const totalRequests = requests.length;
    const openRequests = requests.filter(r => r.status === 'New' || r.status === 'In Progress').length;
    const completedRequests = requests.filter(r => r.status === 'Repaired').length;
    const overdueRequests = requests.filter(r => r.isOverdue).length;

    const totalTechnicians = users.filter(u => u.role === 'Technician').length;
    const totalTeams = teams.length;

    // Recent activity
    const recentRequests = [...requests]
        .sort((a, b) => new Date(b.createdDate) - new Date(a.createdDate))
        .slice(0, 5);

    return (
        <div className={styles.dashboard}>
            <div className={styles.header}>
                <h1>Admin Dashboard</h1>
                <p>Complete system overview and management</p>
            </div>

            {/* Stats Grid */}
            <div className={styles.statsGrid}>
                <StatCard
                    title="Total Equipment"
                    value={totalEquipment}
                    icon={Package}
                    color="#3B82F6"
                />
                <StatCard
                    title="Open Requests"
                    value={openRequests}
                    icon={AlertCircle}
                    color="#F59E0B"
                />
                <StatCard
                    title="Completed"
                    value={completedRequests}
                    icon={CheckCircle}
                    color="#10B981"
                />
                <StatCard
                    title="Overdue"
                    value={overdueRequests}
                    icon={Wrench}
                    color="#EF4444"
                />
            </div>

            {/* Secondary Stats */}
            <div className={styles.statsGrid}>
                <StatCard
                    title="Operational Equipment"
                    value={operationalEquipment}
                    icon={TrendingUp}
                    color="#8B5CF6"
                />
                <StatCard
                    title="Down Equipment"
                    value={downEquipment}
                    icon={AlertCircle}
                    color="#EF4444"
                />
                <StatCard
                    title="Technicians"
                    value={totalTechnicians}
                    icon={Users}
                    color="#06B6D4"
                />
                <StatCard
                    title="Teams"
                    value={totalTeams}
                    icon={Users}
                    color="#EC4899"
                />
            </div>

            {/* Quick Actions */}
            <div className={styles.section}>
                <h2>Quick Actions</h2>
                <div className={styles.actionsGrid}>
                    <button className="btn btn-primary" onClick={() => navigate('/equipment')}>
                        <Package size={18} />
                        <span>Manage Equipment</span>
                    </button>
                    <button className="btn btn-primary" onClick={() => navigate('/maintenance')}>
                        <Wrench size={18} />
                        <span>View All Requests</span>
                    </button>
                    <button className="btn btn-primary" onClick={() => navigate('/calendar')}>
                        <CheckCircle size={18} />
                        <span>Schedule Maintenance</span>
                    </button>
                </div>
            </div>

            {/* Recent Activity */}
            <div className={styles.section}>
                <h2>Recent Requests</h2>
                <div className={styles.activityList}>
                    {recentRequests.map(req => (
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
                                    Status: <strong>{req.status}</strong> • Priority: {req.priority}
                                </p>
                            </div>
                            <span className={`${styles.statusBadge} ${styles[`status${req.status.replace(' ', '')}`]}`}>
                                {req.status}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
