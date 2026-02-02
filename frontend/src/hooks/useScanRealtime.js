import { useState, useEffect, useContext, useRef } from 'react';
import { SocketContext } from '../context/SocketContext';
import { useToast } from '../context/ToastContext';
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
  
  // Safe toast usage with error handling
  let toast = null;
  try {
    toast = useToast();
  } catch (error) {
    console.warn('Toast context not available:', error);
  }
  const [scan, setScan] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const pollingIntervalRef = useRef(null);
  const socketListenerRef = useRef(null);

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
    console.log('🔄 Real-time scan update:', data);
    
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

        // Call update callback
        onScanUpdate(updatedScan);

        // Call status-specific callbacks
        if (data.status === 'completed') {
          onScanComplete(updatedScan);
          if (toast) {
            toast.success('Scan completed successfully!', {
              title: 'Scan Complete',
              duration: 5000
            });
          }
          // Refresh full data after completion
          setTimeout(() => fetchScan(), 1000);
        } else if (data.status === 'failed') {
          onScanFailed(updatedScan);
          if (toast) {
            toast.error('Scan failed. Please try again.', {
              title: 'Scan Failed',
              duration: 5000
            });
          }
        } else if (data.progress !== undefined && data.status === 'scanning') {
          // Show progress toast for major milestones only
          if (toast && (data.progress === 25 || data.progress === 50 || data.progress === 75)) {
            toast.info(`Scan progress: ${data.progress}%`, {
              duration: 2000
            });
          }
        }

        return updatedScan;
      });
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
            console.log('📊 Polling update:', currentScan);
            onScanUpdate(currentScan);
            
            if (currentScan.status === 'completed') {
              onScanComplete(currentScan);
              if (toast) {
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
              if (toast) {
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
    
    console.log('🔄 Started polling for scan', scanId);
  };

  const stopPolling = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
      console.log('⏹️ Stopped polling for scan', scanId);
    }
  };

  // Setup socket listener
  const setupSocketListener = () => {
    if (socket && !socketListenerRef.current) {
      socket.on('scan_updated', handleScanUpdate);
      socketListenerRef.current = true;
      console.log('🔗 Socket listener registered for scan_updated');
    }
  };

  const removeSocketListener = () => {
    if (socket && socketListenerRef.current) {
      socket.off('scan_updated', handleScanUpdate);
      socketListenerRef.current = false;
      console.log('🔗 Socket listener removed for scan_updated');
    }
  };

  // Main effect
  useEffect(() => {
    if (!scanId) return;

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