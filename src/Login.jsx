import { useState } from "react";

function Login({ onLogin }) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const correctPin = import.meta.env.VITE_APP_PIN;
    
    if (!correctPin) {
      setError("PIN no configurado. Configura VITE_APP_PIN en .env.local");
      return;
    }

    if (pin === correctPin) {
      localStorage.setItem("nutricount_auth", "true");
      onLogin();
    } else {
      setError("PIN incorrecto");
      setPin("");
    }
  };

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
            <label style={{ textAlign: "center" }}>Ingresa tu PIN (4 dígitos)</label>
            <input
              type="password"
              className="input"
              inputMode="numeric"
              maxLength="4"
              pattern="[0-9]{4}"
              value={pin}
              onChange={(e) => {
                setPin(e.target.value.replace(/[^0-9]/g, "").slice(0, 4));
                setError("");
              }}
              placeholder="0000"
              style={{ textAlign: "center", fontSize: "1.5rem", letterSpacing: "0.5em" }}
              autoFocus
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
            disabled={pin.length !== 4}
          >
            Entrar
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;
