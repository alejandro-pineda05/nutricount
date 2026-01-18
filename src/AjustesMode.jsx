import { useMemo, useState } from "react";
import { db } from "./firebase";
import { setDoc, doc, deleteDoc } from "firebase/firestore";

function EditableRow({ item, onSave, onDelete, onCancel }) {
  const [name, setName] = useState(item.name);
  const [kcal, setKcal] = useState(item.kcal || 0);
  const [protein, setProtein] = useState(item.protein || 0);
  const [carbs, setCarbs] = useState(item.carbs || 0);
  const [fat, setFat] = useState(item.fat || 0);
  const [weight, setWeight] = useState(item.weight || 0);

  return (
    <tr>
      <td>
        <input value={name} onChange={(e) => setName(e.target.value)} />
      </td>

      {item.weight !== undefined ? (
        <td>
          <input
            type="number"
            value={weight}
            onChange={(e) => setWeight(Number(e.target.value))}
          />
        </td>
      ) : (
        <>
          <td>
            <input type="number" value={kcal} onChange={(e) => setKcal(Number(e.target.value))} />
          </td>
          <td>
            <input
              type="number"
              value={protein}
              onChange={(e) => setProtein(Number(e.target.value))}
            />
          </td>
          <td>
            <input type="number" value={carbs} onChange={(e) => setCarbs(Number(e.target.value))} />
          </td>
          <td>
            <input type="number" value={fat} onChange={(e) => setFat(Number(e.target.value))} />
          </td>
        </>
      )}

      <td>
        <button
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
        <button onClick={onCancel}>Cancelar</button>
        <button onClick={() => onDelete(item.id)}>Borrar</button>
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
    return [];
  }, [activeTab, dbData]);

  const template = {
    foods: { id: "new", name: "", kcal: 0, protein: 0, carbs: 0, fat: 0 },
    standardFoods: { id: "new", name: "", kcal: 0, protein: 0, carbs: 0, fat: 0 },
    tuppers: { id: "new", name: "", kcal: 0, protein: 0, carbs: 0, fat: 0 },
    tupperTypes: { id: "new", name: "", weight: 0 }
  };

  const saveItem = async (collectionName, item) => {
    const id = item.id === "new" ? crypto.randomUUID() : item.id;
    await setDoc(doc(db, collectionName, id), { ...item, id });
    await reloadDb();
    setNewItem(null);
    setEditingId(null);
  };

  const deleteItem = async (collectionName, id) => {
    await deleteDoc(doc(db, collectionName, id));
    await reloadDb();
    setEditingId(null);
  };

  return (
    <div>
      <h2>Modo Ajustes</h2>

      <div>
        <button onClick={() => setActiveTab("foods")}>Alimentos</button>
        <button onClick={() => setActiveTab("standardFoods")}>Estándar</button>
        <button onClick={() => setActiveTab("tuppers")}>Tuppers</button>
        <button onClick={() => setActiveTab("tupperTypes")}>Tipos de Tupper</button>
      </div>

      <div>
        <button
          onClick={() => {
            setNewItem(template[activeTab]);
            setEditingId("new");
          }}
        >
          Añadir nuevo
        </button>
      </div>

      <table border="1" cellPadding="5">
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
                  <td>{item.name}</td>
                  {activeTab !== "tupperTypes" && <td>{item.kcal}</td>}
                  {activeTab !== "tupperTypes" && <td>{item.protein}</td>}
                  {activeTab !== "tupperTypes" && <td>{item.carbs}</td>}
                  {activeTab !== "tupperTypes" && <td>{item.fat}</td>}
                  {activeTab === "tupperTypes" && <td>{item.weight}</td>}
                  <td>
                    <button onClick={() => setEditingId(item.id)}>Editar</button>
                    <button onClick={() => deleteItem(activeTab, item.id)}>Borrar</button>
                  </td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default AjustesMode;
