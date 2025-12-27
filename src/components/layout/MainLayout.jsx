import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, PenTool, Wrench, Calendar, Settings, LogOut } from 'lucide-react';
import styles from './Layout.module.css';

const SidebarItem = ({ to, icon: Icon, label }) => (
    <NavLink
        to={to}
        className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}
    >
        <Icon size={20} />
        <span>{label}</span>
    </NavLink>
);

import { useData } from '../../context/DataContext';

const Sidebar = () => {
    const { logout } = useData();

    return (
        <aside className={styles.sidebar}>
            <div className={styles.logo}>
                <Wrench size={28} className={styles.logoIcon} />
                <h1>GearGuard</h1>
            </div>

            <nav className={styles.nav}>
                <div className={styles.navGroup}>
                    <span className={styles.groupLabel}>Main</span>
                    <SidebarItem to="/dashboard" icon={LayoutDashboard} label="Dashboard" />
                    <SidebarItem to="/equipment" icon={PenTool} label="Equipment" />
                    <SidebarItem to="/maintenance" icon={Wrench} label="Maintenance" />
                    <SidebarItem to="/calendar" icon={Calendar} label="Calendar" />
                </div>
            </nav>

            <div className={styles.footer}>
                <button className={styles.logoutBtn} onClick={logout}>
                    <LogOut size={18} />
                    <span>Logout</span>
                </button>
            </div>
        </aside>
    );
};

const MainLayout = () => {
    const { currentUser } = useData();

    return (
        <div className={styles.layout}>
            <Sidebar />
            <main className={styles.main}>
                <header className={styles.header}>
                    <h2 className={styles.pageTitle}>Maintenance Overview</h2>
                    <div className={styles.userProfile}>
                        <img src={currentUser?.avatar || "https://i.pravatar.cc/150?u=default"} alt="User" />
                        <span>{currentUser?.name || 'User'}</span>
                    </div>
                </header>
                <div className={styles.content}>
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default MainLayout;
