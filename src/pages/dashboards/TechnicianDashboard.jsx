import React from 'react';
import { useData } from '../../context/DataContext';
import { useNavigate } from 'react-router-dom';
import StatCard from '../../components/dashboard/StatCard';
import { Wrench, Clock, CheckCircle, Calendar } from 'lucide-react';
import styles from './Dashboard.module.css';

const TechnicianDashboard = () => {
    const { requests, equipment, currentUser } = useData();
    const navigate = useNavigate();

    // Filter requests assigned to current technician
    const myRequests = requests.filter(r => r.technicianId === currentUser?.id);
    const myActiveRequests = myRequests.filter(r => r.status === 'New' || r.status === 'In Progress');
    const myCompletedRequests = myRequests.filter(r => r.status === 'Repaired');
    const myInProgressRequests = myRequests.filter(r => r.status === 'In Progress');

    // Today's scheduled jobs
    const today = new Date().toDateString();
    const todaysJobs = myRequests.filter(r =>
        r.scheduledDate && new Date(r.scheduledDate).toDateString() === today
    );

    return (
        <div className={styles.dashboard}>
            <div className={styles.header}>
                <h1>My Work Dashboard</h1>
                <p>Your assigned maintenance tasks</p>
            </div>

            {/* Stats Grid */}
            <div className={styles.statsGrid}>
                <StatCard
                    title="Assigned to Me"
                    value={myActiveRequests.length}
                    icon={Wrench}
                    color="#F59E0B"
                />
                <StatCard
                    title="In Progress"
                    value={myInProgressRequests.length}
                    icon={Clock}
                    color="#3B82F6"
                />
                <StatCard
                    title="Completed"
                    value={myCompletedRequests.length}
                    icon={CheckCircle}
                    color="#10B981"
                />
                <StatCard
                    title="Today's Jobs"
                    value={todaysJobs.length}
                    icon={Calendar}
                    color="#8B5CF6"
                />
            </div>

            {/* Quick Actions */}
            <div className={styles.section}>
                <h2>Quick Actions</h2>
                <div className={styles.actionsGrid}>
                    <button className="btn btn-primary" onClick={() => navigate('/maintenance')}>
                        <Wrench size={18} />
                        <span>View My Requests</span>
                    </button>
                    <button className="btn btn-primary" onClick={() => navigate('/calendar')}>
                        <Calendar size={18} />
                        <span>View Schedule</span>
                    </button>
                </div>
            </div>

            {/* Today's Jobs */}
            <div className={styles.section}>
                <h2>Today's Scheduled Jobs</h2>
                {todaysJobs.length > 0 ? (
                    <div className={styles.activityList}>
                        {todaysJobs.map(req => {
                            const eq = equipment.find(e => e.id === req.equipmentId);
                            return (
                                <div key={req.id} className={styles.activityItem}>
                                    <div className={styles.activityIcon} style={{
                                        backgroundColor: req.status === 'New' ? '#FEF3C7' : '#DBEAFE'
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
                    <p className={styles.emptyState}>No jobs scheduled for today</p>
                )}
            </div>

            {/* Active Requests */}
            <div className={styles.section}>
                <h2>My Active Requests</h2>
                {myActiveRequests.length > 0 ? (
                    <div className={styles.activityList}>
                        {myActiveRequests.slice(0, 5).map(req => {
                            const eq = equipment.find(e => e.id === req.equipmentId);
                            return (
                                <div key={req.id} className={styles.activityItem}>
                                    <div className={styles.activityIcon} style={{
                                        backgroundColor: req.status === 'New' ? '#FEF3C7' : '#DBEAFE'
                                    }}>
                                        <Wrench size={16} />
                                    </div>
                                    <div className={styles.activityContent}>
                                        <p className={styles.activityTitle}>{req.subject}</p>
                                        <p className={styles.activityMeta}>
                                            Equipment: <strong>{eq?.name}</strong> •
                                            Priority: {req.priority}
                                            {req.isOverdue && <span style={{ color: '#EF4444', marginLeft: '8px' }}>⚠ OVERDUE</span>}
                                        </p>
                                    </div>
                                    <button
                                        className="btn btn-sm btn-primary"
                                        onClick={() => navigate('/maintenance')}
                                    >
                                        Work on it
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <p className={styles.emptyState}>No active requests assigned to you</p>
                )}
            </div>
        </div>
    );
};

export default TechnicianDashboard;
