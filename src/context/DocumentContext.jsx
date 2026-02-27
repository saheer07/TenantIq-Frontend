import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { documentAPI, chatAPI } from '../services/api';

const DocumentContext = createContext();

export const useDocumentContext = () => {
    const context = useContext(DocumentContext);
    if (!context) {
        throw new Error('useDocumentContext must be used within a DocumentProvider');
    }
    return context;
};

export const DocumentProvider = ({ children }) => {
    const [documents, setDocuments] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const pollingIntervalRef = useRef(null);
    const rateLimitedRef = useRef(false);

    const fetchStats = useCallback(async () => {
        if (rateLimitedRef.current) return;
        try {
            const response = await chatAPI.getStats();
            setStats(response.data);
        } catch (err) {
            if (err?.response?.status === 429) {
                console.warn('⏸️ Rate limited on /stats — pausing centralized polling.');
                rateLimitedRef.current = true;
            }
            console.error('❌ Failed to fetch stats:', err);
        }
    }, []);

    const fetchDocuments = useCallback(async (isSilent = false) => {
        if (!isSilent) {
            setLoading(true);
            rateLimitedRef.current = false; // Reset on manual/initial fetch
        }
        if (isSilent && rateLimitedRef.current) return;

        setError(null);

        try {
            const response = await documentAPI.list();
            const docs = response.data?.results ?? response.data ?? [];
            const newDocs = Array.isArray(docs) ? docs : [];

            setDocuments(prevDocs => {
                if (JSON.stringify(prevDocs) === JSON.stringify(newDocs)) return prevDocs;
                return newDocs;
            });
        } catch (err) {
            if (err?.response?.status === 429) {
                console.warn('⏸️ Rate limited on /documents — pausing centralized polling.');
                rateLimitedRef.current = true;
            }
            console.error('❌ Failed to fetch documents:', err);
            if (!isSilent) setError('Failed to load documents. Please try again.');
        } finally {
            if (!isSilent) setLoading(false);
        }
    }, []);

    const startPolling = useCallback(() => {
        if (pollingIntervalRef.current || rateLimitedRef.current) return;

        console.log('⏱️ Starting centralized document & stats polling...');
        pollingIntervalRef.current = setInterval(() => {
            fetchDocuments(true);
            fetchStats();
        }, 5000);
    }, [fetchDocuments, fetchStats]);

    const stopPolling = useCallback(() => {
        if (pollingIntervalRef.current) {
            console.log('⏹️ Stopping centralized document & stats polling.');
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
        }
    }, []);

    // Monitor documents to start/stop polling automatically
    useEffect(() => {
        const hasProcessing = documents.some(d =>
            d.indexing_status === 'pending' || d.indexing_status === 'processing'
        );

        if (hasProcessing) {
            startPolling();
        } else {
            stopPolling();
        }
    }, [documents, startPolling, stopPolling]);

    // Initial fetch
    useEffect(() => {
        fetchDocuments();
        fetchStats();
        return () => stopPolling();
    }, [fetchDocuments, fetchStats, stopPolling]);

    const value = {
        documents,
        stats,
        setDocuments,
        loading,
        error,
        fetchDocuments,
        fetchStats,
        startPolling,
        stopPolling
    };

    return (
        <DocumentContext.Provider value={value}>
            {children}
        </DocumentContext.Provider>
    );
};
