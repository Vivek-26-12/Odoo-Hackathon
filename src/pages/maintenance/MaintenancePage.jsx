import React from 'react';
import KanbanBoard from './KanbanBoard';

import { useSearchParams } from 'react-router-dom';

const MaintenancePage = () => {
    const [searchParams] = useSearchParams();
    const equipmentId = searchParams.get('equipmentId');

    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <KanbanBoard equipmentId={equipmentId ? parseInt(equipmentId) : null} />
        </div>
    );
};

export default MaintenancePage;
