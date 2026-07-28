import { useState } from 'react';
import { ToggleLeft, ToggleRight, Heart } from 'lucide-react';

export function SettingsPanel() {
  const [integrations, setIntegrations] = useState([
    { name: 'Apple HealthKit Sync', active: true, desc: 'Syncs dynamic calories, daily step counts, and active training HR.' },
    { name: 'Garmin Connect Telemetry', active: false, desc: 'Syncs intensive workout paths, HRV sleep parameters, and recovery metrics.' },
    { name: 'Strava Routes API', active: true, desc: 'Syncs distance metrics, average velocity, and custom cardio splits.' }
  ]);

  const toggleInt = (idx: number) => {
    const copy = [...integrations];
    copy[idx].active = !copy[idx].active;
    setIntegrations(copy);
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center' }}>
      {/* Integrations manager card */}
      <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.2rem', maxWidth: '600px', width: '100%' }}>
        <h3 className="font-display" style={{ fontSize: '1.25rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Heart size={18} style={{ color: 'var(--accent-purple)' }} /> Wearable integrations
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {integrations.map((int, idx) => (
            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid oklch(1 0 0 / 0.03)', paddingBottom: '0.75rem' }}>
              <div style={{ flex: 1, paddingRight: '1rem' }}>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 600 }}>{int.name}</h4>
                <p style={{ fontSize: '0.75rem', color: 'var(--foreground-muted)', marginTop: '0.2rem', lineHeight: 1.25 }}>{int.desc}</p>
              </div>
              <button
                onClick={() => toggleInt(idx)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: int.active ? 'var(--accent-cyan)' : 'var(--foreground-muted)',
                  display: 'flex',
                  alignItems: 'center'
                }}
                aria-label={`Toggle integration for ${int.name}`}
              >
                {int.active ? <ToggleRight size={38} /> : <ToggleLeft size={38} />}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
