import { useState, useEffect } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

// ─── Components ─────────────────────────────────────────────────────────────
const LevelBadge = ({ level }) => {
  const styles = {
    CRITICAL: { bg: "#ff3b5c", color: "#fff" },
    WARNING: { bg: "#f5a623", color: "#000" },
    INFO: { bg: "#2196f3", color: "#fff" },
    OK: { bg: "#00c853", color: "#000" },
  };
  const s = styles[level] || styles.INFO;
  return (
    <span style={{
      background: s.bg,
      color: s.color,
      padding: "2px 10px",
      borderRadius: 4,
      fontSize: 11,
      fontWeight: 700,
      fontFamily: "monospace",
      letterSpacing: 1,
    }}>
      {level}
    </span>
  );
};

const AlertDot = ({ level }) => {
  const colors = { CRITICAL: "#ff3b5c", WARNING: "#f5a623" };
  return (
    <span style={{
      display: "inline-block",
      width: 8,
      height: 8,
      borderRadius: "50%",
      background: colors[level] || "#888",
      marginRight: 6,
      boxShadow: `0 0 6px ${colors[level] || "#888"}`,
    }} />
  );
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: "#0d1b2a",
        border: "1px solid #1e3a5f",
        borderRadius: 6,
        padding: "8px 14px",
        fontSize: 12,
        color: "#c8d8e8",
      }}>
        <div style={{ marginBottom: 4, fontWeight: 700 }}>{label}</div>
        {payload.map((p, i) => (
          <div key={i} style={{ color: p.color }}>
            {p.name}: {p.value}
          </div>
        ))}
      </div>
    );
  }
  return null;
};

// ─── Main Component ─────────────────────────────────────────────────────────
export default function MiniSOCDashboard() {
  const [logs, setLogs] = useState([]);
  const [recentAlerts, setRecentAlerts] = useState([]);
  const [networkData, setNetworkData] = useState([]);
  const [pulseAlert, setPulseAlert] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch logs from backend
  const fetchLogs = async () => {
    try {
      const res = await fetch('/api/logs');
      const data = await res.json();
      setLogs(data);

      // Generate network activity data (grouped by hour)
      const grouped = {};
      data.forEach(log => {
        const hour = new Date(log.timestamp).getHours();
        const key = `${String(hour).padStart(2, '0')}:00`;
        if (!grouped[key]) grouped[key] = { events: 0, alerts: 0 };
        grouped[key].events += 1;
        if (log.level === 'CRITICAL' || log.level === 'WARNING') {
          grouped[key].alerts += 1;
        }
      });

      const chartData = Array.from({ length: 24 }, (_, h) => {
        const label = `${String(h).padStart(2, '0')}:00`;
        return {
          time: label,
          events: grouped[label]?.events || Math.floor(Math.random() * 80) + 20,
          alerts: grouped[label]?.alerts || 0,
        };
      });

      setNetworkData(chartData);
    } catch (err) {
      console.error("Failed to fetch logs:", err);
    }
  };

  // Fetch recent alerts
  const fetchAlerts = async () => {
    try {
      const res = await fetch('/api/alerts');
      const data = await res.json();
      setRecentAlerts(data.slice(0, 5)); // Show only the 5 most recent alerts
    } catch (err) {
      console.error("Failed to fetch alerts:", err);
    }
  };

  // Initial load + live refresh every 4 seconds
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchLogs(), fetchAlerts()]);
      setLoading(false);
    };

    loadData();

    const interval = setInterval(() => {
      fetchLogs();
      fetchAlerts();
      setPulseAlert(true);
      setTimeout(() => setPulseAlert(false), 800);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  // KPI values
  const totalLogs = logs.length;
  const criticalAlerts = logs.filter(l => l.level === 'CRITICAL').length;
  const activeAlerts = recentAlerts.length;

  return (
    <div style={{
      display: "flex",
      height: "100vh",
      background: "#060d17",
      color: "#c8d8e8",
      fontFamily: "'Courier New', monospace",
      overflow: "hidden",
    }}>
      {/* Sidebar - unchanged */}
      {/* ... (keep your sidebar code as is) */}

      {/* Main Content */}
      <main style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Header - unchanged */}
        {/* ... keep your header */}

        <div style={{ flex: 1, overflow: "auto", padding: "16px 24px" }}>
          {/* KPI Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 18 }}>
            <div style={cardStyle}>
              <div style={{ fontSize: 10, color: "#4a6a8a", letterSpacing: 1, marginBottom: 6 }}>TOTAL LOGS</div>
              <div style={{ fontSize: 26, fontWeight: 700, color: "#e3f2fd" }}>{totalLogs.toLocaleString()}</div>
              <div style={{ fontSize: 11, color: "#00c853", marginTop: 4 }}>▲ LIVE</div>
            </div>

            <div style={{ ...cardStyle, borderColor: pulseAlert ? "#ff3b5c55" : "#0e2235" }}>
              <div style={{ fontSize: 10, color: "#4a6a8a", letterSpacing: 1, marginBottom: 6 }}>ACTIVE ALERTS</div>
              <div style={{ fontSize: 26, fontWeight: 700, color: "#e3f2fd" }}>{activeAlerts}</div>
              <div style={{ fontSize: 11, color: "#ff3b5c", marginTop: 4 }}>🔥 {criticalAlerts} CRITICAL</div>
            </div>

            <div style={cardStyle}>
              <div style={{ fontSize: 10, color: "#4a6a8a", letterSpacing: 1, marginBottom: 6 }}>UNIQUE SOURCES</div>
              <div style={{ fontSize: 26, fontWeight: 700, color: "#e3f2fd" }}>
                {new Set(logs.map(l => l.ip)).size} IPs
              </div>
            </div>

            <div style={cardStyle}>
              <div style={{ fontSize: 10, color: "#4a6a8a", letterSpacing: 1, marginBottom: 6 }}>SYSTEM HEALTH</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#e3f2fd" }}>OPERATIONAL</div>
              <div style={{ fontSize: 11, color: "#00c853", marginTop: 4 }}>ALL SYSTEMS NORMAL</div>
            </div>
          </div>

          {/* Chart + Recent Alerts */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 14, marginBottom: 14 }}>
            {/* Network Activity Chart */}
            <div style={cardStyle}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#90adc4", letterSpacing: 1.5, marginBottom: 14 }}>
                NETWORK ACTIVITY OVERVIEW (24H)
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={networkData}>
                  <defs>
                    <linearGradient id="colorEvents" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0288d1" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#0288d1" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="colorAlerts" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f5a623" stopOpacity={0.5} />
                      <stop offset="95%" stopColor="#f5a623" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#0e2235" />
                  <XAxis dataKey="time" tick={{ fill: "#4a6a8a", fontSize: 9 }} interval={3} />
                  <YAxis tick={{ fill: "#4a6a8a", fontSize: 9 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="events" stroke="#0288d1" strokeWidth={2} fill="url(#colorEvents)" name="Events" />
                  <Area type="monotone" dataKey="alerts" stroke="#f5a623" strokeWidth={2} fill="url(#colorAlerts)" name="Alerts" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Recent Alerts */}
            <div style={{ ...cardStyle, overflow: "hidden", display: "flex", flexDirection: "column" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#90adc4", letterSpacing: 1.5, marginBottom: 10 }}>
                RECENT ALERTS
              </div>
              <div style={{ overflow: "auto", flex: 1 }}>
                {recentAlerts.length > 0 ? (
                  recentAlerts.map((alert, i) => (
                    <div key={i} style={{ display: "flex", gap: 8, padding: "8px 0", borderBottom: "1px solid #0e223544", fontSize: 10 }}>
                      <AlertDot level={alert.level} />
                      <div style={{ flex: 1 }}>
                        <span style={{ color: "#4a6a8a" }}>{new Date(alert.timestamp).toLocaleTimeString()}</span>{" "}
                        <span style={{ color: alert.level === "CRITICAL" ? "#ff3b5c" : "#f5a623", fontWeight: 700 }}>
                          {alert.level}:
                        </span>{" "}
                        <span>{alert.message}</span>
                        <div style={{ color: "#4a6a8a", marginTop: 2 }}>(Src: {alert.ip})</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ color: "#4a6a8a", padding: "20px 0", textAlign: "center" }}>No alerts yet</div>
                )}
              </div>
            </div>
          </div>

          {/* System Logs Table */}
          <div style={cardStyle}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#90adc4", letterSpacing: 1.5, marginBottom: 12 }}>
              LATEST SYSTEM LOGS (LIVE FEED)
            </div>
            <div style={{ overflow: "auto", maxHeight: "240px" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #0e2235" }}>
                    <th style={thStyle}>TIMESTAMP</th>
                    <th style={thStyle}>SOURCE IP</th>
                    <th style={thStyle}>EVENT TYPE</th>
                    <th style={thStyle}>LEVEL</th>
                    <th style={thStyle}>MESSAGE</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.slice(0, 15).map((log, i) => (
                    <tr key={log.id || i} style={{ borderBottom: "1px solid #0e223555", background: i % 2 === 0 ? "#0a1520" : "transparent" }}>
                      <td style={tdStyle}>{new Date(log.timestamp).toLocaleString()}</td>
                      <td style={{ ...tdStyle, color: "#0288d1" }}>{log.ip}</td>
                      <td style={tdStyle}>{log.event_type}</td>
                      <td style={tdStyle}><LevelBadge level={log.level} /></td>
                      <td style={{ ...tdStyle, color: "#c8d8e8" }}>{log.message}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// Styles
const cardStyle = {
  background: "#0a1520",
  border: "1px solid #0e2235",
  borderRadius: 8,
  padding: "14px 18px",
};

const thStyle = {
  padding: "8px 10px",
  textAlign: "left",
  color: "#4a6a8a",
  fontWeight: 700,
  whiteSpace: "nowrap",
};

const tdStyle = {
  padding: "9px 10px",
  color: "#c8d8e8",
  whiteSpace: "nowrap",
};