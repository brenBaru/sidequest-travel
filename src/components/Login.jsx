import { useState } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup
} from "firebase/auth";
import { auth } from "../firebase";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const login = async () => {
    try {
      setError("");
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      setError("No se pudo iniciar sesión. Revisá email y contraseña.");
    }
  };

  const register = async () => {
    try {
      setError("");
      await createUserWithEmailAndPassword(auth, email, password);
    } catch (err) {
      setError("No se pudo crear la cuenta. Revisá los datos ingresados.");
    }
  };

  const loginWithGoogle = async () => {
    try {
      setError("");
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err) {
      setError("No se pudo iniciar sesión con Google.");
    }
  };

  return (
    <main className="login-page">
      <section className="login-card">
        <div className="login-brand">
          <p className="eyebrow">Welcome, traveller</p>

          <div className="brand-title-row">
            <span className="brand-icon">🧭</span>
            <h1>SideQuest Travel</h1>
          </div>

          <p className="login-description">
            Guardá ideas, links, presupuesto e itinerario para tus próximas
            aventuras. Armá tu viaje como una campaña: descubrí quests,
            evaluá opciones y elegí tu main quest.
          </p>

          <div className="feature-grid">
            <div className="feature-pill">
              <span>🧾</span>
              <strong>Quest log</strong>
              <small>Hoteles, vuelos y actividades</small>
            </div>

            <div className="feature-pill">
              <span>💰</span>
              <strong>Budget</strong>
              <small>ARS / USD por categoría</small>
            </div>

            <div className="feature-pill">
              <span>🗺️</span>
              <strong>Itinerary</strong>
              <small>Planificá día por día</small>
            </div>

            <div className="feature-pill">
              <span>🤝</span>
              <strong>Party</strong>
              <small>Preparado para viajes compartidos</small>
            </div>
          </div>
        </div>

        <div className="login-form-panel">
          <div className="login-form-header">
            <p className="eyebrow">Access portal</p>
            <h2>Entrar a tu tablero</h2>
            <p className="muted">
              Usá tu cuenta para ver tus viajes desde la compu o el celular.
            </p>
          </div>

          <button className="google-button" onClick={loginWithGoogle}>
            <span>G</span>
            Continuar con Google
          </button>

          <div className="divider">
            <span>o entrar con email</span>
          </div>

          <div className="form-grid">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <input
              type="password"
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && <p className="error-message">{error}</p>}

          <div className="button-row">
            <button onClick={login}>Entrar</button>
            <button className="secondary-button" onClick={register}>
              Crear cuenta
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}