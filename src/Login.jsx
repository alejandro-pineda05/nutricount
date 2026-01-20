import { useState, useEffect } from "react";
import { db } from "./firebase";
import { doc, getDoc } from "firebase/firestore";
import bcrypt from "bcryptjs";

function Login({ onLogin }) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [pinHash, setPinHash] = useState(null);
  const [attempts, setAttempts] = useState(0);
  const [blocked, setBlocked] = useState(false);
  const [blockTimeLeft, setBlockTimeLeft] = useState(0);

  const MAX_ATTEMPTS = 5;
  const BLOCK_DURATION = 15 * 60 * 1000; // 15 minutos en ms

  useEffect(() => {
    const loadPin = async () => {
      try {
        const configRef = doc(db, "config", "pin");
        const configSnap = await getDoc(configRef);
        
        if (configSnap.exists() && configSnap.data().hash) {
          setPinHash(configSnap.data().hash);
        } else {
          setError("Configuración de PIN no encontrada. Ejecuta: npm run setup:pin");
        }
      } catch (err) {
        console.error("Error cargando PIN:", err);
        setError("Error al cargar la configuración");
      } finally {
        setLoading(false);
      }
    };

    // Verificar si está bloqueado
    const lastAttempt = localStorage.getItem("nutricount_lastAttempt");
    const attemptCount = parseInt(localStorage.getItem("nutricount_attempts") || "0");
    
    if (lastAttempt && attemptCount >= MAX_ATTEMPTS) {
      const elapsed = Date.now() - parseInt(lastAttempt);
      if (elapsed < BLOCK_DURATION) {
        setBlocked(true);
        setBlockTimeLeft(Math.ceil((BLOCK_DURATION - elapsed) / 1000));
        return;
      } else {
        localStorage.removeItem("nutricount_lastAttempt");
        localStorage.removeItem("nutricount_attempts");
      }
    }

    setAttempts(attemptCount);
    loadPin();
  }, []);

  // Countdown del bloqueo
  useEffect(() => {
    if (!blocked) return;
    
    const interval = setInterval(() => {
      setBlockTimeLeft((prev) => {
        if (prev <= 1) {
          setBlocked(false);
          localStorage.removeItem("nutricount_lastAttempt");
          localStorage.removeItem("nutricount_attempts");
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [blocked]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (blocked) {
      setError(`Demasiados intentos. Intenta en ${blockTimeLeft} segundos`);
      return;
    }

    if (!pinHash) {
      setError("PIN no configurado");
      return;
    }

    try {
      const isCorrect = await bcrypt.compare(pin, pinHash);
      
      if (isCorrect) {
        localStorage.removeItem("nutricount_lastAttempt");
        localStorage.removeItem("nutricount_attempts");
        localStorage.setItem("nutricount_auth", "true");
        onLogin();
      } else {
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);
        localStorage.setItem("nutricount_attempts", newAttempts.toString());
        
        if (newAttempts >= MAX_ATTEMPTS) {
          localStorage.setItem("nutricount_lastAttempt", Date.now().toString());
          setBlocked(true);
          setBlockTimeLeft(BLOCK_DURATION / 1000);
          setError(`PIN incorrecto. Bloqueado por 15 minutos. Intentos: ${newAttempts}/${MAX_ATTEMPTS}`);
        } else {
          setError(`PIN incorrecto. Intentos: ${newAttempts}/${MAX_ATTEMPTS}`);
        }
        setPin("");
      }
    } catch (err) {
      console.error("Error verificando PIN:", err);
      setError("Error al verificar el PIN");
    }
  };

  if (loading) {
    return (
      <div style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
      }}>
        <p className="small">Cargando...</p>
      </div>
    );
  }

  return (
    <div style={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      height: "100vh",
      background: "linear-gradient(180deg,var(--bg), rgba(0,0,0,0.02))",
    }}>
      <div className="card" style={{ maxWidth: 300, padding: 32 }}>
        <h2 style={{ textAlign: "center", marginTop: 0, marginBottom: 24 }}>
          Calculadora de Comida
        </h2>
        
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="field">
            <label style={{ textAlign: "center" }}>Ingresa tu PIN (6-8 dígitos)</label>
            <input
              type="password"
              className="input"
              inputMode="numeric"
              minLength="6"
              maxLength="8"
              value={pin}
              onChange={(e) => {
                setPin(e.target.value.replace(/[^0-9]/g, "").slice(0, 8));
                setError("");
              }}
              placeholder="••••••••"
              style={{ textAlign: "center", fontSize: "1.5rem", letterSpacing: "0.3em" }}
              autoFocus
              disabled={blocked}
            />
          </div>

          {error && (
            <div style={{ color: "#ff6b6b", fontSize: "0.9rem", textAlign: "center" }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            className="btn btn--primary"
            style={{ width: "100%" }}
            disabled={pin.length < 6 || blocked}
          >
            Entrar
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;
