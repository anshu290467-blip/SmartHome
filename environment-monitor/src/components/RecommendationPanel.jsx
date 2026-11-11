function RecommendationPanel({ recommendations }) {
  return (
    <div className="panel">
      <h2>Smart Recommendations</h2>

      {recommendations.map((item, index) => (
        <div className="recommendation-item" key={index}>
          💡 {item}
        </div>
      ))}
    </div>
  );
}

export default RecommendationPanel;