function SensorCard({ title, value, unit, icon, status, description }) {
  return (
    <div className="sensor-card">
      <div className="sensor-card-top">
        <span className="sensor-icon">{icon}</span>
        <span className={`sensor-status ${status}`}>
          {status}
        </span>
      </div>

      <h3>{title}</h3>

      <div className="sensor-value">
        {value}
        <span>{unit}</span>
      </div>

      <p>{description}</p>
    </div>
  );
}

export default SensorCard;