import { fetchSecurityWaterStatus, updateControlState } from './securityWaterApi';
import React, { useState, useEffect } from 'react';
export default function SecurityWaterPage() {
  const [useMockMode, setUseMockMode] = useState(true);
  const [syncStatus, setSyncStatus] = useState('Local Simulation');

  const [security, setSecurity] = useState({
    systemArmed: true,
    pirMotion: false,       
    mainDoorOpen: false,    
    windowOpen: false,      
    gasPpm: 240,            
    gasThreshold: 400,      
    sirenActive: false,     
  });

  const [water, setWater] = useState({
    tankLevelCm: 35,        
    tankHeightCm: 100,      
    levelPercent: 65,       
    pumpOn: false,          
    autoMode: true,         
    lowThreshold: 20,
    highCutoff: 95,
    flowRateLpm: 0.0,       
  });

  const [alertLogs, setAlertLogs] = useState([
    { id: 1, time: new Date().toLocaleTimeString(), type: 'INFO', msg: 'Security & Water Module initialized.' }
  ]);

  const addLog = (type, msg) => {
    setAlertLogs((prev) => [
      { id: Date.now(), time: new Date().toLocaleTimeString(), type, msg },
      ...prev.slice(0, 14),
    ]);
  };

  useEffect(() => {
    if (useMockMode) {
      setSyncStatus('Local Simulation Mode');
      return;
    }
    const pollBackend = async () => {
      try {
        const data = await fetchSecurityWaterStatus();
        if (data.security) setSecurity(data.security);
        if (data.water) setWater(data.water);
        setSyncStatus('Synced with Backend');
      } catch (err) {
        setSyncStatus('Backend Offline - Fallback Active');
      }
    };
    pollBackend();
    const interval = setInterval(pollBackend, 3000);
    return () => clearInterval(interval);
  }, [useMockMode]);

  useEffect(() => {
    if (water.autoMode) {
      if (water.levelPercent >= water.highCutoff && water.pumpOn) {
        setWater((prev) => ({ ...prev, pumpOn: false, flowRateLpm: 0 }));
        addLog('CRITICAL', `Overflow Prevented: Tank hit ${water.levelPercent}%. Pump OFF.`);
      } else if (water.levelPercent <= water.lowThreshold && !water.pumpOn) {
        setWater((prev) => ({ ...prev, pumpOn: true, flowRateLpm: 12.4 }));
        addLog('INFO', `Auto-Refill: Tank dropped to ${water.levelPercent}%. Pump ON.`);
      }
    }
    const gasHazard = security.gasPpm >= security.gasThreshold;
    const perimeterBreach = security.systemArmed && (security.pirMotion || security.mainDoorOpen || security.windowOpen);

    if ((gasHazard || perimeterBreach) && !security.sirenActive) {
      setSecurity((prev) => ({ ...prev, sirenActive: true }));
      if (gasHazard) addLog('EMERGENCY', `Gas Leak Detected (${security.gasPpm} PPM)! Siren triggered.`);
      if (perimeterBreach) addLog('EMERGENCY', 'Perimeter breach! Intrusion alarm triggered.');
    }
  }, [water.levelPercent, water.autoMode, security.gasPpm, security.pirMotion, security.mainDoorOpen, security.windowOpen, security.systemArmed]);

  useEffect(() => {
    if (!useMockMode || !water.pumpOn) return;
    const timer = setInterval(() => {
      setWater((prev) => {
        const nextLevel = Math.min(100, prev.levelPercent + 2);
        const nextDist = Math.max(5, Math.round(prev.tankHeightCm * (1 - nextLevel / 100)));
        return { ...prev, levelPercent: nextLevel, tankLevelCm: nextDist, flowRateLpm: 12.4 };
      });
    }, 1500);
    return () => clearInterval(timer);
  }, [useMockMode, water.pumpOn]);

  const handleControlChange = async (moduleName, updatedFields, logMessage) => {
    if (moduleName === 'security') {
      setSecurity((prev) => ({ ...prev, ...updatedFields }));
    } else {
      setWater((prev) => ({ ...prev, ...updatedFields }));
    }
    if (logMessage) addLog('ACTION', logMessage);
    if (!useMockMode) {
      try {
        await updateControlState({ module: moduleName, ...updatedFields });
      } catch (e) {
        addLog('WARN', 'Command queued locally (Node.js server unreachable).');
      }
    }
  };

  // LIGHT THEME VARIABLES
  const theme = {
    bgApp: '#ffffff',
    bgCard: '#ffffff',
    bgSub: '#f1f5f9', // Light gray for sensor backgrounds
    borderCard: '1px solid #e2e8f0',
    textMain: '#0f172a',
    textMuted: '#64748b',
    accentSafe: '#10b981',
    accentWarn: '#f59e0b',
    accentDanger: '#ef4444',
    accentWater: '#0ea5e9',
    font: "'Inter', 'Segoe UI', sans-serif",
    shadow: '0 8px 30px rgba(0, 0, 0, 0.04)'
  };

  return (
    <div style={{ background: theme.bgApp, color: theme.textMain, minHeight: '100vh', padding: '32px', fontFamily: theme.font, boxSizing: 'border-box' }}>
      
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: theme.borderCard, paddingBottom: '20px', marginBottom: '32px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 800, letterSpacing: '-0.5px' }}>Smart Home Telemetry</h1>
          <p style={{ margin: '6px 0 0', color: theme.textMuted, fontSize: '15px' }}>Module 4 & 5 • Security and Water Control</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
          <button
            onClick={() => setUseMockMode(!useMockMode)}
            style={{
              padding: '8px 16px', borderRadius: '20px', border: useMockMode ? '1px solid #8b5cf6' : '1px solid #10b981',
              backgroundColor: useMockMode ? 'rgba(139, 92, 246, 0.08)' : 'rgba(16, 185, 129, 0.08)',
              color: useMockMode ? '#6d28d9' : '#047857', cursor: 'pointer', fontWeight: 600, fontSize: '13px', transition: 'all 0.2s'
            }}
          >
            {useMockMode ? '⚙️ Mock Simulator Active' : '🌐 Live Node.js Sync'}
          </button>
          <span style={{ fontSize: '12px', color: theme.textMuted }}>Status: {syncStatus}</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '32px' }}>
        
        {/* SECURITY CARD */}
        <div style={{ background: theme.bgCard, borderRadius: '20px', padding: '28px', border: security.sirenActive ? `1px solid ${theme.accentDanger}` : theme.borderCard, boxShadow: security.sirenActive ? '0 0 30px rgba(239, 68, 68, 0.15)' : theme.shadow }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700 }}>Perimeter Security</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: security.systemArmed ? theme.accentSafe : '#cbd5e1', boxShadow: security.systemArmed ? `0 0 10px ${theme.accentSafe}` : 'none' }} />
              <span style={{ fontSize: '13px', fontWeight: 700, color: security.systemArmed ? theme.accentSafe : theme.textMuted }}>{security.systemArmed ? 'ARMED' : 'DISARMED'}</span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
            <button
              onClick={() => handleControlChange('security', { systemArmed: !security.systemArmed, sirenActive: false }, `System ${!security.systemArmed ? 'ARMED' : 'DISARMED'}`)}
              style={{ padding: '14px', borderRadius: '12px', border: security.systemArmed ? '1px solid #e2e8f0' : 'none', fontWeight: 600, cursor: 'pointer', color: security.systemArmed ? '#334155' : '#fff', background: security.systemArmed ? theme.bgSub : 'linear-gradient(135deg, #10b981, #059669)' }}
            >
              {security.systemArmed ? 'Disarm System' : 'Arm System'}
            </button>
            <button
              onClick={() => handleControlChange('security', { sirenActive: !security.sirenActive }, `Siren manually ${!security.sirenActive ? 'TRIGGERED' : 'SILENCED'}`)}
              style={{ padding: '14px', borderRadius: '12px', border: security.sirenActive ? 'none' : '1px solid #e2e8f0', fontWeight: 600, cursor: 'pointer', color: security.sirenActive ? '#fff' : '#334155', background: security.sirenActive ? 'linear-gradient(135deg, #ef4444, #b91c1c)' : theme.bgSub }}
            >
              {security.sirenActive ? 'Silence Alarm' : 'Trigger Panic'}
            </button>
          </div>

          {/* Sensors */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ padding: '16px', borderRadius: '12px', backgroundColor: theme.bgSub, border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '12px', color: theme.textMuted, marginBottom: '4px' }}>GPIO 27 • Motion</div>
                <div style={{ fontWeight: 600, color: security.pirMotion ? theme.accentDanger : theme.textMain }}>{security.pirMotion ? 'Breach Detected' : 'Area Clear'}</div>
              </div>
              {useMockMode && <button onClick={() => setSecurity(s => ({...s, pirMotion: !s.pirMotion}))} style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff', color: theme.textMain, cursor: 'pointer', fontSize: '12px' }}>Trip Sensor</button>}
            </div>

            <div style={{ padding: '16px', borderRadius: '12px', backgroundColor: theme.bgSub, border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '12px', color: theme.textMuted, marginBottom: '4px' }}>GPIO 25/26 • Contacts</div>
                <div style={{ fontWeight: 600, color: (security.mainDoorOpen || security.windowOpen) ? theme.accentWarn : theme.textMain }}>{security.mainDoorOpen ? 'Door Open' : 'Door Closed'} • {security.windowOpen ? 'Window Open' : 'Window Closed'}</div>
              </div>
              {useMockMode && (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => setSecurity(s => ({...s, mainDoorOpen: !s.mainDoorOpen}))} style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff', color: theme.textMain, cursor: 'pointer', fontSize: '12px' }}>Door</button>
                  <button onClick={() => setSecurity(s => ({...s, windowOpen: !s.windowOpen}))} style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff', color: theme.textMain, cursor: 'pointer', fontSize: '12px' }}>Win</button>
                </div>
              )}
            </div>

            <div style={{ padding: '16px', borderRadius: '12px', backgroundColor: theme.bgSub, border: security.gasPpm >= security.gasThreshold ? `1px solid ${theme.accentDanger}` : '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '14px' }}>
                <span style={{ color: theme.textMuted }}>ADC1_CH6 • MQ-2 Gas</span>
                <span style={{ fontWeight: 600, color: security.gasPpm >= security.gasThreshold ? theme.accentDanger : theme.textMain }}>{security.gasPpm} PPM</span>
              </div>
              <div style={{ height: '6px', width: '100%', backgroundColor: '#cbd5e1', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${Math.min(100, (security.gasPpm / 1000) * 100)}%`, backgroundColor: security.gasPpm >= security.gasThreshold ? theme.accentDanger : theme.accentSafe, transition: 'width 0.3s ease' }} />
              </div>
              {useMockMode && <input type="range" min="100" max="800" value={security.gasPpm} onChange={(e) => setSecurity(s => ({...s, gasPpm: Number(e.target.value)}))} style={{ width: '100%', marginTop: '16px', accentColor: theme.accentSafe }} />}
            </div>
          </div>
        </div>

        {/* WATER CARD */}
        <div style={{ background: theme.bgCard, borderRadius: '20px', padding: '28px', border: theme.borderCard, boxShadow: theme.shadow }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700 }}>Water Management</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: water.pumpOn ? theme.accentWater : '#cbd5e1', boxShadow: water.pumpOn ? `0 0 10px ${theme.accentWater}` : 'none' }} />
              <span style={{ fontSize: '13px', fontWeight: 700, color: water.pumpOn ? theme.accentWater : theme.textMuted }}>PUMP {water.pumpOn ? 'ACTIVE' : 'IDLE'}</span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
             <button
              onClick={() => handleControlChange('water', { autoMode: !water.autoMode }, `Pump Mode: ${!water.autoMode ? 'AUTO' : 'MANUAL'}`)}
              style={{ padding: '14px', borderRadius: '12px', border: water.autoMode ? 'none' : '1px solid #e2e8f0', fontWeight: 600, cursor: 'pointer', color: water.autoMode ? '#fff' : '#334155', background: water.autoMode ? 'linear-gradient(135deg, #0284c7, #0369a1)' : theme.bgSub }}
            >
              {water.autoMode ? 'Auto Hysteresis ON' : 'Manual Override'}
            </button>
            <button
              disabled={water.autoMode || (water.levelPercent >= water.highCutoff && !water.pumpOn)}
              onClick={() => handleControlChange('water', { pumpOn: !water.pumpOn, flowRateLpm: !water.pumpOn ? 12.4 : 0 }, `Pump manually ${!water.pumpOn ? 'STARTED' : 'STOPPED'}`)}
              style={{ padding: '14px', borderRadius: '12px', border: water.pumpOn ? 'none' : '1px solid #e2e8f0', fontWeight: 600, cursor: water.autoMode ? 'not-allowed' : 'pointer', opacity: water.autoMode ? 0.4 : 1, color: water.pumpOn ? '#fff' : '#334155', background: water.pumpOn ? 'linear-gradient(135deg, #ef4444, #b91c1c)' : theme.bgSub }}
            >
              {water.pumpOn ? 'Stop Pump' : 'Start Pump'}
            </button>
          </div>

          {/* Tank Visualizer */}
          <div style={{ display: 'flex', gap: '24px', alignItems: 'center', padding: '20px', borderRadius: '12px', backgroundColor: theme.bgSub, border: '1px solid #e2e8f0' }}>
            
            <div style={{ width: '70px', height: '140px', backgroundColor: '#e2e8f0', borderRadius: '8px 8px 16px 16px', border: '2px solid #cbd5e1', position: 'relative', overflow: 'hidden', boxShadow: 'inset 0 4px 10px rgba(0,0,0,0.1)' }}>
              <div style={{ position: 'absolute', bottom: 0, width: '100%', height: `${water.levelPercent}%`, background: water.levelPercent >= water.highCutoff ? 'linear-gradient(0deg, #ef4444, #f87171)' : water.levelPercent <= water.lowThreshold ? 'linear-gradient(0deg, #f59e0b, #fbbf24)' : 'linear-gradient(0deg, #0ea5e9, #38bdf8)', transition: 'height 0.4s cubic-bezier(0.4, 0, 0.2, 1)' }} />
            </div>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <div style={{ fontSize: '12px', color: theme.textMuted }}>HC-SR04 Level</div>
                <div style={{ fontSize: '24px', fontWeight: 800, color: theme.textMain, letterSpacing: '-1px' }}>{water.levelPercent}%</div>
              </div>
              <div style={{ fontSize: '13px', color: theme.textMuted }}>
                Distance: <strong style={{ color: theme.textMain }}>{water.tankLevelCm} cm</strong><br/>
                Flow Rate: <strong style={{ color: water.pumpOn ? theme.accentWater : theme.textMain }}>{water.pumpOn ? water.flowRateLpm : 0} L/min</strong>
              </div>
              {useMockMode && <input type="range" min="5" max="100" value={water.levelPercent} onChange={(e) => { const lvl = Number(e.target.value); setWater(w => ({ ...w, levelPercent: lvl, tankLevelCm: Math.round(w.tankHeightCm * (1 - lvl / 100)) })); }} style={{ width: '100%', accentColor: theme.accentWater }} />}
            </div>
          </div>
        </div>
      </div>

      {/* LOGS */}
      <div style={{ marginTop: '32px', background: theme.bgCard, borderRadius: '20px', padding: '24px', border: theme.borderCard, boxShadow: theme.shadow }}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', color: theme.textMuted }}>Event Telemetry</h3>
        <div style={{ maxHeight: '180px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', fontFamily: "'Fira Code', 'Courier New', monospace", fontSize: '13px' }}>
          {alertLogs.map((log) => {
            const isAlert = log.type === 'EMERGENCY' || log.type === 'CRITICAL';
            const isAction = log.type === 'ACTION';
            return (
              <div key={log.id} style={{ display: 'flex', gap: '12px', padding: '10px 14px', borderRadius: '8px', backgroundColor: theme.bgSub, borderLeft: `3px solid ${isAlert ? theme.accentDanger : isAction ? theme.accentWater : theme.accentSafe}` }}>
                <span style={{ color: '#94a3b8', minWidth: '90px' }}>{log.time}</span>
                <span style={{ fontWeight: 600, color: isAlert ? theme.accentDanger : isAction ? theme.accentWater : theme.accentSafe, minWidth: '80px' }}>[{log.type}]</span>
                <span style={{ color: '#334155' }}>{log.msg}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}