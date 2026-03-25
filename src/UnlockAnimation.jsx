import { TASKS } from "./tasks";
import "./UnlockAnimation.css";

export default function UnlockAnimation({ buildingId, onComplete }) {
  if (!buildingId) return null;

  const task = TASKS.find(t => t.id === buildingId);
  if (!task) return null;

  const building = task.trick.building;
  const emoji = task.trick.building.split(" ")[0]; // Use building emoji
  const buildingImage = `/img/grid_clean_${buildingId}.jpg`;

  return (
    <div className="unlock-animation-overlay">
      {/* Animated building flying to corner */}
      <div className="unlock-building-container">
        <img
          src={buildingImage}
          alt={building}
          className="unlock-building-image"
        />
        <div className="unlock-sparkles">
          <div className="sparkle">✨</div>
          <div className="sparkle">⭐</div>
          <div className="sparkle">🎉</div>
        </div>
      </div>

      {/* Text message */}
      <div className="unlock-message">
        <div className="unlock-emoji">🎉</div>
        <div className="unlock-text">
          <h2>Метод разблокирован!</h2>
          <p>{building}</p>
        </div>
      </div>

      {/* Counter indicator in corner */}
      <div className="unlock-counter-target">
        <div className="counter-value">📍</div>
      </div>
    </div>
  );
}
