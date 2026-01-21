import React, { useState, useEffect } from 'react';
import './StatusBar.css';

interface StatusBarProps {
  apiPort?: number;
}

const StatusBar: React.FC<StatusBarProps> = ({ apiPort }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [currentPort, setCurrentPort] = useState<number | null>(apiPort || null);
  const [version, setVersion] = useState<string>('...');

  useEffect(() => {
    // Fetch app version
    const fetchVersion = async () => {
      try {
        const appVersion = await window.electronAPI.getAppVersion();
        setVersion(appVersion);
      } catch (error) {
        console.error('Failed to get app version:', error);
        setVersion('3.3.24'); // Fallback
      }
    };

    fetchVersion();

    // Fetch API port if not provided
    const fetchPort = async () => {
      if (!currentPort) {
        try {
          // Try to read from file via IPC or try common ports
          const ports = [38124, 38125, 38126, 38127, 38128];
          for (const port of ports) {
            try {
              const response = await fetch(`http://localhost:${port}/health`);
              if (response.ok) {
                setCurrentPort(port);
                checkConnection(port);
                return;
              }
            } catch {
              // Continue to next port
            }
          }
        } catch (error) {
          console.error('Failed to detect API port:', error);
        }
      } else {
        checkConnection(currentPort);
      }
    };

    const checkConnection = async (port: number) => {
      try {
        const response = await fetch(`http://localhost:${port}/health`);
        setIsConnected(response.ok);
      } catch {
        setIsConnected(false);
      }
    };

    fetchPort();

    // Check connection periodically
    const interval = setInterval(() => {
      if (currentPort) {
        checkConnection(currentPort);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [currentPort]);

  return (
    <div className="status-bar">
      <div className="status-bar-content">
        <div className="status-version">
          v{version}
        </div>
        <div className="status-right">
          <div className="status-indicator">
            <span className={`status-dot ${isConnected ? 'connected' : 'disconnected'}`}></span>
            <span className="status-text">
              {isConnected ? 'API Connected' : 'API Disconnected'}
            </span>
          </div>
          {currentPort && (
            <div className="api-port">
              Port: {currentPort}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StatusBar;

