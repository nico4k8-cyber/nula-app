import { HAVRUTA_TASKS } from "../bot/havruta-tasks.js";

const descriptions = {
  eggs: "Крестьянин, жара +40°C, 50 км до дома. Яйца испортятся.",
  moth: "Моль ест вещи. Химия помогает — но воняет и вредна детям.",
  fish: "Живая рыба, 4 часа езды, жара. Как довезти живой?",
};

export default function HevrutaTaskPicker({ onSelect, onBack }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0a0f1a",
        color: "white",
        fontFamily: "system-ui, -apple-system, sans-serif",
        padding: 24,
        display: "flex",
        flexDirection: "column",
        gap: 24,
      }}
    >
      {/* Кнопка назад */}
      {onBack && (
        <button
          onClick={onBack}
          style={{
            alignSelf: "flex-start",
            padding: "6px 14px",
            borderRadius: 12,
            border: "1px solid #334155",
            background: "transparent",
            color: "#64748b",
            cursor: "pointer",
            fontSize: 13,
          }}
        >
          ← Назад
        </button>
      )}

      <div>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>
          Выбери задачу
        </h1>
        <p style={{ color: "#64748b", fontSize: 14, marginTop: 6 }}>
          Ты и напарник будете искать решение вместе
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {HAVRUTA_TASKS.map((task) => (
          <button
            key={task.id}
            onClick={() => onSelect(task.id)}
            style={{
              padding: "16px 20px",
              borderRadius: 12,
              border: "1px solid #1e2a3a",
              background: "#0f172a",
              color: "white",
              cursor: "pointer",
              textAlign: "left",
              display: "flex",
              flexDirection: "column",
              gap: 6,
              transition: "border-color 0.15s",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.borderColor = "#4A90D9")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.borderColor = "#1e2a3a")
            }
          >
            <div style={{ fontWeight: 600, fontSize: 16 }}>{task.title}</div>
            <div style={{ color: "#64748b", fontSize: 13 }}>
              {descriptions[task.id] || task.situation.slice(0, 80) + "..."}
            </div>
          </button>
        ))}
      </div>

      <div
        style={{
          padding: "12px 16px",
          borderRadius: 10,
          background: "#0f172a",
          border: "1px solid #1e2a3a",
          fontSize: 13,
          color: "#475569",
          lineHeight: 1.6,
        }}
      >
        Компаньон не знает ответа — он ищет вместе с тобой. Любое решение
        которое работает — принимается. Потом появится Мастер с одним
        вопросом.
      </div>
    </div>
  );
}
