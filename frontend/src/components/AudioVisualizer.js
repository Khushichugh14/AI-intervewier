'use client';

import React from 'react';
import styles from './AudioVisualizer.module.css';

export const AudioVisualizer = ({ isActive }) => {
    if (!isActive) return null;

    return (
        <div className={styles.visualizerContainer}>
            <span className={styles.visualizerText}>Listening to your answer...</span>
            <div className={styles.waves}>
                <div className={`${styles.bar} ${styles.bar1}`}></div>
                <div className={`${styles.bar} ${styles.bar2}`}></div>
                <div className={`${styles.bar} ${styles.bar3}`}></div>
                <div className={`${styles.bar} ${styles.bar4}`}></div>
                <div className={`${styles.bar} ${styles.bar5}`}></div>
                <div className={`${styles.bar} ${styles.bar6}`}></div>
                <div className={`${styles.bar} ${styles.bar7}`}></div>
                <div className={`${styles.bar} ${styles.bar8}`}></div>
            </div>
        </div>
    );
};

export default AudioVisualizer;
