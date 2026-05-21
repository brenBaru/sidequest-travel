import { useEffect, useState } from "react";
import {
  addDoc,
  collection,
  getDocs,
  query,
  serverTimestamp,
  where
} from "firebase/firestore";
import { db } from "../firebase";

export default function Trips({ user, onSelectTrip }) {
  const [trips, setTrips] = useState([]);
  const [name, setName] = useState("");
  const [destination, setDestination] = useState("");
  const [budgetTarget, setBudgetTarget] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [loading, setLoading] = useState(true);

  const loadTrips = async () => {
    setLoading(true);

    const tripsQuery = query(
      collection(db, "trips"),
      where("ownerId", "==", user.uid)
    );

    const snapshot = await getDocs(tripsQuery);

    const data = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data()
    }));

    setTrips(data);
    setLoading(false);
  };

  useEffect(() => {
    loadTrips();
  }, [user.uid]);

  const createTrip = async () => {
    if (!name.trim()) return;

    await addDoc(collection(db, "trips"), {
      name: name.trim(),
      destination: destination.trim(),
      budgetTarget: budgetTarget ? Number(budgetTarget) : 0,
      currency,
      ownerId: user.uid,
      ownerEmail: user.email,
      members: { [user.uid]: "owner" },
      type: "private",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    setName("");
    setDestination("");
    setBudgetTarget("");
    setCurrency("USD");
    loadTrips();
  };

  return (
    <main className="trips-page">
      <section className="trips-hero-card">
        <div>
          <p className="eyebrow">Quest board</p>
          <h2>Mis viajes</h2>
          <p>
            Organizá ideas, links, hoteles, vuelos, actividades y presupuesto
            antes de convertirlas en tu main quest.
          </p>
        </div>

        <div className="trips-hero-badges">
          <span>🧾 Quests</span>
          <span>💰 Budget</span>
          <span>🗺️ Itinerary</span>
        </div>
      </section>

      <section className="trip-create-card">
        <div className="trip-create-header">
          <div>
            <p className="eyebrow">New campaign</p>
            <h3>Crear viaje</h3>
          </div>
          <span className="trip-create-icon">＋</span>
        </div>

        <div className="trip-form-grid">
          <label>
            <span>Nombre</span>
            <input
              placeholder="Ej: Disney + Universal + West Coast"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>

          <label>
            <span>Destino</span>
            <input
              placeholder="Ej: EEUU"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
            />
          </label>

          <label>
            <span>Presupuesto objetivo</span>
            <input
              placeholder="Ej: 6000"
              type="number"
              value={budgetTarget}
              onChange={(e) => setBudgetTarget(e.target.value)}
            />
          </label>

          <label>
            <span>Moneda</span>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
            >
              <option value="USD">USD</option>
              <option value="ARS">ARS</option>
            </select>
          </label>
        </div>

        <button className="create-trip-button" onClick={createTrip}>
          Crear viaje
        </button>
      </section>

      <section className="trips-saved-card">
        <div className="trips-saved-header">
          <div>
            <p className="eyebrow">Saved campaigns</p>
            <h3>Viajes guardados</h3>
          </div>
          <span>{trips.length} viaje{trips.length === 1 ? "" : "s"}</span>
        </div>

        {loading ? (
          <p className="trips-empty">Cargando viajes...</p>
        ) : trips.length === 0 ? (
          <p className="trips-empty">
            Todavía no hay viajes. Creá el primero para empezar.
          </p>
        ) : (
          <div className="saved-trips-grid">
            {trips.map((trip) => (
              <button
                key={trip.id}
                className="saved-trip-card"
                onClick={() => onSelectTrip(trip)}
              >
                <div className="saved-trip-main">
                  <span className="saved-trip-icon">🧭</span>
                  <div>
                    <h4>{trip.name}</h4>
                    <p>{trip.destination || "Destino pendiente"}</p>
                  </div>
                </div>

                <div className="saved-trip-budget">
                  <strong>{trip.budgetTarget || 0}</strong>
                  <span>{trip.currency || "USD"}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}