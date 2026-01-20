import { useMemo, useState } from "react";
import { db } from "./firebase";
import { setDoc, doc, deleteDoc } from "firebase/firestore";

function uuid() {
  return Math.random().toString(16).slice(2) + Date.now().toString(16);
}

function EditableRow({ item, onSave, onDelete, onCancel }) {
  const [name, setName] = useState(item.name);
  const [kcal, setKcal] = useState(item.kcal || 0);
  const [protein, setProtein] = useState(item.protein || 0);
  const [carbs, setCarbs] = useState(item.carbs || 0);
  const [fat, setFat] = useState(item.fat || 0);
  const [weight, setWeight] = useState(item.weight || 0);

  return (
    <tr>
      <td data-label="Nombre">
        <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
      </td>

      {item.weight !== undefined ? (
        <td data-label="Peso (g)">
          <input
            className="input"
            type="number"
            value={weight || ""}
            onChange={(e) => setWeight(e.target.value === "" ? 0 : Number(e.target.value))}
            placeholder="0"
          />
        </td>
      ) : (
        <>
          <td data-label="Kcal">
            <input className="input" type="number" value={kcal || ""} onChange={(e) => setKcal(e.target.value === "" ? 0 : Number(e.target.value))} placeholder="0" />
          </td>
          <td data-label="Prot (g)">
            <input
              className="input"
              type="number"
              value={protein || ""}
              onChange={(e) => setProtein(e.target.value === "" ? 0 : Number(e.target.value))}
              placeholder="0"
            />
          </td>
          <td data-label="Carbs (g)">
            <input className="input" type="number" value={carbs || ""} onChange={(e) => setCarbs(e.target.value === "" ? 0 : Number(e.target.value))} placeholder="0" />
          </td>
          <td data-label="Grasa (g)">
            <input className="input" type="number" value={fat || ""} onChange={(e) => setFat(e.target.value === "" ? 0 : Number(e.target.value))} placeholder="0" />
          </td>
        </>
      )}

      <td data-label="Acciones">
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
          <button className="btn btn--primary"
            onClick={() =>
              onSave(
                item.weight !== undefined
                  ? { ...item, name, weight }
                  : { ...item, name, kcal, protein, carbs, fat }
              )
            }
          >
            Guardar
          </button>
          <button className="btn btn--ghost" onClick={onCancel}>Cancelar</button>
          <button className="btn" onClick={() => onDelete(item.id)}>Borrar</button>
        </div>
      </td>
    </tr>
  );
}

function AjustesMode({ db: dbData, reloadDb }) {
  const [activeTab, setActiveTab] = useState("foods");
  const [editingId, setEditingId] = useState(null);
  const [newItem, setNewItem] = useState(null);

  const list = useMemo(() => {
    if (activeTab === "foods") return dbData.foods;
    if (activeTab === "standardFoods") return dbData.standardFoods;
    if (activeTab === "tuppers") return dbData.tuppers;
    if (activeTab === "tupperTypes") return dbData.tupperTypes;
    if (activeTab === "objectives") return dbData.dailyGoals;
    return [];
  }, [activeTab, dbData]);

  const template = {
    foods: { id: "new", name: "", kcal: 0, protein: 0, carbs: 0, fat: 0 },
    standardFoods: { id: "new", name: "", kcal: 0, protein: 0, carbs: 0, fat: 0 },
    tuppers: { id: "new", name: "", kcal: 0, protein: 0, carbs: 0, fat: 0 },
    tupperTypes: { id: "new", name: "", weight: 0 },
    objectives: { id: "main", kcal: 2200, protein: 150, carbs: 250, fat: 70 }
  };

  const saveItem = async (collectionName, item) => {
    try {
      const id = item.id === "new" ? uuid() : item.id;
      const itemToSave = { 
        ...item, 
        id,
        name: item.name || ""
      };
      
      // Asegurar que todos los campos necesarios existan
      if (collectionName !== "tupperTypes") {
        itemToSave.kcal = itemToSave.kcal ?? 0;
        itemToSave.protein = itemToSave.protein ?? 0;
        itemToSave.carbs = itemToSave.carbs ?? 0;
        itemToSave.fat = itemToSave.fat ?? 0;
      } else {
        itemToSave.weight = itemToSave.weight ?? 0;
      }
      
      console.log("Guardando:", collectionName, itemToSave);
      await setDoc(doc(db, collectionName, id), itemToSave);
      console.log("Guardado exitosamente");
      
      await reloadDb();
      setNewItem(null);
      setEditingId(null);
    } catch (error) {
      console.error("Error guardando:", error);
      alert("Error al guardar: " + error.message);
    }
  };

  const deleteItem = async (collectionName, id) => {
    await deleteDoc(doc(db, collectionName, id));
    await reloadDb();
    setEditingId(null);
  };

  // Handler específico para guardar objetivos en dailyGoals/main
  const saveObjectives = async (values) => {
    const payload = { id: "main", ...values };
    await setDoc(doc(db, "dailyGoals", "main"), payload);
    await reloadDb();
  };

  const currentObjectives = dbData.dailyGoals?.find((d) => d.id === "main") || {
    id: "main",
    kcal: 2200,
    protein: 150,
    carbs: 250,
    fat: 70
  };

  return (
    <div>
      <h2>Modo Ajustes</h2>

      <div className="tabs-container">
        <button className={`btn ${activeTab === "foods" ? "btn--primary" : ""}`} onClick={() => setActiveTab("foods")}>Alimentos</button>
        <button className={`btn ${activeTab === "standardFoods" ? "btn--primary" : ""}`} onClick={() => setActiveTab("standardFoods")}>Estándar</button>
        <button className={`btn ${activeTab === "tuppers" ? "btn--primary" : ""}`} onClick={() => setActiveTab("tuppers")}>Tuppers</button>
        <button className={`btn ${activeTab === "tupperTypes" ? "btn--primary" : ""}`} onClick={() => setActiveTab("tupperTypes")}>T. Tupper</button>
        <button className={`btn ${activeTab === "objectives" ? "btn--primary" : ""}`} onClick={() => setActiveTab("objectives")}>Objetivos</button>
      </div>

      <div style={{ marginBottom: 12 }}>
        {activeTab !== "objectives" && (
          <button className="btn btn--primary" style={{ width: "100%" }}
            onClick={() => {
              setNewItem(template[activeTab]);
              setEditingId("new");
            }}
          >
            Añadir nuevo
          </button>
        )}
      </div>

      {activeTab === "objectives" ? (
        <div>
          <div className="card" style={{ padding: 12 }}>
            <h3>Objetivos diarios (document: dailyGoals / id: main)</h3>
            <div className="objectives-grid" style={{ marginTop: 8 }}>
              <div className="field">
                <label>Kcal objetivo</label>
                <input className="input" type="number" defaultValue={currentObjectives.kcal} id="goalKcal" />
              </div>
              <div className="field">
                <label>Proteína (g)</label>
                <input className="input" type="number" defaultValue={currentObjectives.protein} id="goalProtein" />
              </div>
              <div className="field">
                <label>Carbohidratos (g)</label>
                <input className="input" type="number" defaultValue={currentObjectives.carbs} id="goalCarbs" />
              </div>
              <div className="field">
                <label>Grasas (g)</label>
                <input className="input" type="number" defaultValue={currentObjectives.fat} id="goalFat" />
              </div>
            </div>

            <div style={{ marginTop: 16 }}>
              <button
                className="btn btn--primary"
                style={{ width: "100%" }}
                onClick={async () => {
                  const kcal = Number(document.getElementById("goalKcal").value) || 0;
                  const protein = Number(document.getElementById("goalProtein").value) || 0;
                  const carbs = Number(document.getElementById("goalCarbs").value) || 0;
                  const fat = Number(document.getElementById("goalFat").value) || 0;
                  await saveObjectives({ kcal, protein, carbs, fat });
                }}
              >
                Guardar objetivos
              </button>
            </div>
          </div>

          <div className="hr" />

          <div>
            <p className="small">Actualmente guardado:</p>
            <div className="macros" style={{ marginTop: 8 }}>
              <div className="macro">
                <div className="label">Kcal objetivo</div>
                <div className="value">{currentObjectives.kcal}</div>
              </div>
              <div className="macro">
                <div className="label">Proteína (g)</div>
                <div className="value">{currentObjectives.protein}</div>
              </div>
              <div className="macro">
                <div className="label">Carbohidratos (g)</div>
                <div className="value">{currentObjectives.carbs}</div>
              </div>
              <div className="macro">
                <div className="label">Grasas (g)</div>
                <div className="value">{currentObjectives.fat}</div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Nombre</th>
                {activeTab !== "tupperTypes" && <th>Kcal / 100g</th>}
                {activeTab !== "tupperTypes" && <th>Proteína</th>}
                {activeTab !== "tupperTypes" && <th>Carbs</th>}
                {activeTab !== "tupperTypes" && <th>Grasa</th>}
                {activeTab === "tupperTypes" && <th>Peso envase (g)</th>}
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {editingId === "new" && newItem && (
                <EditableRow
                  item={newItem}
                  onSave={(item) => saveItem(activeTab, item)}
                  onDelete={() => {
                    setNewItem(null);
                    setEditingId(null);
                  }}
                  onCancel={() => {
                    setNewItem(null);
                    setEditingId(null);
                  }}
                />
              )}

              {list.map((item) => (
                <tr key={item.id}>
                  {editingId === item.id ? (
                    <EditableRow
                      item={item}
                      onSave={(newItem) => saveItem(activeTab, newItem)}
                      onDelete={(id) => deleteItem(activeTab, id)}
                      onCancel={() => setEditingId(null)}
                    />
                  ) : (
                    <>
                      <td data-label="Nombre">{item.name}</td>
                      {activeTab !== "tupperTypes" && <td data-label="Kcal">{item.kcal}</td>}
                      {activeTab !== "tupperTypes" && <td data-label="Prot (g)">{item.protein}</td>}
                      {activeTab !== "tupperTypes" && <td data-label="Carbs (g)">{item.carbs}</td>}
                      {activeTab !== "tupperTypes" && <td data-label="Grasa (g)">{item.fat}</td>}
                      {activeTab === "tupperTypes" && <td data-label="Peso (g)">{item.weight}</td>}
                      <td data-label="Acciones">
                        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                          <button className="btn" onClick={() => setEditingId(item.id)}>Editar</button>
                          <button className="btn btn--ghost" onClick={() => deleteItem(activeTab, item.id)}>Borrar</button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default AjustesMode;
