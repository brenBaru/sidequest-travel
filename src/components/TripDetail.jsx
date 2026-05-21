import { useEffect, useMemo, useState } from "react";
import {
  addDoc,
  collection,
  doc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where
} from "firebase/firestore";
import { db } from "../firebase";

const categories = [
  "Hoteles",
  "Vuelos",
  "Actividades",
  "Comida",
  "Traslados",
  "Otros"
];

const states = [
  { value: "discovered", label: "Discovered", icon: "🟣" },
  { value: "evaluating", label: "Evaluating", icon: "🟡" },
  { value: "main", label: "Main Quest", icon: "🟢" },
  { value: "abandoned", label: "Abandoned", icon: "🔴" }
];

export default function TripDetail({ trip, user, goBack }) {
  const [quests, setQuests] = useState([]);
  const [activeTab, setActiveTab] = useState("new");
  const [activeCategory, setActiveCategory] = useState("Todas");
  const [activeState, setActiveState] = useState("Todos");
  const [searchTerm, setSearchTerm] = useState("");

  const [form, setForm] = useState({
    title: "",
    category: "Hoteles",
    price: "",
    currency: "USD",
    link: "",
    source: "Instagram",
    notes: ""
  });

  const loadQuests = async () => {
    const questsQuery = query(
      collection(db, "quests"),
      where("tripId", "==", trip.id)
    );

    const snapshot = await getDocs(questsQuery);

    const data = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data()
    }));

    setQuests(data);
  };

  useEffect(() => {
    loadQuests();
  }, [trip.id]);

  const updateForm = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const addQuest = async () => {
    if (!form.title.trim()) return;

    await addDoc(collection(db, "quests"), {
      tripId: trip.id,
      title: form.title.trim(),
      category: form.category,
      price: form.price ? Number(form.price) : 0,
      currency: form.currency,
      link: form.link.trim(),
      source: form.source,
      notes: form.notes.trim(),
      state: "discovered",
      createdBy: user.uid,
      createdByEmail: user.email,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    setForm({
      title: "",
      category: "Hoteles",
      price: "",
      currency: "USD",
      link: "",
      source: "Instagram",
      notes: ""
    });

    await loadQuests();
    setActiveTab("log");
  };

  const changeState = async (questId, state) => {
    await updateDoc(doc(db, "quests", questId), {
      state,
      updatedAt: serverTimestamp()
    });

    loadQuests();
  };

  const visibleQuests = useMemo(() => {
    let filtered = [...quests];

    if (activeCategory !== "Todas") {
      filtered = filtered.filter((quest) => quest.category === activeCategory);
    }

    if (activeState !== "Todos") {
      filtered = filtered.filter((quest) => quest.state === activeState);
    }

    if (searchTerm.trim()) {
      const normalizedSearch = searchTerm.trim().toLowerCase();

      filtered = filtered.filter((quest) => {
        const searchableText = [
          quest.title,
          quest.category,
          quest.source,
          quest.notes,
          quest.link,
          quest.currency,
          quest.state
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return searchableText.includes(normalizedSearch);
      });
    }

    return filtered;
  }, [quests, activeCategory, activeState, searchTerm]);

  const questsByState = useMemo(() => {
    return {
      discovered: quests.filter((q) => q.state === "discovered").length,
      evaluating: quests.filter((q) => q.state === "evaluating").length,
      main: quests.filter((q) => q.state === "main").length,
      abandoned: quests.filter((q) => q.state === "abandoned").length
    };
  }, [quests]);

  const budget = useMemo(() => {
    const totals = {
      main: { USD: 0, ARS: 0 },
      evaluating: { USD: 0, ARS: 0 },
      discovered: { USD: 0, ARS: 0 }
    };

    quests.forEach((quest) => {
      const state = quest.state || "discovered";
      const currency = quest.currency || "USD";
      const price = quest.price || 0;

      if (totals[state]) {
        totals[state][currency] = (totals[state][currency] || 0) + price;
      }
    });

    return totals;
  }, [quests]);

  const mainTotalUSD = budget.main.USD;
  const mainTotalARS = budget.main.ARS;

  const possibleTotalUSD = budget.main.USD + budget.evaluating.USD;
  const possibleTotalARS = budget.main.ARS + budget.evaluating.ARS;

  const exploratoryTotalUSD =
    budget.main.USD + budget.evaluating.USD + budget.discovered.USD;

  const exploratoryTotalARS =
    budget.main.ARS + budget.evaluating.ARS + budget.discovered.ARS;

  const questLabel = quests.length === 1 ? "quest" : "quests";

  return (
    <main className="trip-detail-page">
      <button className="detail-back-button" onClick={goBack}>
        ← Volver a mis viajes
      </button>

      <section className="detail-hero-card">
        <div>
          <p className="eyebrow">Current campaign</p>
          <h2>{trip.name}</h2>
          <p>{trip.destination || "Destino pendiente"}</p>
        </div>

        <div className="detail-hero-meta">
          <span>🧭 {quests.length} {questLabel}</span>
          <span>
            💰 {trip.budgetTarget || 0} {trip.currency || "USD"} objetivo
          </span>
        </div>
      </section>

      <section className="detail-stats-grid">
        <article className="detail-stat-card">
          <span>🟢 Main Quest</span>
          <strong>{questsByState.main}</strong>
        </article>

        <article className="detail-stat-card">
          <span>🟡 Evaluating</span>
          <strong>{questsByState.evaluating}</strong>
        </article>

        <article className="detail-stat-card">
          <span>💵 USD elegido</span>
          <strong>{mainTotalUSD}</strong>
        </article>

        <article className="detail-stat-card">
          <span>💸 ARS elegido</span>
          <strong>{mainTotalARS}</strong>
        </article>
      </section>

      <section className="detail-tabs-card">
        <nav className="detail-tabs">
          <button
            className={activeTab === "new" ? "detail-tab active" : "detail-tab"}
            onClick={() => setActiveTab("new")}
          >
            ＋ Nueva quest
          </button>

          <button
            className={activeTab === "log" ? "detail-tab active" : "detail-tab"}
            onClick={() => setActiveTab("log")}
          >
            🧾 Quest log
          </button>

          <button
            className={activeTab === "budget" ? "detail-tab active" : "detail-tab"}
            onClick={() => setActiveTab("budget")}
          >
            💰 Budget
          </button>
        </nav>

        {activeTab === "new" && (
          <article className="tab-panel new-quest-panel">
            <div className="tab-panel-header">
              <div>
                <p className="eyebrow">New side quest</p>
                <h3>Agregar idea</h3>
              </div>
              <p>
                Cargá hoteles, vuelos, actividades, restaurantes, links o ideas
                sueltas para evaluar después.
              </p>
            </div>

            <div className="quest-form-grid">
              <label>
                <span>Título</span>
                <input
                  placeholder="Ej: Hotel cerca de Universal"
                  value={form.title}
                  onChange={(e) => updateForm("title", e.target.value)}
                />
              </label>

              <label>
                <span>Categoría</span>
                <select
                  value={form.category}
                  onChange={(e) => updateForm("category", e.target.value)}
                >
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span>Precio</span>
                <input
                  placeholder="Ej: 120"
                  type="number"
                  value={form.price}
                  onChange={(e) => updateForm("price", e.target.value)}
                />
              </label>

              <label>
                <span>Moneda</span>
                <select
                  value={form.currency}
                  onChange={(e) => updateForm("currency", e.target.value)}
                >
                  <option value="USD">USD</option>
                  <option value="ARS">ARS</option>
                </select>
              </label>

              <label>
                <span>Fuente</span>
                <select
                  value={form.source}
                  onChange={(e) => updateForm("source", e.target.value)}
                >
                  <option>Instagram</option>
                  <option>TikTok</option>
                  <option>YouTube</option>
                  <option>Booking</option>
                  <option>Airbnb</option>
                  <option>Google Maps</option>
                  <option>Web</option>
                  <option>Recomendación</option>
                  <option>Otro</option>
                </select>
              </label>

              <label>
                <span>Link</span>
                <input
                  placeholder="Pegá el link"
                  value={form.link}
                  onChange={(e) => updateForm("link", e.target.value)}
                />
              </label>
            </div>

            <label className="quest-notes-field">
              <span>Notas</span>
              <textarea
                placeholder="Comentarios, dudas, ubicación, condiciones, etc."
                value={form.notes}
                onChange={(e) => updateForm("notes", e.target.value)}
              />
            </label>

            <button className="add-quest-button" onClick={addQuest}>
              Agregar quest
            </button>
          </article>
        )}

        {activeTab === "log" && (
          <article className="tab-panel quest-log-panel">
            <div className="quest-log-header">
              <div>
                <p className="eyebrow">Quest log</p>
                <h3>Ideas guardadas</h3>
                <p className="quest-log-subtitle">
                  Revisá las ideas cargadas, filtrá por categoría o estado y mové cada
                  quest según avance la planificación.
                </p>
              </div>

              <div className="quest-log-counter">
                {visibleQuests.length} de {quests.length}
              </div>
            </div>

            <div className="quest-log-toolbar">
              <label>
                <span>Buscar</span>
                <input
                  placeholder="Buscar por hotel, vuelo, fuente, notas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </label>

              <label>
                <span>Categoría</span>
                <select
                  value={activeCategory}
                  onChange={(e) => setActiveCategory(e.target.value)}
                >
                  <option value="Todas">Todas</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span>Estado</span>
                <select
                  value={activeState}
                  onChange={(e) => setActiveState(e.target.value)}
                >
                  <option value="Todos">Todos</option>
                  {states.map((state) => (
                    <option key={state.value} value={state.value}>
                      {state.icon} {state.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {visibleQuests.length === 0 ? (
              <div className="quest-empty-state">
                <span>🧾</span>
                <p>No hay quests que coincidan con los filtros actuales.</p>

                {(searchTerm || activeCategory !== "Todas" || activeState !== "Todos") && (
                  <button
                    className="state-button"
                    onClick={() => {
                      setSearchTerm("");
                      setActiveCategory("Todas");
                      setActiveState("Todos");
                    }}
                  >
                    Limpiar filtros
                  </button>
                )}
              </div>
            ) : (
              <div className="quest-cards-list">
                {visibleQuests.map((quest) => {
                  const currentState =
                    states.find((state) => state.value === quest.state) ||
                    states[0];

                  return (
                    <article
                      key={quest.id}
                      className={`detail-quest-card state-${
                        quest.state || "discovered"
                      }`}
                    >
                      <div className="detail-quest-top">
                        <div className="detail-quest-main">
                          <div className="quest-card-meta-row">
                            <span className="quest-category-pill">
                              {quest.category || "Otros"}
                            </span>

                            <span className={`quest-state-pill state-${quest.state || "discovered"}`}>
                              {currentState.icon} {currentState.label}
                            </span>
                          </div>

                          <h4>{quest.title}</h4>

                          <p>Fuente: {quest.source || "Pendiente"}</p>
                        </div>

                        <div className="detail-quest-price">
                          <strong>{quest.price || 0}</strong>
                          <span>{quest.currency || "USD"}</span>
                        </div>
                      </div>

                      {quest.notes && (
                        <p className="detail-quest-notes">{quest.notes}</p>
                      )}

                      <div className="quest-card-footer">
                        {quest.link ? (
                          <a
                            className="detail-quest-link"
                            href={quest.link}
                            target="_blank"
                            rel="noreferrer"
                          >
                            🔗 Abrir link
                          </a>
                        ) : (
                          <span className="quest-no-link">Sin link cargado</span>
                        )}

                        <div className="detail-state-actions">
                          {states.map((state) => (
                            <button
                              key={state.value}
                              className={
                                quest.state === state.value
                                  ? "state-button active"
                                  : "state-button"
                              }
                              onClick={() => changeState(quest.id, state.value)}
                            >
                              {state.icon} {state.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </article>
        )}

        {activeTab === "budget" && (
          <article className="tab-panel budget-panel">
            <div className="tab-panel-header">
              <div>
                <p className="eyebrow">Budget simulation</p>
                <h3>Simulación de presupuesto</h3>
              </div>
              <p>
                Los montos se calculan según el estado de cada quest. Main
                Quest representa lo elegido.
              </p>
            </div>

            <div className="budget-grid">
              <div className="budget-card main-budget">
                <span>🟢 Elegido</span>
                <strong>{mainTotalUSD} USD</strong>
                <strong>{mainTotalARS} ARS</strong>
                <p>Solo quests marcadas como Main Quest.</p>
              </div>

              <div className="budget-card">
                <span>🟡 Posible</span>
                <strong>{possibleTotalUSD} USD</strong>
                <strong>{possibleTotalARS} ARS</strong>
                <p>Main Quest + Evaluating.</p>
              </div>

              <div className="budget-card">
                <span>🟣 Exploratorio</span>
                <strong>{exploratoryTotalUSD} USD</strong>
                <strong>{exploratoryTotalARS} ARS</strong>
                <p>Main Quest + Evaluating + Discovered.</p>
              </div>
            </div>
          </article>
        )}
      </section>
    </main>
  );
}
