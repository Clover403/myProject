import { useState, useEffect, useCallback } from 'react';
import { scanAPI } from '../services/api';

const POLL_INTERVAL_MS = 8000;

export const useScans = () => {
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchScans = useCallback(async ({ showLoading = false } = {}) => {
    try {
      if (showLoading) {
        setLoading(true);
      }

      const response = await scanAPI.getAllScans();
      setScans(response.data.scans);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    fetchScans({ showLoading: true });
  }, [fetchScans]);

  useEffect(() => {
    const hasActiveScan = scans.some(
      (scan) => scan.status === 'pending' || scan.status === 'scanning'
    );

    if (!hasActiveScan) {
      return undefined;
    }

    const intervalId = setInterval(() => {
      fetchScans();
    }, POLL_INTERVAL_MS);

    return () => clearInterval(intervalId);
  }, [scans, fetchScans]);

  const startScan = async (scanData) => {
    try {
      const response = await scanAPI.startScan(scanData);
      await fetchScans();
      return response.data;
    } catch (err) {
      throw new Error(err.response?.data?.error || 'Failed to start scan');
    }
  };

  const deleteScan = async (id) => {
    try {
      await scanAPI.deleteScan(id);
      await fetchScans();
    } catch (err) {
      throw new Error(err.response?.data?.error || 'Failed to delete scan');
    }
  };

  return { scans, loading, error, fetchScans, startScan, deleteScan };
};