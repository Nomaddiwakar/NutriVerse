import { useState, useEffect } from 'react';
import { 
  Watch, 
  RefreshCw, 
  CheckCircle, 
  ShieldCheck,
  Battery,
  Wifi,
  Database
} from 'lucide-react';

interface WearableDevice {
  id: string;
  name: string;
  brand: string;
  connected: boolean;
  battery: number | null;
  firmware: string;
  lastSync: string | null;
  autoSync: boolean;
  scopes: string[];
}

export function WearableSync() {
  const [devices, setDevices] = useState<WearableDevice[]>(() => {
    const cached = localStorage.getItem('nutriverse_connected_wearables');
    if (cached) return JSON.parse(cached);
    return [
      { id: 'apple-watch', name: 'Apple Watch Series 9', brand: 'Apple Health', connected: false, battery: 88, firmware: 'watchOS 10.4', lastSync: null, autoSync: true, scopes: ['Heart Rate', 'Steps', 'Active Calories', 'Sleep'] },
      { id: 'whoop', name: 'WHOOP Strap 4.0', brand: 'WHOOP', connected: false, battery: 72, firmware: 'v4.1.8', lastSync: null, autoSync: true, scopes: ['HRV', 'Sleep Stages', 'Recovery Score', 'Skin Temp'] },
      { id: 'oura', name: 'Oura Ring Gen3', brand: 'Oura', connected: false, battery: 94, firmware: 'v2.9.4', lastSync: null, autoSync: true, scopes: ['Readiness Score', 'Sleep Stages', 'Resting HR'] },
      { id: 'garmin', name: 'Garmin Forerunner 965', brand: 'Garmin Connect', connected: false, battery: 65, firmware: 'v18.23', lastSync: null, autoSync: false, scopes: ['VO2 Max', 'Pace', 'Stress Score', 'Steps'] },
      { id: 'fitbit', name: 'Fitbit Charge 6', brand: 'Fitbit', connected: false, battery: 40, firmware: 'v1.189', lastSync: null, autoSync: true, scopes: ['Steps', 'Heart Rate', 'Sleep Duration'] }
    ];
  });

  const [authorizingDevice, setAuthorizingDevice] = useState<WearableDevice | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [authStep, setAuthStep] = useState<'consent' | 'handshake' | 'complete'>('consent');

  // Save state to local storage on modification
  useEffect(() => {
    localStorage.setItem('nutriverse_connected_wearables', JSON.stringify(devices));
  }, [devices]);

  const initiateOAuthFlow = (device: WearableDevice) => {
    setAuthorizingDevice(device);
    setAuthStep('consent');
  };

  const handleApproveConsent = () => {
    setAuthStep('handshake');
    // Simulate TLS handshake and OAuth Token exchange
    setTimeout(() => {
      setAuthStep('complete');
      setTimeout(() => {
        // Mark device connected
        setDevices(prev => prev.map(d => {
          if (d.id === authorizingDevice?.id) {
            return {
              ...d,
              connected: true,
              lastSync: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
          }
          return d;
        }));
        setAuthorizingDevice(null);
      }, 1000);
    }, 1500);
  };

  const handleDisconnect = (id: string) => {
    setDevices(prev => prev.map(d => {
      if (d.id === id) {
        return { ...d, connected: false, lastSync: null };
      }
      return d;
    }));
  };

  const toggleAutoSync = (id: string) => {
    setDevices(prev => prev.map(d => {
      if (d.id === id) {
        return { ...d, autoSync: !d.autoSync };
      }
      return d;
    }));
  };

  const handleForceSyncAll = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      setDevices(prev => prev.map(d => {
        if (d.connected) {
          return {
            ...d,
            lastSync: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            battery: d.battery ? Math.max(10, d.battery - 1) : null
          };
        }
        return d;
      }));
    }, 2000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Top Banner section */}
      <div className="glass-panel" style={{ padding: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
        <div>
          <span className="font-mono" style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Wearable Telemetry Core
          </span>
          <h2 className="font-display" style={{ fontSize: '2rem', fontWeight: 700, marginTop: '0.25rem' }}>
            Connected Devices
          </h2>
          <p style={{ color: 'var(--foreground-muted)', fontSize: '0.9rem', marginTop: '0.5rem', maxWidth: '640px' }}>
            Authorize and sync real-time biometrics from Apple Health, WHOOP, Garmin, Oura, and Fitbit securely via OAuth 2.0 protocol nodes.
          </p>
        </div>
        
        <button
          onClick={handleForceSyncAll}
          disabled={isSyncing}
          className="btn-premium"
          style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.85rem' }}
        >
          <RefreshCw size={14} className={isSyncing ? 'spin' : ''} />
          {isSyncing ? 'Syncing Nodes...' : 'Sync All Devices'}
        </button>
      </div>

      {/* Main Devices Panel */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.1fr', gap: '1.5rem' }} className="chat-layout-container">
        
        {/* Left Side: Catalog of wearables */}
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <h3 className="font-display" style={{ fontSize: '1.25rem', fontWeight: 600 }}>Supported Device Registrations</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--foreground-muted)', marginTop: '0.15rem' }}>
              Verify secure authorization tokens to establish active socket bindings.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {devices.map(device => (
              <div
                key={device.id}
                style={{
                  padding: '1.25rem',
                  borderRadius: '16px',
                  border: '1.5px solid var(--border-light)',
                  backgroundColor: device.connected ? 'oklch(0.12 0.03 270 / 0.3)' : 'oklch(1 0 0 / 0.01)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '1rem',
                  transition: 'border-color 0.25s ease'
                }}
              >
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <div style={{
                    padding: '0.75rem',
                    borderRadius: '12px',
                    backgroundColor: device.connected ? 'var(--accent-cyan-glow)' : 'oklch(1 0 0 / 0.04)',
                    color: device.connected ? 'var(--accent-cyan)' : 'var(--foreground-muted)',
                    display: 'flex'
                  }}>
                    <Watch size={24} />
                  </div>
                  <div>
                    <h4 style={{ fontSize: '1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                      {device.name}
                      {device.connected && (
                        <span style={{
                          fontSize: '0.65rem',
                          backgroundColor: 'var(--accent-lime-glow)',
                          color: 'var(--accent-lime)',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          fontWeight: 500
                        }}>
                          Active Sync
                        </span>
                      )}
                    </h4>
                    <p style={{ fontSize: '0.75rem', color: 'var(--foreground-muted)', marginTop: '0.15rem' }}>
                      Firmware: {device.firmware} • Scope: {device.scopes.join(', ')}
                    </p>
                    {device.connected && (
                      <div style={{ display: 'flex', gap: '1rem', fontSize: '0.7rem', marginTop: '0.35rem', color: 'var(--foreground-muted)' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                          <Battery size={12} /> {device.battery}% Battery
                        </span>
                        <span>Last sync: {device.lastSync || 'Never'}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  {device.connected && (
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={device.autoSync}
                        onChange={() => toggleAutoSync(device.id)}
                        style={{ accentColor: 'var(--accent-cyan)' }}
                      />
                      Auto-Sync
                    </label>
                  )}

                  <button
                    onClick={() => device.connected ? handleDisconnect(device.id) : initiateOAuthFlow(device)}
                    className={device.connected ? 'btn-outline' : 'btn-premium'}
                    style={{ fontSize: '0.75rem', padding: '0.5rem 1rem' }}
                  >
                    {device.connected ? 'Disconnect' : 'Connect Device'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side: Telemetry logs details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Security details card */}
          <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 className="font-display" style={{ fontSize: '1.15rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <ShieldCheck size={18} style={{ color: 'var(--accent-cyan)' }} /> E2E Telemetry Encryption
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--foreground-muted)', lineHeight: 1.4 }}>
              NutriVerse secures health indicators logs utilizing state-of-the-art TLS 1.3 socket paths. All access tokens generated via OAuth 2.0 handshakes are cached locally under encrypted layers.
            </p>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              fontSize: '0.7rem',
              color: 'var(--accent-lime)',
              fontFamily: 'var(--font-mono)'
            }}>
              <Wifi size={14} />
              <span>SECURE ENDPOINT ACTIVE</span>
            </div>
          </div>

          {/* Sync Stats Diagnostics */}
          <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 className="font-display" style={{ fontSize: '1.15rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <Database size={18} style={{ color: 'var(--accent-purple)' }} /> Ledger Diagnostics
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.75rem', color: 'var(--foreground-muted)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Synced Parameters</span>
                <span className="font-mono" style={{ color: 'var(--foreground)' }}>14 tracked vitals</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Daily Steps Target</span>
                <span className="font-mono" style={{ color: 'var(--foreground)' }}>10,000 steps</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>API Status</span>
                <span className="font-mono" style={{ color: 'var(--accent-lime)' }}>Connected</span>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* OAuth 2.0 Consent Screen Simulator Overlay Modal */}
      {authorizingDevice && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'oklch(0.08 0.02 270 / 0.95)',
          zIndex: 1200,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem'
        }}>
          <div className="glass-panel" style={{
            maxWidth: '460px',
            width: '100%',
            padding: '2rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem',
            boxShadow: '0 0 30px var(--accent-cyan-glow)'
          }}>
            
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-cyan)' }}>
              <ShieldCheck size={22} />
              <span className="font-mono" style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>
                NUTRI-OAUTH GATEWAY
              </span>
            </div>

            {authStep === 'consent' && (
              <>
                <div>
                  <h3 className="font-display" style={{ fontSize: '1.3rem', fontWeight: 700 }}>
                    Connect {authorizingDevice.brand}
                  </h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--foreground-muted)', marginTop: '0.25rem' }}>
                    NutriVerse requests permission to read secure data metrics from your {authorizingDevice.brand} profile:
                  </p>
                </div>

                <div style={{
                  padding: '1rem',
                  borderRadius: '12px',
                  backgroundColor: 'oklch(1 0 0 / 0.03)',
                  border: '1px solid var(--border-light)',
                  fontSize: '0.75rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.45rem'
                }}>
                  {authorizingDevice.scopes.map(s => (
                    <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <CheckCircle size={12} style={{ color: 'var(--accent-cyan)' }} />
                      <span>{s} read access permission</span>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button onClick={() => setAuthorizingDevice(null)} className="btn-outline" style={{ flex: 1 }}>
                    Cancel
                  </button>
                  <button onClick={handleApproveConsent} className="btn-premium" style={{ flex: 1 }}>
                    Grant Access
                  </button>
                </div>
              </>
            )}

            {authStep === 'handshake' && (
              <div style={{ textAlign: 'center', padding: '1.5rem 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                <RefreshCw size={32} className="spin" style={{ color: 'var(--accent-cyan)' }} />
                <div>
                  <p style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>Exchanging JWT handshake tokens...</p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--foreground-muted)', marginTop: '0.25rem' }}>
                    Securing TLS socket parameters.
                  </p>
                </div>
              </div>
            )}

            {authStep === 'complete' && (
              <div style={{ textAlign: 'center', padding: '1.5rem 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                <CheckCircle size={32} style={{ color: 'var(--accent-lime)' }} />
                <div>
                  <p style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>Authentication complete!</p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--foreground-muted)', marginTop: '0.25rem' }}>
                    Wearable telemetry synced successfully.
                  </p>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
