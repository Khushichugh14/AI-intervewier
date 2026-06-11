'use client';

import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { apiService } from '../services/api';
import styles from './ResumeUpload.module.css';

export const ResumeUpload = ({ activeResumeName, onUploadSuccess }) => {
    const [dragActive, setDragActive] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [status, setStatus] = useState(activeResumeName ? 'success' : 'idle'); // idle, uploading, success, error
    const [fileName, setFileName] = useState(activeResumeName || '');
    const [errorMessage, setErrorMessage] = useState('');
    
    const fileInputRef = useRef(null);

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const validateAndUpload = async (file) => {
        if (!file) return;
        
        const extension = file.name.substring(file.name.lastIndexOf(".") + 1).toLowerCase();
        if (extension !== 'pdf' && extension !== 'docx') {
            setStatus('error');
            setErrorMessage('Only PDF and DOCX files are supported.');
            return;
        }

        setUploading(true);
        setStatus('uploading');
        setErrorMessage('');

        try {
            const result = await apiService.uploadResume(file);
            setStatus('success');
            setFileName(file.name);
            if (onUploadSuccess) {
                onUploadSuccess(file.name);
            }
        } catch (error) {
            console.error('Upload error:', error);
            setStatus('error');
            setErrorMessage(error.message || 'Failed to upload and parse resume.');
        } finally {
            setUploading(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            validateAndUpload(e.dataTransfer.files[0]);
        }
    };

    const handleChange = (e) => {
        e.preventDefault();
        if (e.target.files && e.target.files[0]) {
            validateAndUpload(e.target.files[0]);
        }
    };

    const onButtonClick = () => {
        fileInputRef.current.click();
    };

    return (
        <div className={styles.uploadWrapper}>
            <input 
                ref={fileInputRef}
                type="file" 
                className={styles.fileInput} 
                onChange={handleChange}
                accept=".pdf,.docx"
            />

            <div 
                className={`${styles.dropZone} ${dragActive ? styles.dragActive : ''} ${styles[status]}`}
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={status !== 'uploading' ? onButtonClick : null}
            >
                {status === 'idle' && (
                    <div className={styles.zoneContent}>
                        <UploadCloud size={40} className={styles.uploadIcon} />
                        <h3>Upload your Resume</h3>
                        <p>Drag and drop your PDF or DOCX resume, or click to browse</p>
                        <span className={styles.fileHint}>Max file size: 5MB</span>
                    </div>
                )}

                {status === 'uploading' && (
                    <div className={styles.zoneContent}>
                        <RefreshCw size={40} className={`${styles.uploadIcon} ${styles.spinIcon}`} />
                        <h3>Uploading and Parsing Resume...</h3>
                        <p>Extracting skills, stack, and projects for your interview.</p>
                        <div className={styles.progressBarWrapper}>
                            <div className={styles.progressBar}></div>
                        </div>
                    </div>
                )}

                {status === 'success' && (
                    <div className={styles.zoneContent}>
                        <CheckCircle2 size={40} className={styles.successIcon} />
                        <h3>Resume Extracted Successfully!</h3>
                        <div className={styles.filePill}>
                            <FileText size={16} />
                            <span>{fileName}</span>
                        </div>
                        <p className={styles.changeHint}>Click or drag to upload a different resume</p>
                    </div>
                )}

                {status === 'error' && (
                    <div className={styles.zoneContent}>
                        <AlertCircle size={40} className={styles.errorIcon} />
                        <h3>Failed to Process Resume</h3>
                        <p className={styles.errorMsg}>{errorMessage}</p>
                        <button className="btn-secondary" style={{marginTop: '10px'}} onClick={(e) => {
                            e.stopPropagation();
                            setStatus('idle');
                        }}>
                            Try Again
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ResumeUpload;
