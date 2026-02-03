import { useState, useEffect, useContext, useRef } from 'react';
import { SocketContext } from '../context/SocketContext';
import { ToastContext } from '../context/ToastContext';
import { scanAPI } from '../services/api.jsx';

/**
 * Custom hook for handling real-time scan updates via socket.io and polling fallback
 * @param {string|number} scanId - The scan ID to monitor
 * @param {function} onScanUpdate - Callback when scan is updated
 * @param {function} onScanComplete - Callback when scan is completed
 * @param {function} onScanFailed - Callback when scan fails
 */
export const useScanRealtime = (
  scanId, 
  onScanUpdate = () => {}, 
  onScanComplete = () => {}, 
  onScanFailed = () => {}
) => {
  const { socket } = useContext(SocketContext);
  const [scan, setScan] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const pollingIntervalRef = useRef(null);
  const socketListenerRef = useRef(null);
  
  // Safe toast usage - ALWAYS call useContext in same order
  const toastContext = useContext(ToastContext);
  const toast = toastContext?.toast || { 
    success: () => {}, 
    error: () => {},
    warning: () => {},
    info: () => {} 
  };

  // Fetch scan data
  const fetchScan = async () => {
    try {
      const response = await scanAPI.getScanById(scanId);
      setScan(response.data.scan);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch scan:', err);
      setError(err.response?.data?.error || 'Failed to load scan');
    } finally {
      setIsLoading(false);
    }
  };

  // Socket.io event handler
  const handleScanUpdate = (data) => {
    try {
      if (data.scanId === parseInt(scanId)) {
      setScan(prevScan => {
        const updatedScan = {
          ...prevScan,
          status: data.status || prevScan?.status,
          progress: data.progress !== undefined ? data.progress : prevScan?.progress,
          ...(data.status === 'completed' && {
            totalVulnerabilities: data.totalVulnerabilities || 0,
            criticalCount: data.criticalCount || 0,
            highCount: data.highCount || 0,
            mediumCount: data.mediumCount || 0,
            lowCount: data.lowCount || 0,
            virustotalVerdict: data.virustotalVerdict,
            virustotalStats: data.virustotalStats,
            virustotalMaliciousCount: data.virustotalMaliciousCount,
            completedAt: data.completedAt || new Date().toISOString()
          }),
          ...(data.status === 'failed' && {
            errorMessage: data.errorMessage
          })
        };

        // Call update callback safely
        try {
          if (onScanUpdate && typeof onScanUpdate === 'function') {
            onScanUpdate(updatedScan);
          }
        } catch (error) {
          console.error('Error in onScanUpdate callback:', error);
        }

        // Call status-specific callbacks safely
        if (data.status === 'completed') {
          try {
            if (onScanComplete && typeof onScanComplete === 'function') {
              onScanComplete(updatedScan);
            }
            // Safe toast call
            if (toast && typeof toast.success === 'function') {
              toast.success('Scan completed successfully!', {
                title: 'Scan Complete',
                duration: 5000
              });
            }
            // Refresh full data after completion
            setTimeout(() => fetchScan(), 1000);
          } catch (error) {
            console.error('Error in onScanComplete callback:', error);
          }
        } else if (data.status === 'failed') {
          try {
            if (onScanFailed && typeof onScanFailed === 'function') {
              onScanFailed(updatedScan);
            }
            // Safe toast call
            if (toast && typeof toast.error === 'function') {
              toast.error('Scan failed. Please try again.', {
                title: 'Scan Failed',
                duration: 5000
              });
            }
          } catch (error) {
            console.error('Error in onScanFailed callback:', error);
          }
        } else if (data.progress !== undefined && data.status === 'scanning') {
          // Show progress toast for major milestones only
          if (data.progress === 25 || data.progress === 50 || data.progress === 75) {
            // Safe toast call with extra checks
            if (toast && typeof toast.info === 'function') {
              toast.info(`Scan progress: ${data.progress}%`, {
                duration: 2000
              });
            }
          }
        }

        return updatedScan;
      });
      }
    } catch (error) {
      console.error('Error handling scan update:', error);
    }
  };

  // Start/stop polling
  const startPolling = () => {
    if (pollingIntervalRef.current) return;
    
    pollingIntervalRef.current = setInterval(async () => {
      try {
        const response = await scanAPI.getScanStatus(scanId);
        const currentScan = response.data.scan;
        
        setScan(prevScan => {
          if (!prevScan || prevScan.status !== currentScan.status || prevScan.progress !== currentScan.progress) {
            onScanUpdate(currentScan);
            
            if (currentScan.status === 'completed') {
              onScanComplete(currentScan);
              // Safe toast call
              if (toast && typeof toast.success === 'function') {
                toast.success('Scan completed successfully!', {
                  title: 'Scan Complete',
                  duration: 5000
                });
              }
              stopPolling();
              // Refresh full data
              setTimeout(() => fetchScan(), 1000);
            } else if (currentScan.status === 'failed') {
              onScanFailed(currentScan);
              // Safe toast call
              if (toast && typeof toast.error === 'function') {
                toast.error('Scan failed. Please try again.', {
                  title: 'Scan Failed', 
                  duration: 5000
                });
              }
              stopPolling();
            }
          }
          
          return { ...prevScan, ...currentScan };
        });
      } catch (err) {
        console.error('Polling error:', err);
      }
    }, 2000);
  };

  const stopPolling = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  };

  // Setup socket listener
  const setupSocketListener = () => {
    if (socket && !socketListenerRef.current) {
      socket.on('scan_updated', handleScanUpdate);
      socketListenerRef.current = true;
    }
  };

  const removeSocketListener = () => {
    if (socket && socketListenerRef.current) {
      socket.off('scan_updated', handleScanUpdate);
      socketListenerRef.current = false;

    }
  };

  // Main effect
  useEffect(() => {
    if (!scanId) {
      setIsLoading(false);
      setError('No scan ID provided');
      return;
    }

    // Initial fetch
    fetchScan();

    // Setup socket listener
    setupSocketListener();

    return () => {
      removeSocketListener();
      stopPolling();
    };
  }, [scanId, socket]);

  // Auto-start polling for pending/scanning scans
  useEffect(() => {
    if (scan?.status === 'pending' || scan?.status === 'scanning') {
      startPolling();
    } else {
      stopPolling();
    }

    return () => stopPolling();
  }, [scan?.status]);

  // Manual refresh
  const refresh = () => {
    setIsLoading(true);
    fetchScan();
  };

  return {
    scan,
    isLoading,
    error,
    refresh,
    isPolling: !!pollingIntervalRef.current,
    hasSocketConnection: !!socket && socketListenerRef.current
  };
};

export default useScanRealtime;