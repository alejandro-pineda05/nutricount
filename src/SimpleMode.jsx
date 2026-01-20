import { useEffect, useState } from "react";
import { db as firebaseDb } from "./firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";

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

function SimpleMode({ db, reloadDb }) {
  const [tupperType, setTupperType] = useState(db.tupperTypes[0]?.id || "");
  const [tupperChoice, setTupperChoice] = useState(db.tuppers[0]?.id || "");
  const [tupperWeightFull, setTupperWeightFull] = useState("");
  const [extras, setExtras] = useState([]);
  const [progress, setProgress] = useState({
    kcal: 0,
    protein: 0,
    carbs: 0,
    fat: 0
  });

  const [consumedList, setConsumedList] = useState([]);

  const getFood = (id) => db.foods.find((f) => f.id === id);
  const getStandardFood = (id) => db.standardFoods.find((f) => f.id === id);
  const getTupper = (id) => db.tuppers.find((t) => t.id === id);
  const getTupperType = (id) => db.tupperTypes.find((t) => t.id === id);

  const loadProgress = async () => {
    const docRef = doc(firebaseDb, "dailyProgress", "main");
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      setProgress({
        kcal: data.kcal ?? 0,
        protein: data.protein ?? 0,
        carbs: data.carbs ?? 0,
        fat: data.fat ?? 0
      });
      const loaded = (data.consumedList || []).map((it) => ({ ...it, key: it.key || uuid() }));
      setConsumedList(loaded);
      const loadedExtras = (data.extras || []).map((it) => ({ ...it, key: it.key || uuid() }));
      setExtras(loadedExtras);
    } else {
      await setDoc(docRef, {
        kcal: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        consumedList: [],
        extras: []
      });
      setProgress({ kcal: 0, protein: 0, carbs: 0, fat: 0 });
      setConsumedList([]);
      setExtras([]);
    }
  };

  useEffect(() => {
    loadProgress();
  }, []);

  const saveProgress = async (newProgress, newConsumedList = consumedList, newExtras = extras) => {
    const docRef = doc(firebaseDb, "dailyProgress", "main");
    await setDoc(docRef, { ...newProgress, consumedList: newConsumedList, extras: newExtras });
    setProgress(newProgress);
    setConsumedList(newConsumedList);
    setExtras(newExtras);
  };

  const addExtra = (type, id, grams) => {
    if (!id || grams <= 0) return;

    const item =
      type === "food" ? getFood(id) : getStandardFood(id);

    if (!item) return;

    const macros = calcFromPer100(item, grams);

    const newProgress = {
      kcal: progress.kcal + macros.kcal,
      protein: progress.protein + macros.protein,
      carbs: progress.carbs + macros.carbs,
      fat: progress.fat + macros.fat
    };

    const newExtras = [...extras, { type, id, grams, key: uuid() }];
    setExtras(newExtras);
    saveProgress(newProgress, consumedList, newExtras);

    const gramsEl = document.getElementById("foodExtraGrams");
    if (gramsEl) gramsEl.value = "";
  };

  const resetProgress = async () => {
    const newProgress = { kcal: 0, protein: 0, carbs: 0, fat: 0 };
    // Clear progress and consumed list and extras in Firebase and local state
    await saveProgress(newProgress, [], []);
    setExtras([]);
    setConsumedList([]);
    setTupperWeightFull(0);
  };

  const consumeTupper = async () => {
    // Calcula solo las macros del tupper (sin los extras)
    const tupperOnlyMacros = tupperMacros;
    
    // Los extras ya fueron sumados al progress cuando se agregaron,
    // por lo que solo sumamos el tupper en este punto
    const newProgress = {
      kcal: progress.kcal + tupperOnlyMacros.kcal,
      protein: progress.protein + tupperOnlyMacros.protein,
      carbs: progress.carbs + tupperOnlyMacros.carbs,
      fat: progress.fat + tupperOnlyMacros.fat
    };

    // crear entradas consumidas para los extras actuales (food/standard) y el tupper
    const consumedExtras = extras.map((e) => ({ ...e, key: e.key || uuid() }));
    const newConsumedItem = { type: "tupper", id: tupperChoice, grams: tupperWeightFood, key: uuid() };
    const newConsumedList = [...consumedList, newConsumedItem, ...consumedExtras];
    await saveProgress(newProgress, newConsumedList, []);
    // limpiar la selección actual
    setExtras([]);
    setTupperWeightFull(0);
    const gramsEl = document.getElementById("foodExtraGrams");
    if (gramsEl) gramsEl.value = "";
  };

  const tupperTypeObj = getTupperType(tupperType);
  const tupperObj = getTupper(tupperChoice);

  const tupperWeightFood = Math.max(
    0,
    (Number(tupperWeightFull) || 0) - (tupperTypeObj?.weight || 0)
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

  const kcalWithCurrent = Math.round(progress.kcal + total.kcal);
  const overKcal = Math.round(kcalWithCurrent - goalObj.kcal);

  const removeExtra = async (key) => {
    const item = extras.find((e) => e.key === key);
    if (!item) return;

    const thing = item.type === "food" ? getFood(item.id) : getStandardFood(item.id);
    const macros = calcFromPer100(thing || { kcal: 0, protein: 0, carbs: 0, fat: 0 }, item.grams);

    const newProgress = {
      kcal: Math.max(0, progress.kcal - macros.kcal),
      protein: Math.max(0, progress.protein - macros.protein),
      carbs: Math.max(0, progress.carbs - macros.carbs),
      fat: Math.max(0, progress.fat - macros.fat)
    };

    const newExtras = extras.filter((e) => e.key !== key);
    await saveProgress(newProgress, consumedList, newExtras);
  };

  const removeConsumed = async (key) => {
    const item = consumedList.find((c) => c.key === key);
    if (!item) return;

    const thing =
      item.type === "food"
        ? getFood(item.id)
        : item.type === "standard"
        ? getStandardFood(item.id)
        : item.type === "tupper"
        ? getTupper(item.id)
        : null;

    const macros = calcFromPer100(thing || { kcal: 0, protein: 0, carbs: 0, fat: 0 }, item.grams);

    const newProgress = {
      kcal: Math.max(0, progress.kcal - macros.kcal),
      protein: Math.max(0, progress.protein - macros.protein),
      carbs: Math.max(0, progress.carbs - macros.carbs),
      fat: Math.max(0, progress.fat - macros.fat)
    };

    const newConsumedList = consumedList.filter((c) => c.key !== key);
    await saveProgress(newProgress, newConsumedList, extras);
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
            onChange={(e) => setTupperWeightFull(e.target.value)}
            placeholder="0"
          />
        </div>
      </div>

      <div className="hr" />

      <h3>Comida</h3>

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

      <h3>Progreso objetivo diario</h3>
      <div className="macros" style={{ marginBottom: 8 }}>
        <div className="macro">
          <div className="label">Kcal</div>
          <div className="value">{Math.round(progress.kcal)}/{goalObj.kcal}</div>
          <div className="small">{pct(progress.kcal, goalObj.kcal)}%</div>
        </div>
        <div className="macro">
          <div className="label">Proteína (g)</div>
          <div className="value">{progress.protein.toFixed(1)}/{goalObj.protein}</div>
          <div className="small">{pct(progress.protein, goalObj.protein)}%</div>
        </div>
        <div className="macro">
          <div className="label">Carbohidratos (g)</div>
          <div className="value">{progress.carbs.toFixed(1)}/{goalObj.carbs}</div>
          <div className="small">{pct(progress.carbs, goalObj.carbs)}%</div>
        </div>
        <div className="macro">
          <div className="label">Grasas (g)</div>
          <div className="value">{progress.fat.toFixed(1)}/{goalObj.fat}</div>
          <div className="small">{pct(progress.fat, goalObj.fat)}%</div>
        </div>
      </div>

      <div style={{ textAlign: "center", marginBottom: 12 }}>
        <div style={{ display: "flex", justifyContent: "center", gap: 8 }}>
          <button className="btn btn--primary" onClick={consumeTupper}>Consumir tupper</button>
          <button className="btn btn--ghost" onClick={resetProgress}>Reset progreso</button>
        </div>
      </div>

      <div className="hr" />

      <h3>Lista</h3>
      <ul className="extras-list">
        {[...consumedList.map(c => ({ ...c, __origin: 'consumed' })), ...extras.map(x => ({ ...x, __origin: 'extra' }))].map((e) => {
          const item =
            e.type === "food"
              ? getFood(e.id)
              : e.type === "standard"
              ? getStandardFood(e.id)
              : e.type === "tupper"
              ? getTupper(e.id)
              : null;

          const macros = calcFromPer100(item || { kcal: 0, protein: 0, carbs: 0, fat: 0 }, e.grams);

          return (
            <li key={e.key}>
              <div>
                <strong>{item?.name ?? "Desconocido"}</strong>
                <div className="small">{e.type} · {e.grams} g</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div className="small" style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div>{Math.round(macros.kcal)} kcal</div>
                  <div>Proteína: {macros.protein.toFixed(1)} g</div>
                  <div>Carbohidratos: {macros.carbs.toFixed(1)} g</div>
                  <div>Grasas: {macros.fat.toFixed(1)} g</div>
                </div>
                <div>
                  {e.__origin === 'consumed' ? (
                    <button className="btn btn--ghost" onClick={() => removeConsumed(e.key)}>Eliminar</button>
                  ) : (
                    <button className="btn btn--ghost" onClick={() => removeExtra(e.key)}>Eliminar</button>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default SimpleMode;
