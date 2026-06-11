const BASE_URL = process.env.NEXT_PUBLIC_API_URL ? `${process.env.NEXT_PUBLIC_API_URL.replace(/\/+$/, '')}/api` : 'http://localhost:8081/api';

const getHeaders = (isMultipart = false) => {
    const token = localStorage.getItem('token');
    const headers = {};
    
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    
    if (!isMultipart) {
        headers['Content-Type'] = 'application/json';
    }
    
    return headers;
};

const handleResponse = async (response) => {
    if (response.status === 401) {
        // Token expired or invalid, force logout
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        if (typeof window !== 'undefined') {
            window.location.href = '/?expired=true';
        }
        throw new Error('Session expired. Please log in again.');
    }
    
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.error || 'Something went wrong');
    }
    return data;
};

export const apiService = {
    // Resume
    uploadResume: async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        
        const response = await fetch(`${BASE_URL}/resume/upload`, {
            method: 'POST',
            headers: getHeaders(true),
            body: formData
        });
        return handleResponse(response);
    },
    
    getResume: async () => {
        const response = await fetch(`${BASE_URL}/resume`, {
            method: 'GET',
            headers: getHeaders()
        });
        return handleResponse(response);
    },
    
    // Interview
    generateSession: async () => {
        const response = await fetch(`${BASE_URL}/interview/generate`, {
            method: 'POST',
            headers: getHeaders()
        });
        return handleResponse(response);
    },
    
    submitAnswers: async (sessionId, answers) => {
        const response = await fetch(`${BASE_URL}/interview/submit`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ sessionId, answers })
        });
        return handleResponse(response);
    },
    
    getHistory: async () => {
        const response = await fetch(`${BASE_URL}/interview/history`, {
            method: 'GET',
            headers: getHeaders()
        });
        return handleResponse(response);
    },
    
    getSessionDetails: async (sessionId) => {
        const response = await fetch(`${BASE_URL}/interview/sessions/${sessionId}`, {
            method: 'GET',
            headers: getHeaders()
        });
        return handleResponse(response);
    },
    
    getAnalytics: async () => {
        const response = await fetch(`${BASE_URL}/interview/analytics`, {
            method: 'GET',
            headers: getHeaders()
        });
        return handleResponse(response);
    }
};
export default apiService;
