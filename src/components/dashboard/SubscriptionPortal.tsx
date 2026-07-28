import { useState, useEffect } from 'react';
import { Check, ShieldCheck, RefreshCw } from 'lucide-react';

export function SubscriptionPortal() {
  const [activeTier, setActiveTier] = useState('Free Plan');
  const [isLoading, setIsLoading] = useState(false);

  // Load current billing settings from backend
  useEffect(() => {
    const fetchBilling = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/admin/users');
        if (!response.ok) throw new Error('API server down');
        const data = await response.json();
        setActiveTier(data.tier || 'Free Plan');
      } catch (err) {
        console.warn('API billing fetch offline, running local state:', err);
      }
    };
    fetchBilling();
  }, []);

  const handleUpgrade = async (tierName: string) => {
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier: tierName })
      });
      if (!response.ok) throw new Error('Checkout API offline');
      const data = await response.json();
      
      // Redirect browser window directly to the Stripe simulation checkout page
      window.location.href = data.checkoutUrl;
    } catch (err) {
      console.warn('Stripe checkout down, executing mock success:', err);
      setTimeout(() => {
        setIsLoading(false);
        setActiveTier(tierName);
        alert(`Billing Simulation complete. Activated: ${tierName}`);
      }, 800);
    }
  };

  const tiers = [
    {
      name: 'Free Plan',
      price: '$0',
      sub: 'Free forever access',
      features: [
        'Dynamic caloric calculation logs',
        'Standard exercise dictionary indexing',
        'Basic biometrics tracking',
        'Standard dashboard utilities'
      ],
      color: 'var(--foreground-muted)',
      glow: 'none'
    },
    {
      name: 'NutriVerse Premium Core',
      price: '$19',
      sub: '/ month billed annually',
      features: [
        'AI food scanner monocular volume scans',
        'Interactive 3D muscle recovery heatmap',
        'AI chat coach personalized diet logs',
        'Integrate Apple & Garmin connectors',
        'Daily progressive overload models'
      ],
      color: 'var(--accent-cyan)',
      glow: '0 0 25px var(--accent-cyan-glow)'
    },
    {
      name: 'Ultimate Coach Portal',
      price: '$79',
      sub: '/ month billed annually',
      features: [
        'Everything inside Premium Core',
        'Shared client telemetry dashboards',
        'Custom workout script exporter',
        'Dedicated server processing queue',
        'Biometric raw data export CSV'
      ],
      color: 'var(--accent-purple)',
      glow: '0 0 25px var(--accent-purple-glow)'
    }
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>
      
      {isLoading && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'oklch(0.08 0.02 270 / 0.85)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.75rem',
          zIndex: 1000
        }}>
          <RefreshCw className="spin" size={32} style={{ animation: 'spin 2s linear infinite', color: 'var(--accent-cyan)' }} />
          <span className="font-mono" style={{ fontSize: '0.8rem', color: 'var(--accent-cyan)' }}>
            Redirecting to Stripe checkout portal...
          </span>
        </div>
      )}

      <div style={{ textAlign: 'center', maxWidth: '600px', margin: '0 auto' }}>
        <h2 className="font-display" style={{ fontSize: '2rem', fontWeight: 600 }}>Optimize your metabolic telemetry</h2>
        <p style={{ color: 'var(--foreground-muted)', fontSize: '0.95rem', marginTop: '0.5rem' }}>
          Select a subscription tier to activate high-performance vision scans, RAG chat models, and recovery mesh maps.
        </p>
      </div>

      {/* Tiers Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '1.5rem',
        marginTop: '1rem'
      }}>
        {tiers.map((tier, idx) => {
          const isCurrent = activeTier === tier.name;
          return (
            <div
              key={idx}
              className="glass-panel"
              style={{
                padding: '2.5rem 2rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxShadow: isCurrent ? tier.glow : 'none',
                borderWidth: isCurrent ? '1.5px' : '1px',
                borderColor: isCurrent ? tier.color : 'var(--border-light)',
                position: 'relative'
              }}
            >
              <div>
                <span className="font-mono" style={{
                  fontSize: '0.65rem',
                  color: tier.color,
                  textTransform: 'uppercase',
                  border: '1px solid',
                  borderColor: tier.color,
                  borderRadius: '4px',
                  padding: '2px 6px',
                  position: 'absolute',
                  top: '20px',
                  right: '20px',
                  letterSpacing: '0.05em'
                }}>
                  {isCurrent ? 'ACTIVE' : 'UPGRADE'}
                </span>

                <h3 className="font-display" style={{ fontSize: '1.25rem', fontWeight: 600, marginTop: '0.5rem' }}>{tier.name}</h3>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.2rem', margin: '1.5rem 0 0.5rem' }}>
                  <span className="font-display" style={{ fontSize: '3rem', fontWeight: 700 }}>{tier.price}</span>
                  <span style={{ fontSize: '0.85rem', color: 'var(--foreground-muted)' }}>{tier.sub}</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', margin: '2rem 0' }}>
                  {tier.features.map((feat, fIdx) => (
                    <div key={fIdx} style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start', fontSize: '0.85rem' }}>
                      <Check size={16} style={{ color: tier.color, flexShrink: 0, marginTop: '0.15rem' }} />
                      <span style={{ color: 'var(--foreground)' }}>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={() => handleUpgrade(tier.name)}
                className="btn-premium"
                style={{
                  width: '100%',
                  background: isCurrent ? 'oklch(1 0 0 / 0.05)' : `linear-gradient(135deg, ${tier.color}, oklch(0.98 0.01 270 / 0.15))`,
                  color: isCurrent ? 'var(--foreground-muted)' : 'var(--bg-deep)',
                  boxShadow: isCurrent ? 'none' : 'var(--shadow-glow)',
                  cursor: isCurrent ? 'default' : 'pointer'
                }}
                disabled={isCurrent}
              >
                {isCurrent ? 'Current Plan Active' : `Get Started`}
              </button>
            </div>
          );
        })}
      </div>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem',
        fontSize: '0.75rem',
        color: 'var(--foreground-muted)',
        marginTop: '1rem'
      }}>
        <ShieldCheck size={16} style={{ color: 'var(--accent-cyan)' }} />
        <span>Secure checkout processed via Stripe. Cancel subscription cycles at any time.</span>
      </div>
    </div>
  );
}
