import React from 'react';
import styles from './StatCard.module.css';

const StatCard = ({ title, value, icon: Icon, color = '#3B82F6', trend }) => {
    return (
        <div className={styles.card} style={{ borderLeftColor: color }}>
            <div className={styles.header}>
                <div className={styles.iconWrapper} style={{ backgroundColor: `${color}15` }}>
                    {Icon && <Icon size={24} color={color} />}
                </div>
                <div className={styles.content}>
                    <h3 className={styles.title}>{title}</h3>
                    <p className={styles.value}>{value}</p>
                    {trend && (
                        <span className={styles.trend} style={{ color: trend > 0 ? '#10B981' : '#EF4444' }}>
                            {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StatCard;
