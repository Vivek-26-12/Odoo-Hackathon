import React, { createContext, useContext, useState, useEffect } from 'react';

const DataContext = createContext();

const API_BASE = 'http://localhost:3000';

export const DataProvider = ({ children }) => {
    const [teams, setTeams] = useState([]);
    const [users, setUsers] = useState([]);
    const [equipment, setEquipment] = useState([]);
    const [requests, setRequests] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [categories, setCategories] = useState([]);
    const [locations, setLocations] = useState([]);
    const [teamMembers, setTeamMembers] = useState([]);

    const [currentUser, setCurrentUser] = useState(JSON.parse(localStorage.getItem('user')));

    // Fetch Data on Load or when user changes
    useEffect(() => {
        if (!currentUser) {
            setTeams([]);
            setUsers([]);
            setEquipment([]);
            setRequests([]);
            setDepartments([]);
            setCategories([]);
            setLocations([]);
            setTeamMembers([]);
            return;
        }

        const fetchData = async () => {
            try {
                const [tRes, uRes, eRes, rRes, dRes, cRes, lRes, tmRes] = await Promise.all([
                    fetch(`${API_BASE}/api/teams`),
                    fetch(`${API_BASE}/api/users`),
                    fetch(`${API_BASE}/api/equipment`),
                    fetch(`${API_BASE}/api/requests`),
                    fetch(`${API_BASE}/api/departments`),
                    fetch(`${API_BASE}/api/equipment-categories`),
                    fetch(`${API_BASE}/api/equipment-locations`),
                    fetch(`${API_BASE}/api/team-members`) // New endpoint needed
                ]);

                const tData = await tRes.json();
                const uData = await uRes.json();
                const eData = await eRes.json();
                const rData = await rRes.json();
                const dData = await dRes.json();
                const cData = await cRes.json();
                const lData = await lRes.json();
                const tmData = await tmRes.json();

                setTeams(tData);
                setUsers(uData);
                setEquipment(eData);
                setRequests(rData);
                setDepartments(dData);
                setCategories(cData);
                setLocations(lData);
                setTeamMembers(tmData);
            } catch (error) {
                console.error("Failed to fetch data:", error);
            }
        };
        fetchData();
    }, [currentUser]);

    // --- AUTH ACTIONS ---
    const login = async (email, password) => {
        try {
            const res = await fetch(`${API_BASE}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const data = await res.json();
            if (data.success) {
                setCurrentUser(data.user);
                localStorage.setItem('user', JSON.stringify(data.user));
                return true;
            }
            return false;
        } catch (err) {
            console.error(err);
            return false;
        }
    };

    const signup = async (userData) => {
        try {
            const res = await fetch(`${API_BASE}/auth/signup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData)
            });
            const data = await res.json();
            if (data.success) {
                setCurrentUser(data.user);
                localStorage.setItem('user', JSON.stringify(data.user));
                return true;
            }
            return false;
        } catch (err) {
            console.error(err);
            return false;
        }
    };

    const logout = () => {
        setCurrentUser(null);
        localStorage.removeItem('user');
    };

    // --- DATA ACTIONS ---

    const getEquipmentById = (id) => equipment.find(e => e.id === id);
    const getTeamById = (id) => teams.find(t => t.id === id);
    const getUserById = (id) => users.find(u => u.id === id);

    const createRequest = async (newRequest) => {
        try {
            const payload = { ...newRequest, requesterId: currentUser?.id };
            const res = await fetch(`${API_BASE}/api/requests`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const savedRequest = await res.json();
            setRequests(prev => [...prev, savedRequest]);
            return savedRequest;
        } catch (error) {
            console.error("Error creating request:", error);
        }
    };

    const createBatchRequests = async (newRequests) => {
        try {
            const payload = newRequests.map(r => ({ ...r, requesterId: currentUser?.id }));
            const res = await fetch(`${API_BASE}/api/requests/batch`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const savedRequests = await res.json();
            if (Array.isArray(savedRequests)) {
                setRequests(prev => [...prev, ...savedRequests]);
                return savedRequests;
            }
        } catch (error) {
            console.error("Error creating batch requests:", error);
        }
    };

    const updateRequestStatus = async (id, status, extraFields = {}) => {
        try {
            await fetch(`${API_BASE}/api/requests/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status, ...extraFields })
            });

            setRequests(prev => prev.map(req =>
                req.id === id ? { ...req, status, ...extraFields } : req
            ));

            const req = requests.find(r => r.id === id);
            if (req) {
                if (status === 'Repaired') {
                    updateEquipmentStatus(req.equipmentId, 'Operational');
                } else if (status === 'Scrap') {
                    updateEquipmentStatus(req.equipmentId, 'Scrapped');
                }
            }
        } catch (error) {
            console.error("Error updating request:", error);
        }
    };

    const updateEquipmentStatus = (id, status) => {
        // Optimistic update for now, ideally API call too
        setEquipment(prev => prev.map(e => e.id === id ? { ...e, status } : e));
    }

    const deleteRequest = (id) => {
        // Not implemented in API yet
        setRequests(prev => prev.filter(r => r.id !== id));
    }

    const getRequestsByEquipment = (eqId) => requests.filter(r => r.equipmentId === eqId);

    const createEquipment = async (equipmentData) => {
        try {
            const res = await fetch(`${API_BASE}/api/equipment`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(equipmentData)
            });
            const data = await res.json();
            if (data.success) {
                // Refetch equipment to get the new one with all joined data
                const eRes = await fetch(`${API_BASE}/api/equipment`);
                const eData = await eRes.json();
                setEquipment(eData);
                return data;
            }
            return { success: false, error: data.error };
        } catch (error) {
            console.error("Error creating equipment:", error);
            return { success: false, error: error.message };
        }
    };

    const createCategory = async (name, defaultTeamId) => {
        try {
            const res = await fetch(`${API_BASE}/api/equipment-categories`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, defaultTeamId })
            });
            const newCat = await res.json();
            if (newCat.id) {
                // Fetch fresh list to include joined team names if needed, or just append locally if simple
                // Because the SELECT query joins with teams, simple append is tricky unless we manually add defaultTeamName
                const team = teams.find(t => t.id === parseInt(defaultTeamId));
                setCategories(prev => [...prev, { ...newCat, defaultTeamName: team?.name || 'Unknown' }]);
                return newCat;
            }
        } catch (error) {
            console.error("Error creating category:", error);
        }
    };

    const createTeam = async (name) => {
        try {
            const res = await fetch(`${API_BASE}/api/teams`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name })
            });
            const newTeam = await res.json();
            if (newTeam.id) {
                setTeams(prev => [...prev, newTeam]);
                return newTeam;
            }
        } catch (error) {
            console.error("Error creating team:", error);
        }
    };

    const addTeamMember = async (teamId, userId) => {
        try {
            const res = await fetch(`${API_BASE}/api/teams/${teamId}/members`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId })
            });
            const data = await res.json();
            if (data.success) {
                // Add new membership to tracking array
                setTeamMembers(prev => [...prev, { teamId: parseInt(teamId), userId: userId }]);
                return true;
            }
            return false;
        } catch (error) {
            console.error("Error adding team member:", error);
            return false;
        }
    };

    const removeTeamMember = async (teamId, userId) => {
        try {
            const res = await fetch(`${API_BASE}/api/teams/${teamId}/members/${userId}`, {
                method: 'DELETE'
            });
            const data = await res.json();
            if (data.success) {
                // Remove specific membership
                setTeamMembers(prev => prev.filter(tm => !(tm.teamId === parseInt(teamId) && tm.userId === userId)));
                return true;
            }
            return false;
        } catch (error) {
            console.error("Error removing team member:", error);
            return false;
        }
    };

    const updateUser = async (id, userData) => {
        try {
            const res = await fetch(`${API_BASE}/api/users/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData)
            });
            const data = await res.json();
            if (data.success) {
                setUsers(prev => prev.map(u => u.id === id ? { ...u, ...userData } : u));
                return true;
            }
            return false;
        } catch (error) {
            console.error("Error updating user:", error);
            return false;
        }
    };

    const deleteUser = async (id) => {
        try {
            const res = await fetch(`${API_BASE}/api/users/${id}`, {
                method: 'DELETE'
            });
            const data = await res.json();
            if (data.success) {
                setUsers(prev => prev.filter(u => u.id !== id));
                // Clean up memberships locally for consistency
                setTeamMembers(prev => prev.filter(tm => tm.userId !== id));
                return true;
            }
            return false;
        } catch (error) {
            console.error("Error deleting user:", error);
            return false;
        }
    };

    return (
        <DataContext.Provider value={{
            teams,
            teamMembers,
            users,
            equipment,
            requests,
            departments,
            categories,
            locations,
            getEquipmentById,
            getTeamById,
            getUserById,
            updateUser,
            deleteUser,
            createRequest,
            createBatchRequests,
            createEquipment,
            createCategory,
            createTeam,
            addTeamMember,
            removeTeamMember,
            updateRequestStatus,
            updateEquipmentStatus,
            getRequestsByEquipment,
            deleteRequest,
            currentUser,
            login,
            signup,
            logout
        }}>
            {children}
        </DataContext.Provider>
    );
};

export const useData = () => useContext(DataContext);
