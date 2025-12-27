import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, format, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import styles from './Calendar.module.css';
import RequestModal from '../components/maintenance/RequestModal';
import PreventiveMaintenanceModal from '../components/maintenance/PreventiveMaintenanceModal';

const CalendarPage = () => {
    const { requests } = useData();
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(null);
    const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);

    const preventiveRequests = requests.filter(r =>
        r.type === 'Preventive' && r.scheduledDate
    );

    const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
    const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

    const startDate = startOfWeek(startOfMonth(currentMonth));
    const endDate = endOfWeek(endOfMonth(currentMonth));
    const days = eachDayOfInterval({ start: startDate, end: endDate });

    const getEventsForDay = (day) => {
        return preventiveRequests.filter(req =>
            isSameDay(new Date(req.scheduledDate), day)
        );
    };

    return (
        <div className={styles.calendarContainer}>
            <div className={styles.header}>
                <div className={styles.monthNav}>
                    <button onClick={prevMonth} className="btn"><ChevronLeft size={20} /></button>
                    <h2>{format(currentMonth, 'MMMM yyyy')}</h2>
                    <button onClick={nextMonth} className="btn"><ChevronRight size={20} /></button>
                </div>
                <button className="btn btn-primary" onClick={() => setIsScheduleModalOpen(true)}>
                    <PlusIcon /> Plan Maintenance
                </button>
            </div>

            <div className={styles.grid}>
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className={styles.dayHeader}>{day}</div>
                ))}

                {days.map(day => {
                    const dayEvents = getEventsForDay(day);
                    const isCurrentMonth = isSameMonth(day, currentMonth);
                    return (
                        <div
                            key={day.toString()}
                            className={`${styles.dayCell} ${!isCurrentMonth ? styles.dimmed : ''}`}
                            onClick={() => setSelectedDate(day)}
                        >
                            <span className={styles.dayNumber}>{format(day, 'd')}</span>
                            <div className={styles.eventsList}>
                                {dayEvents.map(ev => (
                                    <div key={ev.id} className={styles.eventPill} title={ev.subject}>
                                        {ev.subject}
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
            {isScheduleModalOpen && (
                <PreventiveMaintenanceModal
                    onClose={() => setIsScheduleModalOpen(false)}
                />
            )}
            {selectedDate && (
                <RequestModal
                    onClose={() => setSelectedDate(null)}
                    initialDate={selectedDate}
                />
            )}
        </div>
    );
};

const PlusIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}>
        <line x1="12" y1="5" x2="12" y2="19"></line>
        <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
)

export default CalendarPage;
