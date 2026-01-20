import { useEffect, useState } from "react";
import { db as firebaseDb } from "./firebase";
import { collection, getDocs, deleteDoc, doc, updateDoc } from "firebase/firestore";

function calcFromPer100(item, grams) {
  const factor = grams / 100;
  return {
    kcal: item.kcal * factor,
    protein: item.protein * factor,
    carbs: item.carbs * factor,
    fat: item.fat * factor
  };
}

function HistoricalMode({ db }) {
  const [historicalDays, setHistoricalDays] = useState([]);
  const [editingDayId, setEditingDayId] = useState(null);
  const [editingDate, setEditingDate] = useState("");

  const getFood = (id) => db.foods.find((f) => f.id === id);
  const getStandardFood = (id) => db.standardFoods.find((f) => f.id === id);
  const getTupper = (id) => db.tuppers.find((t) => t.id === id);

  const loadHistoricalDays = async () => {
    const historicalSnap = await getDocs(collection(firebaseDb, "historicalDays"));
    const days = historicalSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
    // Ordenar por fecha descendente (más reciente primero)
    days.sort((a, b) => new Date(b.date) - new Date(a.date));
    setHistoricalDays(days);
  };

  useEffect(() => {
    loadHistoricalDays();
  }, []);

  const deleteDay = async (dayId) => {
    if (!window.confirm("¿Estás seguro de que quieres eliminar este día?")) return;
    await deleteDoc(doc(firebaseDb, "historicalDays", dayId));
    setHistoricalDays((prev) => prev.filter((d) => d.id !== dayId));
  };

  const startEditDate = (dayId, currentDate) => {
    setEditingDayId(dayId);
    setEditingDate(currentDate);
  };

  const saveEditDate = async (dayId) => {
    if (!editingDate) return;
    const dayRef = doc(firebaseDb, "historicalDays", dayId);
    await updateDoc(dayRef, { date: editingDate });
    setHistoricalDays((prev) =>
      prev.map((d) => (d.id === dayId ? { ...d, date: editingDate } : d)).sort((a, b) => new Date(b.date) - new Date(a.date))
    );
    setEditingDayId(null);
  };

  const cancelEditDate = () => {
    setEditingDayId(null);
    setEditingDate("");
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr + "T00:00:00");
    return date.toLocaleDateString("es-ES", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  };

  if (historicalDays.length === 0) {
    return (
      <div>
        <h2>Historial</h2>
        <p className="small" style={{ textAlign: "center", marginTop: 32 }}>
          No hay días guardados aún. Guarda un día desde el Modo Simple.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h2>Historial</h2>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {historicalDays.map((day) => (
          <div key={day.id} className="card" style={{ padding: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, gap: 8, flexWrap: "wrap" }}>
              <div>
                {editingDayId === day.id ? (
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <input
                      type="date"
                      value={editingDate}
                      onChange={(e) => setEditingDate(e.target.value)}
                      className="input"
                      style={{ flex: 1 }}
                    />
                    <button className="btn btn--primary" onClick={() => saveEditDate(day.id)}>
                      Guardar
                    </button>
                    <button className="btn btn--ghost" onClick={cancelEditDate}>
                      Cancelar
                    </button>
                  </div>
                ) : (
                  <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    <h3 style={{ margin: 0 }}>{formatDate(day.date)}</h3>
                    <button
                      className="btn btn--ghost"
                      onClick={() => startEditDate(day.id, day.date)}
                      style={{ fontSize: "0.8rem", padding: "4px 8px" }}
                    >
                      Editar fecha
                    </button>
                  </div>
                )}
              </div>
              <button
                className="btn btn--ghost"
                onClick={() => deleteDay(day.id)}
                style={{ padding: "6px 10px", color: "#ff6b6b" }}
              >
                Eliminar
              </button>
            </div>

            <div className="macros" style={{ marginBottom: 12 }}>
              <div className="macro">
                <div className="label">Kcal</div>
                <div className="value">{Math.round(day.macros.kcal)}</div>
              </div>
              <div className="macro">
                <div className="label">Proteína (g)</div>
                <div className="value">{day.macros.protein.toFixed(1)}</div>
              </div>
              <div className="macro">
                <div className="label">Carbohidratos (g)</div>
                <div className="value">{day.macros.carbs.toFixed(1)}</div>
              </div>
              <div className="macro">
                <div className="label">Grasas (g)</div>
                <div className="value">{day.macros.fat.toFixed(1)}</div>
              </div>
            </div>

            <div className="hr" />

            <h4 style={{ marginTop: 8, marginBottom: 8 }}>Items consumidos:</h4>
            <ul className="extras-list">
              {day.consumedList.map((item, idx) => {
                const itemData =
                  item.type === "food"
                    ? getFood(item.id)
                    : item.type === "standard"
                    ? getStandardFood(item.id)
                    : item.type === "tupper"
                    ? getTupper(item.id)
                    : null;

                const macros = calcFromPer100(itemData || { kcal: 0, protein: 0, carbs: 0, fat: 0 }, item.grams);

                return (
                  <li key={idx}>
                    <div>
                      <strong>{itemData?.name ?? "Desconocido"}</strong>
                      <div className="small">{item.type} · {item.grams} g</div>
                    </div>
                    <div className="small">
                      {Math.round(macros.kcal)} kcal · {macros.protein.toFixed(1)} g P · {macros.carbs.toFixed(1)} g C · {macros.fat.toFixed(1)} g G
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

export default HistoricalMode;
