'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { LogOut, User, BarChart2, BookOpen, Compass } from 'lucide-react';
import styles from './Navbar.module.css';

export const Navbar = () => {
    const { user, logout } = useAuth();
    const pathname = usePathname();

    if (!user) return null; // Hide navbar on landing/auth page when not logged in

    return (
        <header className={`${styles.header} glass-panel`}>
            <div className={`${styles.navContainer} container`}>
                <Link href="/dashboard" className={styles.logo}>
                    <Compass className={styles.logoIcon} />
                    <span>AI <span className="text-gradient">Interviewer</span></span>
                </Link>
                
                <nav className={styles.navLinks}>
                    <Link 
                        href="/dashboard" 
                        className={`${styles.navLink} ${pathname === '/dashboard' ? styles.activeLink : ''}`}
                    >
                        <BarChart2 size={18} />
                        <span>Dashboard</span>
                    </Link>
                    <Link 
                        href="/interview" 
                        className={`${styles.navLink} ${pathname === '/interview' ? styles.activeLink : ''}`}
                    >
                        <BookOpen size={18} />
                        <span>Mock Interview</span>
                    </Link>
                </nav>

                <div className={styles.profileSection}>
                    <div className={styles.userInfo}>
                        <User size={16} className={styles.userIcon} />
                        <span className={styles.userName}>{user.name}</span>
                    </div>
                    <button onClick={logout} className={`${styles.logoutBtn} btn-secondary`} title="Log Out">
                        <LogOut size={16} />
                        <span>Log Out</span>
                    </button>
                </div>
            </div>
        </header>
    );
};

export default Navbar;
