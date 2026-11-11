function AlertPanel({ alerts }) {
  return (
    <div className="panel">
      <h2>Environment Alerts</h2>

      {alerts.length === 0 ? (
        <p className="success-message">
          ✓ All environmental conditions are normal.
        </p>
      ) : (
        alerts.map((alert, index) => (
          <div className="alert-item" key={index}>
            ⚠️ {alert}
          </div>
        ))
      )}
    </div>
  );
}

export default AlertPanel;