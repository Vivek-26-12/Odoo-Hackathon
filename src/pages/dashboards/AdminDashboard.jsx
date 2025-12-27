import React from 'react';
import { useData } from '../../context/DataContext';
import { useNavigate } from 'react-router-dom';
import StatCard from '../../components/dashboard/StatCard';
import { Package, Wrench, AlertCircle, CheckCircle, TrendingUp, Users } from 'lucide-react';
import styles from './Dashboard.module.css';

const AdminDashboard = () => {
    const { equipment, requests, users, teams, getUserById, getEquipmentById } = useData();
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
                    onClick={() => navigate('/equipment')}
                />
                <StatCard
                    title="Open Requests"
                    value={openRequests}
                    icon={AlertCircle}
                    color="#F59E0B"
                    onClick={() => navigate('/maintenance')}
                />
                <StatCard
                    title="Completed"
                    value={completedRequests}
                    icon={CheckCircle}
                    color="#10B981"
                    onClick={() => navigate('/maintenance')}
                />
                <StatCard
                    title="Overdue"
                    value={overdueRequests}
                    icon={Wrench}
                    color="#EF4444"
                    onClick={() => navigate('/maintenance')}
                />
            </div>

            {/* Secondary Stats */}
            <div className={styles.statsGrid}>
                <StatCard
                    title="Operational Equipment"
                    value={operationalEquipment}
                    icon={TrendingUp}
                    color="#8B5CF6"
                    onClick={() => navigate('/equipment')}
                />
                <StatCard
                    title="Down Equipment"
                    value={downEquipment}
                    icon={AlertCircle}
                    color="#EF4444"
                    onClick={() => navigate('/equipment')}
                />
                <StatCard
                    title="Technicians"
                    value={totalTechnicians}
                    icon={Users}
                    color="#06B6D4"
                    onClick={() => navigate('/users')}
                />
                <StatCard
                    title="Teams"
                    value={totalTeams}
                    icon={Users}
                    color="#EC4899"
                    onClick={() => navigate('/teams')}
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
                    <button className="btn btn-primary" onClick={() => navigate('/users')}>
                        <Users size={18} />
                        <span>Manage Users</span>
                    </button>
                    <button className="btn btn-primary" onClick={() => navigate('/teams')}>
                        <Users size={18} />
                        <span>Manage Teams</span>
                    </button>
                </div>
            </div>


        </div>
    );
};

export default AdminDashboard;
