import React, { createContext, useContext, useState, useEffect } from 'react';

const DataContext = createContext();

const API_BASE = 'http://localhost:3000';

export const DataProvider = ({ children }) => {
    const [teams, setTeams] = useState([]);
    const [users, setUsers] = useState([]);
    const [equipment, setEquipment] = useState([]);
    const [requests, setRequests] = useState([]);

    const [currentUser, setCurrentUser] = useState(JSON.parse(localStorage.getItem('user')));

    // Fetch Data on Load or when user changes
    useEffect(() => {
        if (!currentUser) {
            setTeams([]);
            setUsers([]);
            setEquipment([]);
            setRequests([]);
            return;
        }

        const fetchData = async () => {
            try {
                const [tRes, uRes, eRes, rRes] = await Promise.all([
                    fetch(`${API_BASE}/api/teams`),
                    fetch(`${API_BASE}/api/users`),
                    fetch(`${API_BASE}/api/equipment`),
                    fetch(`${API_BASE}/api/requests`)
                ]);

                const tData = await tRes.json();
                const uData = await uRes.json();
                const eData = await eRes.json();
                const rData = await rRes.json();

                setTeams(tData);
                setUsers(uData);
                setEquipment(eData);
                setRequests(rData);
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

    return (
        <DataContext.Provider value={{
            teams,
            users,
            equipment,
            requests,
            getEquipmentById,
            getTeamById,
            getUserById,
            createRequest,
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
