import { useState, useEffect } from "react";
import "./App.css";

import SensorCard from "./components/SensorCard";
import SensorChart from "./components/SensorChart";
import AlertPanel from "./components/AlertPanel";
import RecommendationPanel from "./components/RecommendationPanel";

function generateReading() {
  return {
    temperature: Math.floor(Math.random() * 13) + 21,
    humidity: Math.floor(Math.random() * 51) + 30,
    light: Math.floor(Math.random() * 550) + 50,
    occupied: Math.random() > 0.3,
    time: new Date().toLocaleTimeString()
  };
}

function App() {
  const [monitoring, setMonitoring] = useState(true);

  const [dashboard, setDashboard] = useState(() => {
    const first = generateReading();

    return {
      current: first,
      history: [first]
    };
  });

  function updateReadings() {
    const reading = generateReading();

    setDashboard(previous => ({
      current: reading,
      history: [...previous.history, reading].slice(-12)
    }));
  }

  useEffect(() => {
    if (!monitoring) return;

    const timer = setInterval(() => {
      const reading = generateReading();

      setDashboard(previous => ({
        current: reading,
        history: [...previous.history, reading].slice(-12)
      }));
    }, 3000);

    return () => clearInterval(timer);
  }, [monitoring]);

  const current = dashboard.current;

  const temperatureStatus =
    current.temperature > 32 ? "critical" :
    current.temperature > 28 ? "warning" : "normal";

  const humidityStatus =
    current.humidity > 75 || current.humidity < 35
      ? "warning" : "normal";

  const lightStatus =
    current.light < 150 && current.occupied
      ? "warning" : "normal";

  const occupancyStatus =
    current.occupied ? "occupied" : "vacant";

  const alerts = [];

  if (current.temperature > 32) {
    alerts.push("Critical: Room temperature is very high.");
  } else if (current.temperature > 28) {
    alerts.push("Room temperature is above the comfort level.");
  }

  if (current.humidity > 75) {
    alerts.push("Humidity is too high.");
  } else if (current.humidity < 35) {
    alerts.push("Humidity is too low.");
  }

  if (current.light < 150 && current.occupied) {
    alerts.push("Low light detected while the room is occupied.");
  }

  const recommendations = [];

  if (current.temperature > 28) {
    recommendations.push("Consider switching ON the fan or cooling system.");
  } else {
    recommendations.push("Temperature is comfortable.");
  }

  if (current.light < 150 && current.occupied) {
    recommendations.push("Switch ON the lights to improve visibility.");
  } else {
    recommendations.push("Lighting conditions are sufficient.");
  }

  if (!current.occupied) {
    recommendations.push("Room is empty. Consider saving energy.");
  } else {
    recommendations.push("Room occupancy detected.");
  }

  return (
    <div className="dashboard">

      <header className="header">
        <div>
          <h1>SmartHome</h1>
          <p>Intelligent Environment Monitoring System</p>
        </div>

        <div className="live-status">
          <span className={monitoring ? "live-dot" : "paused-dot"}></span>
          {monitoring ? "Monitoring Active" : "Monitoring Paused"}
        </div>
      </header>

      <section className="welcome">
        <h2>Environment Overview</h2>
        <p>Monitor your indoor environment in real time.</p>
      </section>

      <section className="cards">

        <SensorCard
          title="Temperature"
          value={current.temperature}
          unit="°C"
          icon="🌡️"
          status={temperatureStatus}
          description="Room temperature"
        />

        <SensorCard
          title="Humidity"
          value={current.humidity}
          unit="%"
          icon="💧"
          status={humidityStatus}
          description="Air moisture level"
        />

        <SensorCard
          title="Light Intensity"
          value={current.light}
          unit=" lux"
          icon="☀️"
          status={lightStatus}
          description="Room brightness"
        />

        <SensorCard
          title="Occupancy"
          value={current.occupied ? "Present" : "Absent"}
          unit=""
          icon="👤"
          status={occupancyStatus}
          description="Room occupancy"
        />

      </section>

      <section className="controls">
        <div>
          <h2>Sensor Controls</h2>
          <p>Last updated: {current.time}</p>
        </div>

        <div className="buttons">
          <button
            onClick={() => setMonitoring(!monitoring)}
            className="control-button"
          >
            {monitoring ? "Pause Monitoring" : "Start Monitoring"}
          </button>

          <button
            onClick={updateReadings}
            className="update-button"
          >
            ↻ Simulate New Readings
          </button>
        </div>
      </section>

      <section className="charts-section">
        <h2>Environmental Trends</h2>

        <div className="charts">
          <SensorChart
            title="Temperature History"
            data={dashboard.history}
            dataKey="temperature"
            unit="°C"
          />

          <SensorChart
            title="Humidity History"
            data={dashboard.history}
            dataKey="humidity"
            unit="%"
          />
        </div>
      </section>

      <section className="bottom-section">
        <AlertPanel alerts={alerts} />

        <RecommendationPanel
          recommendations={recommendations}
        />
      </section>

      <footer>
        SmartHome Environment Monitoring | Software Simulation
      </footer>

    </div>
  );
}

export default App;