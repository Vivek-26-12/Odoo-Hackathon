import React, { useState, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { Users, Trash2, Edit2, Plus, X, UserPlus, UserMinus, Search, MoreHorizontal } from 'lucide-react';
import styles from './TeamManagement.module.css';

const TeamManagementPage = () => {
    const { teams, users, teamMembers, createTeam, addTeamMember, removeTeamMember } = useData();
    const [isCreating, setIsCreating] = useState(false);
    const [newTeamName, setNewTeamName] = useState('');

    // Manage Members State
    const [selectedTeam, setSelectedTeam] = useState(null);
    const [isAddingMemberMode, setIsAddingMemberMode] = useState(false); // Toggle between "List Members" and "Add Member" view
    const [userSearchTerm, setUserSearchTerm] = useState('');

    const handleCreateTeam = async (e) => {
        e.preventDefault();
        if (newTeamName) {
            await createTeam(newTeamName);
            setNewTeamName('');
            setIsCreating(false);
        }
    };

    // Helper: get all user objects for a given team
    const getMembersForTeam = (teamId) => {
        const memberIds = new Set(teamMembers.filter(tm => tm.teamId === teamId).map(tm => tm.userId));
        return users.filter(u => memberIds.has(u.id));
    };

    // Filter available users to add (exclude those already in THIS team)
    const availableUsersToAdd = useMemo(() => {
        if (!selectedTeam) return [];
        // Get IDs of users currently in this team
        const currentMemberIds = new Set(teamMembers.filter(tm => tm.teamId === selectedTeam.id).map(tm => tm.userId));

        return users.filter(u => !currentMemberIds.has(u.id) &&
            (u.name.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
                u.email?.toLowerCase().includes(userSearchTerm.toLowerCase()))
        );
    }, [users, teamMembers, selectedTeam, userSearchTerm]);

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div>
                    <h1>Team Management</h1>
                    <p>Orchestrate your maintenance squads</p>
                </div>
                <button className="btn btn-primary" onClick={() => setIsCreating(true)}>
                    <Plus size={20} /> Create Squad
                </button>
            </div>

            {/* Create Team Modal */}
            {isCreating && (
                <div className={styles.modalOverlay} onClick={() => setIsCreating(false)}>
                    <div className={styles.modal} onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
                        <div className={styles.modalHeader}>
                            <h2>Create New Squad</h2>
                            <button className="btn-icon" onClick={() => setIsCreating(false)}><X size={20} /></button>
                        </div>
                        <div style={{ padding: '1.5rem' }}>
                            <input
                                type="text"
                                placeholder="Squad Name (e.g. Alpha Team)"
                                value={newTeamName}
                                onChange={e => setNewTeamName(e.target.value)}
                                style={{ width: '100%', padding: '0.75rem', marginBottom: '1rem', borderRadius: '8px', border: '1px solid #D1D5DB' }}
                                autoFocus
                            />
                            <button className="btn btn-primary" style={{ width: '100%' }} onClick={handleCreateTeam}>
                                Create Team
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className={styles.grid}>
                {teams.map(team => {
                    const members = getMembersForTeam(team.id);
                    return (
                        <div key={team.id} className={styles.card}>
                            <div className={styles.cardHeader}>
                                <div className={styles.teamIcon}>
                                    <Users size={24} />
                                </div>
                                <span className={styles.memberCountBadge}>{members.length} Members</span>
                            </div>

                            <div>
                                <h3 className={styles.teamName}>{team.name}</h3>
                                <p className={styles.teamDescription}>Maintenance & Repair Unit</p>
                            </div>

                            <div className={styles.avatarGroup}>
                                {members.slice(0, 5).map((m, i) => (
                                    <div key={m.id} className={styles.avatar} title={m.name} style={{ zIndex: 10 - i }}>
                                        {m.avatar ? <img src={m.avatar} alt="" /> : m.name.charAt(0)}
                                    </div>
                                ))}
                                {members.length > 5 && (
                                    <div className={`${styles.avatar} ${styles.avatarMore}`}>
                                        +{members.length - 5}
                                    </div>
                                )}
                            </div>

                            <div className={styles.cardActions}>
                                <button className="btn btn-sm btn-outline" onClick={() => { setSelectedTeam(team); setIsAddingMemberMode(false); }}>
                                    Manage Members
                                </button>
                                {/* Future: Rename/Delete */}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Manage Members Modal */}
            {selectedTeam && (
                <div className={styles.modalOverlay} onClick={() => setSelectedTeam(null)}>
                    <div className={styles.modal} onClick={e => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <div className={styles.teamIcon} style={{ width: 32, height: 32 }}>
                                    <Users size={16} />
                                </div>
                                <h2>{selectedTeam.name}</h2>
                            </div>
                            <button className="btn-icon" onClick={() => setSelectedTeam(null)}><X size={20} /></button>
                        </div>

                        {!isAddingMemberMode ? (
                            // LIST VIEW
                            <div className={styles.modalContent}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.5rem', borderBottom: '1px solid #F3F4F6' }}>
                                    <h3 style={{ margin: 0, fontSize: '1rem' }}>Current Members</h3>
                                    <button className="btn btn-sm btn-primary" onClick={() => setIsAddingMemberMode(true)}>
                                        <UserPlus size={16} /> Add Member
                                    </button>
                                </div>
                                <ul className={styles.userList}>
                                    {getMembersForTeam(selectedTeam.id).length === 0 ? (
                                        <div className={styles.emptyState}>No members yet. Add someone!</div>
                                    ) : (
                                        getMembersForTeam(selectedTeam.id).map(u => (
                                            <li key={u.id} className={styles.userItem}>
                                                <div className={styles.userInfo}>
                                                    <div className={styles.avatar} style={{ marginLeft: 0, background: '#EFF6FF', color: '#3B82F6' }}>
                                                        {u.name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <h4>{u.name}</h4>
                                                        <p>{u.role}</p>
                                                    </div>
                                                </div>
                                                <button
                                                    className="btn-icon text-danger"
                                                    title="Remove from team"
                                                    onClick={() => removeTeamMember(selectedTeam.id, u.id)}
                                                >
                                                    <UserMinus size={18} color="#EF4444" />
                                                </button>
                                            </li>
                                        ))
                                    )}
                                </ul>
                            </div>
                        ) : (
                            // ADD MEMBER VIEW
                            <div className={styles.modalContent}>
                                <div className={styles.modalHeader} style={{ background: '#fff', padding: '1rem 1.5rem' }}>
                                    <div className={styles.modalSearch} style={{ padding: 0, border: 'none', width: '100%' }}>
                                        <div style={{ position: 'relative' }}>
                                            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
                                            <input
                                                autoFocus
                                                type="text"
                                                placeholder="Search user to add..."
                                                value={userSearchTerm}
                                                onChange={e => setUserSearchTerm(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <button className="btn btn-sm" onClick={() => setIsAddingMemberMode(false)} style={{ marginLeft: '1rem' }}>
                                        Cancel
                                    </button>
                                </div>
                                <div className={styles.modalSectionHeader}>Available Users</div>
                                <ul className={styles.userList} style={{ maxHeight: '400px' }}>
                                    {availableUsersToAdd.length === 0 ? (
                                        <div className={styles.emptyState}>No users found.</div>
                                    ) : (
                                        availableUsersToAdd.map(u => (
                                            <li key={u.id} className={styles.userItem}>
                                                <div className={styles.userInfo}>
                                                    <div className={styles.avatar} style={{ marginLeft: 0 }}>
                                                        {u.name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <h4>{u.name}</h4>
                                                        <p>{u.role} {getMembersForTeam(u.id).length > 0 ? '• In other teams' : ''}</p>
                                                    </div>
                                                </div>
                                                <button
                                                    className="btn btn-sm btn-primary"
                                                    onClick={async () => {
                                                        await addTeamMember(selectedTeam.id, u.id);
                                                        setIsAddingMemberMode(false); // Go back to list after adding
                                                        setUserSearchTerm('');
                                                    }}
                                                >
                                                    Add
                                                </button>
                                            </li>
                                        ))
                                    )}
                                </ul>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default TeamManagementPage;
