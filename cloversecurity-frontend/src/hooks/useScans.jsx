import { useState, useEffect } from 'react';
import { scanAPI } from '../services/api';

export const useScans = () => {
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchScans = async () => {
    try {
      setLoading(true);
      const response = await scanAPI.getAllScans();
      setScans(response.data.scans);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScans();
  }, []);

  const startScan = async (scanData) => {
    try {
      const response = await scanAPI.startScan(scanData);
      await fetchScans(); // Refresh list
      return response.data;
    } catch (err) {
      throw new Error(err.response?.data?.error || 'Failed to start scan');
    }
  };

  const deleteScan = async (id) => {
    try {
      await scanAPI.deleteScan(id);
      await fetchScans(); // Refresh list
    } catch (err) {
      throw new Error(err.response?.data?.error || 'Failed to delete scan');
    }
  };

  return { scans, loading, error, fetchScans, startScan, deleteScan };
};