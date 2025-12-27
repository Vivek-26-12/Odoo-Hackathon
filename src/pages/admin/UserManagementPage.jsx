import React, { useState, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { Search, Edit2, Trash2, X, AlertTriangle, Check, User } from 'lucide-react';
import styles from './UserManagement.module.css';

const UserManagementPage = () => {
    const { users, updateUser, deleteUser, currentUser } = useData();

    // State for Search & Filter
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('All');

    // State for Modals
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);

    // Edit Form State
    const [editFormData, setEditFormData] = useState({
        name: '',
        email: '',
        role: ''
    });

    // Derived State: Filtered Users
    const filteredUsers = useMemo(() => {
        return users.filter(user => {
            const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase()));
            const matchesRole = roleFilter === 'All' || user.role === roleFilter;
            return matchesSearch && matchesRole;
        });
    }, [users, searchTerm, roleFilter]);

    // Handlers
    const handleEditClick = (user) => {
        setSelectedUser(user);
        setEditFormData({
            name: user.name,
            email: user.email || '',
            role: user.role
        });
        setIsEditModalOpen(true);
    };

    const handleDeleteClick = (user) => {
        setSelectedUser(user);
        setIsDeleteModalOpen(true);
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        if (selectedUser) {
            await updateUser(selectedUser.id, editFormData);
            setIsEditModalOpen(false);
            setSelectedUser(null);
        }
    };

    const handleDeleteConfirm = async () => {
        if (selectedUser) {
            await deleteUser(selectedUser.id);
            setIsDeleteModalOpen(false);
            setSelectedUser(null);
        }
    };

    const getRoleBadgeClass = (role) => {
        switch (role) {
            case 'Admin': return styles.roleAdmin;
            case 'Manager': return styles.roleManager;
            case 'Technician': return styles.roleTechnician;
            default: return styles.roleEmployee;
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.headerTitle}>
                    <h1>User Management</h1>
                    <p>Oversee all system access and roles</p>
                </div>
                {/* Placeholder for future Invite User feature */}
                {/* <button className="btn btn-primary"><Plus size={20} /> Invite User</button> */}
            </div>

            {/* Toolbar */}
            <div className={styles.toolbar}>
                <div className={styles.searchContainer}>
                    <Search className={styles.searchIcon} size={20} />
                    <input
                        type="text"
                        className={styles.searchInput}
                        placeholder="Search by name or email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <select
                    className={styles.filterSelect}
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                >
                    <option value="All">All Roles</option>
                    <option value="Admin">Admin</option>
                    <option value="Manager">Manager</option>
                    <option value="Technician">Technician</option>
                    <option value="Employee">Employee</option>
                </select>
            </div>

            {/* Table */}
            <div className={styles.tableContainer}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>User</th>
                            <th>Role</th>
                            <th>Status</th>
                            <th style={{ textAlign: 'right' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredUsers.length === 0 ? (
                            <tr>
                                <td colSpan="4" style={{ textAlign: 'center', padding: '3rem', color: '#9CA3AF' }}>
                                    No users found matching your search.
                                </td>
                            </tr>
                        ) : (
                            filteredUsers.map(user => (
                                <tr key={user.id}>
                                    <td>
                                        <div className={styles.userCell}>
                                            <div className={styles.avatar}>
                                                {user.avatar ? <img src={user.avatar} alt={user.name} /> : user.name.charAt(0)}
                                            </div>
                                            <div className={styles.userInfo}>
                                                <span className={styles.userName}>{user.name}</span>
                                                <span className={styles.userEmail}>{user.email || 'No email'}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`${styles.roleBadge} ${getRoleBadgeClass(user.role)}`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td>
                                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.875rem', color: '#059669' }}>
                                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981' }}></div>
                                            Active
                                        </span>
                                    </td>
                                    <td>
                                        <div className={styles.actionsCell} style={{ justifyContent: 'flex-end' }}>
                                            <button
                                                className={`${styles.actionBtn} ${styles.editBtn}`}
                                                title="Edit User"
                                                onClick={() => handleEditClick(user)}
                                            >
                                                <Edit2 size={18} />
                                            </button>
                                            {/* Prevent deleting yourself */}
                                            {currentUser?.id !== user.id && (
                                                <button
                                                    className={`${styles.actionBtn} ${styles.deleteBtn}`}
                                                    title="Delete User"
                                                    onClick={() => handleDeleteClick(user)}
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Edit Modal */}
            {isEditModalOpen && (
                <div className={styles.modalOverlay} onClick={() => setIsEditModalOpen(false)}>
                    <div className={styles.modal} onClick={e => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h2>Edit User</h2>
                            <button className="btn-icon" onClick={() => setIsEditModalOpen(false)}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleEditSubmit}>
                            <div className={styles.modalContent}>
                                <div className={styles.formGroup}>
                                    <label>Full Name</label>
                                    <input
                                        type="text"
                                        required
                                        className={styles.formInput}
                                        value={editFormData.name}
                                        onChange={e => setEditFormData({ ...editFormData, name: e.target.value })}
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label>Email Address</label>
                                    <input
                                        type="email"
                                        className={styles.formInput}
                                        value={editFormData.email}
                                        onChange={e => setEditFormData({ ...editFormData, email: e.target.value })}
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label>Role</label>
                                    <select
                                        className={styles.formSelect}
                                        value={editFormData.role}
                                        onChange={e => setEditFormData({ ...editFormData, role: e.target.value })}
                                    >
                                        <option value="Admin">Admin</option>
                                        <option value="Manager">Manager</option>
                                        <option value="Technician">Technician</option>
                                        <option value="Employee">Employee</option>
                                    </select>
                                </div>
                            </div>
                            <div className={styles.modalFooter}>
                                <button type="button" className="btn btn-outline" onClick={() => setIsEditModalOpen(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">Save Changes</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {isDeleteModalOpen && (
                <div className={styles.modalOverlay} onClick={() => setIsDeleteModalOpen(false)}>
                    <div className={styles.modal} onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
                        <div className={styles.modalContent} style={{ textAlign: 'center', padding: '2.5rem' }}>
                            <div style={{
                                width: '64px', height: '64px', borderRadius: '50%', background: '#FEF2F2',
                                color: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                margin: '0 auto 1.5rem auto'
                            }}>
                                <AlertTriangle size={32} />
                            </div>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '1rem' }}>Delete User?</h2>
                            <p style={{ color: '#6B7280', marginBottom: '2rem' }}>
                                Are you sure you want to delete <strong>{selectedUser?.name}</strong>? This action cannot be undone.
                            </p>
                            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                                <button className="btn btn-outline" onClick={() => setIsDeleteModalOpen(false)} style={{ width: '100%' }}>Cancel</button>
                                <button className="btn btn-danger" onClick={handleDeleteConfirm} style={{ width: '100%' }}>Delete</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserManagementPage;
