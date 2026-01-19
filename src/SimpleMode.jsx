import { useState } from "react";

function uuid() {
  return Math.random().toString(16).slice(2) + Date.now().toString(16);
}

function calcFromPer100(item, grams) {
  const factor = grams / 100;
  return {
    kcal: item.kcal * factor,
    protein: item.protein * factor,
    carbs: item.carbs * factor,
    fat: item.fat * factor
  };
}

function SimpleMode({ db }) {
  const [tupperType, setTupperType] = useState(db.tupperTypes[0]?.id || "");
  const [tupperChoice, setTupperChoice] = useState(db.tuppers[0]?.id || "");
  const [tupperWeightFull, setTupperWeightFull] = useState(0);
  const [extras, setExtras] = useState([]);

  const getFood = (id) => db.foods.find((f) => f.id === id);
  const getStandardFood = (id) => db.standardFoods.find((f) => f.id === id);
  const getTupper = (id) => db.tuppers.find((t) => t.id === id);
  const getTupperType = (id) => db.tupperTypes.find((t) => t.id === id);

  const addExtra = (type, id, grams) => {
    if (!id || grams <= 0) return;
    setExtras([...extras, { type, id, grams, key: uuid() }]);
    // limpia input grams si quieres (seguimos usando DOM como antes)
    const gramsEl = document.getElementById("foodExtraGrams");
    if (gramsEl) gramsEl.value = "";
  };

  const tupperTypeObj = getTupperType(tupperType);
  const tupperObj = getTupper(tupperChoice);

  const tupperWeightFood = Math.max(
    0,
    tupperWeightFull - (tupperTypeObj?.weight || 0)
  );

  const tupperMacros = tupperObj
    ? calcFromPer100(tupperObj, tupperWeightFood)
    : { kcal: 0, protein: 0, carbs: 0, fat: 0 };

  let total = { ...tupperMacros };

  extras.forEach((e) => {
    const item =
      e.type === "food"
        ? getFood(e.id)
        : getStandardFood(e.id);

    if (item) {
      const macros = calcFromPer100(item, e.grams);
      total.kcal += macros.kcal;
      total.protein += macros.protein;
      total.carbs += macros.carbs;
      total.fat += macros.fat;
    }
  });

  // Obtiene objetivo diario (document id 'main') si existe, si no valores por defecto
  const goalObj = db.dailyGoals?.find((g) => g.id === "main") || {
    id: "main",
    kcal: 2200,
    protein: 150,
    carbs: 250,
    fat: 70
  };

  const pct = (current, goal) => {
    if (!goal || goal <= 0) return 0;
    return Math.min(100, Math.round((current / goal) * 100));
  };

  return (
    <div>
      <h2>Modo Simple</h2>

      <div className="row grid-2">
        <div className="field">
          <label>Tupper principal</label>
          <select
            className="select"
            value={tupperChoice}
            onChange={(e) => setTupperChoice(e.target.value)}
          >
            {db.tuppers.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label>Tipo de tupper</label>
          <select
            className="select"
            value={tupperType}
            onChange={(e) => setTupperType(e.target.value)}
          >
            {db.tupperTypes.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="row">
        <div className="field">
          <label>Peso total (tupper + comida)</label>
          <input
            className="input"
            type="number"
            value={tupperWeightFull}
            onChange={(e) => setTupperWeightFull(Number(e.target.value))}
          />
        </div>
      </div>

      <div className="hr" />

      <h3>Complementos</h3>

      <div className="card" style={{ padding: 12 }}>
        <div className="inline-grid">
          <select id="foodExtra" className="select">
            {db.foods.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
          <input id="foodExtraGrams" className="input" type="number" placeholder="g" />
          <button
            className="btn btn--primary"
            onClick={() => {
              const id = document.getElementById("foodExtra").value;
              const grams = Number(document.getElementById("foodExtraGrams").value);
              addExtra("food", id, grams);
            }}
          >
            Añadir
          </button>
        </div>

        <div style={{ height: 8 }} />

        <div className="inline-grid">
          <select id="standardExtra" className="select">
            {db.standardFoods.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
          <div></div>
          <button
            className="btn"
            onClick={() => {
              const id = document.getElementById("standardExtra").value;
              addExtra("standard", id, 100);
            }}
          >
            Añadir estándar
          </button>
        </div>
      </div>

      <div className="hr" />

      <h3>Macros totales</h3>
      <div className="macros">
        <div className="macro">
          <div className="label">Kcal</div>
          <div className="value">{total.kcal.toFixed(0)}</div>
        </div>
        <div className="macro">
          <div className="label">Proteína (g)</div>
          <div className="value">{total.protein.toFixed(1)}</div>
        </div>
        <div className="macro">
          <div className="label">Carbohidratos (g)</div>
          <div className="value">{total.carbs.toFixed(1)}</div>
        </div>
        <div className="macro">
          <div className="label">Grasas (g)</div>
          <div className="value">{total.fat.toFixed(1)}</div>
        </div>
      </div>

      <div className="hr" />

      <h3>Progreso objetivo diario</h3>
      <div className="macros" style={{ marginBottom: 8 }}>
        <div className="macro">
          <div className="label">Kcal</div>
          <div className="value">{Math.round(total.kcal)}/{goalObj.kcal}</div>
          <div className="small">{pct(total.kcal, goalObj.kcal)}%</div>
        </div>
        <div className="macro">
          <div className="label">Proteína (g)</div>
          <div className="value">{total.protein.toFixed(1)}/{goalObj.protein}</div>
          <div className="small">{pct(total.protein, goalObj.protein)}%</div>
        </div>
        <div className="macro">
          <div className="label">Carbohidratos (g)</div>
          <div className="value">{total.carbs.toFixed(1)}/{goalObj.carbs}</div>
          <div className="small">{pct(total.carbs, goalObj.carbs)}%</div>
        </div>
        <div className="macro">
          <div className="label">Grasas (g)</div>
          <div className="value">{total.fat.toFixed(1)}/{goalObj.fat}</div>
          <div className="small">{pct(total.fat, goalObj.fat)}%</div>
        </div>
      </div>

      <div className="hr" />

      <h3>Lista de extras</h3>
      <ul className="extras-list">
        {extras.map((e) => {
          const item =
            e.type === "food"
              ? getFood(e.id)
              : getStandardFood(e.id);

          return (
            <li key={e.key}>
              <div>
                <strong>{item?.name ?? "Desconocido"}</strong>
                <div className="small">{e.type} · {e.grams} g</div>
              </div>
              <div className="small">{(calcFromPer100(item || {kcal:0}, e.grams).kcal || 0).toFixed(0)} kcal</div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default SimpleMode;
