import { useEffect, useState } from "react";
import { db } from "./firebase";
import { collection, getDocs } from "firebase/firestore";

import SimpleMode from "./SimpleMode";
import AjustesMode from "./AjustesMode";

function App() {
  const [mode, setMode] = useState("simple");
  const [dbData, setDbData] = useState(null);

  const loadDb = async () => {
    const tupperTypesSnap = await getDocs(collection(db, "tupperTypes"));
    const foodsSnap = await getDocs(collection(db, "foods"));
    const standardSnap = await getDocs(collection(db, "standardFoods"));
    const tuppersSnap = await getDocs(collection(db, "tuppers"));
    const dailyGoalsSnap = await getDocs(collection(db, "dailyGoals"));
    const dailyProgressSnap = await getDocs(collection(db, "dailyProgress"));

    setDbData({
      tupperTypes: tupperTypesSnap.docs.map(d => ({ id: d.id, ...d.data() })),
      foods: foodsSnap.docs.map(d => ({ id: d.id, ...d.data() })),
      standardFoods: standardSnap.docs.map(d => ({ id: d.id, ...d.data() })),
      tuppers: tuppersSnap.docs.map(d => ({ id: d.id, ...d.data() })),
      dailyGoals: dailyGoalsSnap.docs.map(d => ({ id: d.id, ...d.data() })),
      dailyProgress: dailyProgressSnap.docs.map(d => ({ id: d.id, ...d.data() }))
    });
  };

  useEffect(() => {
    loadDb();
  }, []);

  if (!dbData) return <p className="small">Cargando datos...</p>;

  return (
    <div className="app">
      <header className="header">
        <h1 className="title">Calculadora de comida</h1>
        <div className="mode-controls">
          <button
            className={`btn ${mode === "simple" ? "btn--primary" : ""}`}
            onClick={() => setMode("simple")}
          >
            Modo Simple
          </button>
          <button
            className={`btn ${mode === "ajustes" ? "btn--primary" : "btn--ghost"}`}
            onClick={() => setMode("ajustes")}
          >
            Modo Ajustes
          </button>
        </div>
      </header>

      <div className="card">
        {mode === "simple" ? (
          <SimpleMode db={dbData} reloadDb={loadDb} />
        ) : (
          <AjustesMode db={dbData} reloadDb={loadDb} />
        )}
      </div>
    </div>
  );
}

export default App;
