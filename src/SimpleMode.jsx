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

  return (
    <div>
      <h2>Modo Simple</h2>

      <div>
        <h3>Tupper principal</h3>
        <select
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

      <div>
        <h3>Tipo de tupper</h3>
        <select
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

      <div>
        <h3>Peso total (tupper + comida)</h3>
        <input
          type="number"
          value={tupperWeightFull}
          onChange={(e) => setTupperWeightFull(Number(e.target.value))}
        />
      </div>

      <hr />

      <h3>Complementos</h3>

      <div>
        <select id="foodExtra">
          {db.foods.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name}
            </option>
          ))}
        </select>
        <input id="foodExtraGrams" type="number" placeholder="g" />
        <button
          onClick={() => {
            const id = document.getElementById("foodExtra").value;
            const grams = Number(
              document.getElementById("foodExtraGrams").value
            );
            addExtra("food", id, grams);
          }}
        >
          Añadir
        </button>
      </div>

      <div>
        <select id="standardExtra">
          {db.standardFoods.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name}
            </option>
          ))}
        </select>
        <button
          onClick={() => {
            const id = document.getElementById("standardExtra").value;
            addExtra("standard", id, 100);
          }}
        >
          Añadir estándar
        </button>
      </div>

      <hr />

      <h3>Macros totales</h3>
      <p>Kcal: {total.kcal.toFixed(0)}</p>
      <p>Proteína: {total.protein.toFixed(1)} g</p>
      <p>Carbohidratos: {total.carbs.toFixed(1)} g</p>
      <p>Grasas: {total.fat.toFixed(1)} g</p>

      <hr />

      <h3>Lista de extras</h3>
      <ul>
        {extras.map((e) => {
          const item =
            e.type === "food"
              ? getFood(e.id)
              : getStandardFood(e.id);

          return (
            <li key={e.key}>
              {e.type} {item?.name ?? "Desconocido"} - {e.grams}g
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default SimpleMode;
