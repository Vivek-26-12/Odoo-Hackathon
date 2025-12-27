import React from 'react';
import { useData } from '../../context/DataContext';
import { useNavigate } from 'react-router-dom';
import StatCard from '../../components/dashboard/StatCard';
import { Calendar, Wrench, AlertCircle, Clock, Users } from 'lucide-react';
import styles from './Dashboard.module.css';

const ManagerDashboard = () => {
    const { requests, equipment, users } = useData();
    const navigate = useNavigate();

    // Calculate stats
    const openRequests = requests.filter(r => r.status === 'New' || r.status === 'In Progress').length;
    const preventiveRequests = requests.filter(r => r.type === 'Preventive').length;
    const correctiveRequests = requests.filter(r => r.type === 'Corrective').length;
    const overdueRequests = requests.filter(r => r.isOverdue).length;

    // Upcoming preventive maintenance (next 7 days)
    const today = new Date();
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    const upcomingMaintenance = requests.filter(r =>
        r.type === 'Preventive' &&
        r.scheduledDate &&
        new Date(r.scheduledDate) >= today &&
        new Date(r.scheduledDate) <= nextWeek
    );

    // Unassigned requests
    const unassignedRequests = requests.filter(r => !r.technicianId && r.status === 'New');

    return (
        <div className={styles.dashboard}>
            <div className={styles.header}>
                <h1>Manager Dashboard</h1>
                <p>Planning, scheduling, and team assignment</p>
            </div>

            {/* Stats Grid */}
            <div className={styles.statsGrid}>
                <StatCard
                    title="Open Requests"
                    value={openRequests}
                    icon={Wrench}
                    color="#F59E0B"
                />
                <StatCard
                    title="Preventive Jobs"
                    value={preventiveRequests}
                    icon={Calendar}
                    color="#10B981"
                />
                <StatCard
                    title="Corrective Jobs"
                    value={correctiveRequests}
                    icon={AlertCircle}
                    color="#EF4444"
                />
                <StatCard
                    title="Overdue"
                    value={overdueRequests}
                    icon={Clock}
                    color="#DC2626"
                />
            </div>

            {/* Quick Actions */}
            <div className={styles.section}>
                <h2>Quick Actions</h2>
                <div className={styles.actionsGrid}>
                    <button className="btn btn-primary" onClick={() => navigate('/calendar')}>
                        <Calendar size={18} />
                        <span>Schedule Preventive Maintenance</span>
                    </button>
                    <button className="btn btn-primary" onClick={() => navigate('/maintenance')}>
                        <Wrench size={18} />
                        <span>Assign Technicians</span>
                    </button>
                    <button className="btn btn-primary" onClick={() => navigate('/equipment')}>
                        <Users size={18} />
                        <span>View Equipment</span>
                    </button>
                </div>
            </div>

            {/* Upcoming Preventive Maintenance */}
            <div className={styles.section}>
                <h2>Upcoming Preventive Maintenance (Next 7 Days)</h2>
                {upcomingMaintenance.length > 0 ? (
                    <div className={styles.activityList}>
                        {upcomingMaintenance.map(req => {
                            const eq = equipment.find(e => e.id === req.equipmentId);
                            const tech = req.technicianId ? users.find(u => u.id === req.technicianId) : null;
                            return (
                                <div key={req.id} className={styles.activityItem}>
                                    <div className={styles.activityIcon} style={{ backgroundColor: '#D1FAE5' }}>
                                        <Calendar size={16} />
                                    </div>
                                    <div className={styles.activityContent}>
                                        <p className={styles.activityTitle}>{req.subject}</p>
                                        <p className={styles.activityMeta}>
                                            Equipment: <strong>{eq?.name}</strong> •
                                            Scheduled: {new Date(req.scheduledDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} •
                                            {tech ? ` Assigned to ${tech.name}` : ' Unassigned'}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <p className={styles.emptyState}>No preventive maintenance scheduled for the next 7 days</p>
                )}
            </div>

            {/* Unassigned Requests */}
            <div className={styles.section}>
                <h2>Unassigned Requests ({unassignedRequests.length})</h2>
                {unassignedRequests.length > 0 ? (
                    <div className={styles.activityList}>
                        {unassignedRequests.slice(0, 5).map(req => {
                            const eq = equipment.find(e => e.id === req.equipmentId);
                            return (
                                <div key={req.id} className={styles.activityItem}>
                                    <div className={styles.activityIcon} style={{ backgroundColor: '#FEF3C7' }}>
                                        <AlertCircle size={16} />
                                    </div>
                                    <div className={styles.activityContent}>
                                        <p className={styles.activityTitle}>{req.subject}</p>
                                        <p className={styles.activityMeta}>
                                            Equipment: <strong>{eq?.name}</strong> • Priority: {req.priority}
                                        </p>
                                    </div>
                                    <button
                                        className="btn btn-sm"
                                        onClick={() => navigate('/maintenance')}
                                    >
                                        Assign
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <p className={styles.emptyState}>All requests are assigned!</p>
                )}
            </div>
        </div>
    );
};

export default ManagerDashboard;
