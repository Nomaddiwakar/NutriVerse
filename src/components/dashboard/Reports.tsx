import { useState } from 'react';
import { 
  ClipboardList, 
  Download, 
  Shield,
  Loader2
} from 'lucide-react';

export function Reports() {
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d'>('7d');
  const [includeMacros, setIncludeMacros] = useState(true);
  const [includeHRV, setIncludeHRV] = useState(true);
  const [includeWorkouts, setIncludeWorkouts] = useState(true);
  const [format, setFormat] = useState<'pdf' | 'csv' | 'json'>('pdf');
  const [isExporting, setIsExporting] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const handleExport = () => {
    setIsExporting(true);
    setDownloadSuccess(false);
    
    // Simulate generation delay
    setTimeout(() => {
      setIsExporting(false);
      setDownloadSuccess(true);
      
      // Trigger native download simulation
      const element = document.createElement("a");
      const file = new Blob([
        `--- NUTRI-VERSE TELEMETRY REPORT ---\n` +
        `Generated: ${new Date().toLocaleString()}\n` +
        `Range: ${dateRange}\n` +
        `Config: Macros=${includeMacros}, HRV=${includeHRV}, Workouts=${includeWorkouts}\n` +
        `Format: ${format.toUpperCase()}\n` +
        `------------------------------------\n` +
        `STATUS: Dynamic calibration within optimal parameters.\n` +
        `Average Caloric Intake: 2120 kcal / day\n` +
        `Macronutrients: Protein 145g, Carbs 190g, Fats 68g\n` +
        `Mean HRV Score: 78ms\n` +
        `Overtraining Index: 0.12 (Safe)\n`
      ], { type: 'text/plain' });
      
      element.href = URL.createObjectURL(file);
      element.download = `nutriverse_report_${dateRange}_${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);

      setTimeout(() => setDownloadSuccess(false), 4000);
    }, 1800);
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>
      
      {/* Banner */}
      <div className="glass-panel" style={{ padding: '2rem', display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
        <div style={{
          padding: '0.75rem',
          borderRadius: '12px',
          background: 'var(--gradient-aurora)',
          color: 'var(--bg-deep)',
          display: 'flex',
          boxShadow: '0 0 15px var(--accent-cyan-glow)'
        }}>
          <ClipboardList size={28} />
        </div>
        <div>
          <span className="font-mono" style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Biomedical Reports Engine
          </span>
          <h2 className="font-display" style={{ fontSize: '2.0rem', fontWeight: 700, marginTop: '0.2rem' }}>
            Health Telemetry Reports
          </h2>
          <p style={{ color: 'var(--foreground-muted)', fontSize: '0.85rem', marginTop: '0.4rem', maxWidth: '640px' }}>
            Compile comprehensive logs of cardiovascular variables, nutritional splits, and 3D body morph telemetry curves into authenticated export nodes.
          </p>
        </div>
      </div>

      {/* Main Splits */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        
        {/* Left Column: Configuration */}
        <div className="glass-panel" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <h3 className="font-display" style={{ fontSize: '1.15rem', fontWeight: 600, borderBottom: '1px solid var(--border-light)', paddingBottom: '0.75rem' }}>
            Report Parameters
          </h3>

          {/* Date Range Selection */}
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--foreground-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Telemetry Timeframe
            </label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {(['7d', '30d', '90d'] as const).map(range => (
                <button
                  key={range}
                  onClick={() => setDateRange(range)}
                  className={dateRange === range ? 'btn-premium' : 'btn-outline'}
                  style={{ flex: 1, padding: '0.45rem', fontSize: '0.8rem', borderRadius: '8px' }}
                >
                  {range === '7d' ? 'Last 7 Days' : range === '30d' ? 'Last Month' : 'Last Quarter'}
                </button>
              ))}
            </div>
          </div>

          {/* Metrics Checks */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--foreground-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Include Datasets
            </label>
            
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.85rem', cursor: 'pointer' }}>
              <input 
                type="checkbox" 
                checked={includeMacros} 
                onChange={(e) => setIncludeMacros(e.target.checked)} 
                style={{ accentColor: 'var(--accent-cyan)', width: '16px', height: '16px' }}
              />
              <span>Macro/Micro Nutritional Curves</span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.85rem', cursor: 'pointer' }}>
              <input 
                type="checkbox" 
                checked={includeHRV} 
                onChange={(e) => setIncludeHRV(e.target.checked)} 
                style={{ accentColor: 'var(--accent-cyan)', width: '16px', height: '16px' }}
              />
              <span>HRV Cardio Recovery Diagnostics</span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.85rem', cursor: 'pointer' }}>
              <input 
                type="checkbox" 
                checked={includeWorkouts} 
                onChange={(e) => setIncludeWorkouts(e.target.checked)} 
                style={{ accentColor: 'var(--accent-cyan)', width: '16px', height: '16px' }}
              />
              <span>Workout Progression & Load Logs</span>
            </label>
          </div>

          {/* Format Selection */}
          <div style={{ marginTop: '0.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--foreground-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Target Document Format
            </label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {(['pdf', 'csv', 'json'] as const).map(fmt => (
                <button
                  key={fmt}
                  onClick={() => setFormat(fmt)}
                  className={format === fmt ? 'btn-premium' : 'btn-outline'}
                  style={{ flex: 1, padding: '0.45rem', fontSize: '0.8rem', textTransform: 'uppercase', borderRadius: '8px' }}
                >
                  {fmt}
                </button>
              ))}
            </div>
          </div>

          {/* Action Trigger */}
          <button
            onClick={handleExport}
            disabled={isExporting || (!includeMacros && !includeHRV && !includeWorkouts)}
            className="btn-premium"
            style={{ 
              width: '100%', 
              marginTop: '1rem', 
              padding: '0.75rem', 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              gap: '0.5rem',
              fontSize: '0.9rem'
            }}
          >
            {isExporting ? (
              <>
                <Loader2 className="spin" size={16} style={{ animation: 'spin 2s linear infinite' }} />
                <span>Decrypting & Compiling...</span>
              </>
            ) : (
              <>
                <Download size={16} />
                <span>Compile & Download Report</span>
              </>
            )}
          </button>

          {downloadSuccess && (
            <div className="glass-panel" style={{ padding: '0.75rem 1rem', borderLeft: '3px solid var(--accent-lime)', fontSize: '0.75rem', color: 'var(--accent-lime)' }}>
              Download initiated. Telemetry envelope verified under AES-256 constraints.
            </div>
          )}
        </div>

        {/* Right Column: Live Diagnostic Preview */}
        <div className="glass-panel" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <h3 className="font-display" style={{ fontSize: '1.15rem', fontWeight: 600, borderBottom: '1px solid var(--border-light)', paddingBottom: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Live Document Preview</span>
            <span className="font-mono" style={{ fontSize: '0.65rem', padding: '0.2rem 0.5rem', borderRadius: '4px', backgroundColor: 'var(--accent-cyan-glow)', color: 'var(--accent-cyan)', textTransform: 'uppercase' }}>
              Verified Secure
            </span>
          </h3>

          <div style={{
            flex: 1,
            backgroundColor: 'oklch(0.04 0.01 270)',
            border: '1px solid var(--border-light)',
            borderRadius: '12px',
            padding: '1.25rem',
            fontFamily: 'monospace',
            fontSize: '0.7rem',
            lineHeight: 1.5,
            color: 'oklch(0.85 0.05 180)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            minHeight: '260px',
            overflowY: 'auto'
          }}>
            <div>
              <p style={{ color: 'var(--accent-cyan)', margin: 0 }}>[SYSTEM HEADER] NUTRI-VERSE TELEMETRY SHARD</p>
              <p style={{ margin: 0 }}>Timestamp: {new Date().toISOString()}</p>
              <p style={{ margin: 0 }}>Active Segment: {dateRange.toUpperCase()}</p>
            </div>

            {includeMacros && (
              <div>
                <p style={{ color: 'var(--accent-purple)', margin: '0 0 0.2rem 0' }}>// NUTRITIONAL PROFILE SUMMARY</p>
                <p style={{ margin: 0 }}>• Calories Logged (Avg): 2,120 kcal/day (Deficit: 340 kcal)</p>
                <p style={{ margin: 0 }}>• Macros: 145g Protein (28%) | 190g Carbs (36%) | 68g Fats (36%)</p>
                <p style={{ margin: 0 }}>• Top Sources: Wild Salmon, Quinoa, Oats</p>
              </div>
            )}

            {includeHRV && (
              <div>
                <p style={{ color: 'var(--accent-magenta)', margin: '0 0 0.2rem 0' }}>// HRV DYNAMICS & SLEEP TELEMETRY</p>
                <p style={{ margin: 0 }}>• Mean Sleeping HRV: 78.5 ms (SDNN)</p>
                <p style={{ margin: 0 }}>• Mean Resting Pulse: 58 bpm</p>
                <p style={{ margin: 0 }}>• Sleep Duration: 7h 24m (REM: 22%)</p>
                <p style={{ margin: 0 }}>• Biomarker recovery index: 86/100 (Optimal)</p>
              </div>
            )}

            {includeWorkouts && (
              <div>
                <p style={{ color: 'var(--accent-lime)', margin: '0 0 0.2rem 0' }}>// WORKOUT INGRESS COMPLIANCE</p>
                <p style={{ margin: 0 }}>• Active splits: 4 weekly splits completed (100% compliance)</p>
                <p style={{ margin: 0 }}>• Cumulative mechanical workload: 42,500 kg lifted</p>
                <p style={{ margin: 0 }}>• Overtraining RPE index: 7.2 (Healthy overload)</p>
              </div>
            )}

            <div style={{ marginTop: 'auto', borderTop: '1px dashed var(--border-light)', paddingTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.65rem', color: 'var(--foreground-muted)' }}>
              <Shield size={12} />
              <span>SHA-256 verification hash: e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855</span>
            </div>

          </div>
        </div>

      </div>

    </div>
  );
}
