function SensorChart({ title, data, dataKey, unit }) {
  const values = data.map(item => item[dataKey]);

  const min = Math.min(...values, 0);
  const max = Math.max(...values, 1);
  const range = max - min || 1;

  const points = values.map((value, index) => {
    const x = 30 + (index / Math.max(values.length - 1, 1)) * 540;
    const y = 180 - ((value - min) / range) * 140;

    return `${x},${y}`;
  }).join(" ");

  return (
    <div className="chart-card">
      <h3>{title}</h3>

      <svg viewBox="0 0 600 220" className="chart">
        <line x1="30" y1="180" x2="570" y2="180" className="chart-axis" />
        <line x1="30" y1="30" x2="30" y2="180" className="chart-axis" />

        <polyline
          points={points}
          fill="none"
          stroke="#38bdf8"
          strokeWidth="4"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {values.map((value, index) => {
          const x = 30 + (index / Math.max(values.length - 1, 1)) * 540;
          const y = 180 - ((value - min) / range) * 140;

          return (
            <circle
              key={index}
              cx={x}
              cy={y}
              r="5"
              fill="#38bdf8"
            />
          );
        })}
      </svg>

      <p>Latest reading: {values[values.length - 1]} {unit}</p>
    </div>
  );
}

export default SensorChart;