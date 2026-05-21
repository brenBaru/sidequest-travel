import { useEffect, useMemo, useState } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
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

const dealTypes = ["Vuelo", "Hotel", "Actividad", "Paquete", "Seguro", "Traslado", "Otro"];
const dealStates = ["Visto", "Interesante", "Comparar", "Descartado"];

const formatAmount = (amount, currency) => `${amount || 0} ${currency}`;

export default function TripDetail({ trip, user, goBack }) {
  const [quests, setQuests] = useState([]);
  const [itineraryItems, setItineraryItems] = useState([]);
  const [deals, setDeals] = useState([]);

  const [activeTab, setActiveTab] = useState("new");
  const [activeCategory, setActiveCategory] = useState("Todas");
  const [activeState, setActiveState] = useState("Todos");
  const [searchTerm, setSearchTerm] = useState("");

  const [editingQuestId, setEditingQuestId] = useState(null);
  const [editForm, setEditForm] = useState(null);

  const [form, setForm] = useState({
    title: "",
    category: "Hoteles",
    price: "",
    currency: "USD",
    link: "",
    source: "Instagram",
    notes: ""
  });

  const [itineraryForm, setItineraryForm] = useState({
    dayLabel: "Día 1",
    title: "",
    time: "",
    relatedQuestId: "",
    notes: ""
  });

  const [dealForm, setDealForm] = useState({
    title: "",
    type: "Vuelo",
    price: "",
    currency: "USD",
    dateLabel: "",
    link: "",
    notes: "",
    state: "Visto"
  });

  const loadQuests = async () => {
    const questsQuery = query(collection(db, "quests"), where("tripId", "==", trip.id));
    const snapshot = await getDocs(questsQuery);
    const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    setQuests(data);
  };

  const loadItinerary = async () => {
    const itineraryQuery = query(collection(db, "itineraryItems"), where("tripId", "==", trip.id));
    const snapshot = await getDocs(itineraryQuery);
    const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    setItineraryItems(data);
  };

  const loadDeals = async () => {
    const dealsQuery = query(collection(db, "deals"), where("tripId", "==", trip.id));
    const snapshot = await getDocs(dealsQuery);
    const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    setDeals(data);
  };

  const loadAll = async () => {
    await Promise.all([loadQuests(), loadItinerary(), loadDeals()]);
  };

  useEffect(() => {
    loadAll();
  }, [trip.id]);

  const updateForm = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const updateEditForm = (field, value) => {
    setEditForm((prev) => ({ ...prev, [field]: value }));
  };

  const updateItineraryForm = (field, value) => {
    setItineraryForm((prev) => ({ ...prev, [field]: value }));
  };

  const updateDealForm = (field, value) => {
    setDealForm((prev) => ({ ...prev, [field]: value }));
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
    await updateDoc(doc(db, "quests", questId), { state, updatedAt: serverTimestamp() });
    loadQuests();
  };

  const startEditingQuest = (quest) => {
    setEditingQuestId(quest.id);
    setEditForm({
      title: quest.title || "",
      category: quest.category || "Hoteles",
      price: quest.price || "",
      currency: quest.currency || "USD",
      link: quest.link || "",
      source: quest.source || "Instagram",
      notes: quest.notes || ""
    });
  };

  const cancelEditingQuest = () => {
    setEditingQuestId(null);
    setEditForm(null);
  };

  const saveQuestEdit = async (questId) => {
    if (!editForm?.title?.trim()) return;

    await updateDoc(doc(db, "quests", questId), {
      title: editForm.title.trim(),
      category: editForm.category,
      price: editForm.price ? Number(editForm.price) : 0,
      currency: editForm.currency,
      link: editForm.link.trim(),
      source: editForm.source,
      notes: editForm.notes.trim(),
      updatedAt: serverTimestamp()
    });

    cancelEditingQuest();
    loadQuests();
  };

  const deleteQuest = async (questId) => {
    const shouldDelete = window.confirm("¿Eliminar esta quest? Esta acción no se puede deshacer.");
    if (!shouldDelete) return;

    await deleteDoc(doc(db, "quests", questId));
    loadQuests();
  };

  const addItineraryItem = async () => {
    if (!itineraryForm.title.trim()) return;

    const relatedQuest = quests.find((quest) => quest.id === itineraryForm.relatedQuestId);

    await addDoc(collection(db, "itineraryItems"), {
      tripId: trip.id,
      dayLabel: itineraryForm.dayLabel.trim() || "Día sin definir",
      title: itineraryForm.title.trim(),
      time: itineraryForm.time.trim(),
      relatedQuestId: itineraryForm.relatedQuestId || "",
      relatedQuestTitle: relatedQuest?.title || "",
      notes: itineraryForm.notes.trim(),
      createdBy: user.uid,
      createdByEmail: user.email,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    setItineraryForm({
      dayLabel: itineraryForm.dayLabel || "Día 1",
      title: "",
      time: "",
      relatedQuestId: "",
      notes: ""
    });

    loadItinerary();
  };

  const deleteItineraryItem = async (itemId) => {
    const shouldDelete = window.confirm("¿Eliminar esta actividad del itinerario?");
    if (!shouldDelete) return;

    await deleteDoc(doc(db, "itineraryItems", itemId));
    loadItinerary();
  };

  const addDeal = async () => {
    if (!dealForm.title.trim()) return;

    await addDoc(collection(db, "deals"), {
      tripId: trip.id,
      title: dealForm.title.trim(),
      type: dealForm.type,
      price: dealForm.price ? Number(dealForm.price) : 0,
      currency: dealForm.currency,
      dateLabel: dealForm.dateLabel.trim(),
      link: dealForm.link.trim(),
      notes: dealForm.notes.trim(),
      state: dealForm.state,
      createdBy: user.uid,
      createdByEmail: user.email,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    setDealForm({
      title: "",
      type: "Vuelo",
      price: "",
      currency: "USD",
      dateLabel: "",
      link: "",
      notes: "",
      state: "Visto"
    });

    loadDeals();
  };

  const deleteDeal = async (dealId) => {
    const shouldDelete = window.confirm("¿Eliminar esta oferta?");
    if (!shouldDelete) return;

    await deleteDoc(doc(db, "deals", dealId));
    loadDeals();
  };

  const convertDealToQuest = async (deal) => {
    await addDoc(collection(db, "quests"), {
      tripId: trip.id,
      title: deal.title,
      category: deal.type === "Vuelo" ? "Vuelos" : deal.type === "Hotel" ? "Hoteles" : "Otros",
      price: deal.price || 0,
      currency: deal.currency || "USD",
      link: deal.link || "",
      source: "Deal tracker",
      notes: deal.notes || "",
      state: "evaluating",
      createdBy: user.uid,
      createdByEmail: user.email,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    await loadQuests();
    setActiveTab("log");
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

    const byCategory = {};

    quests.forEach((quest) => {
      const state = quest.state || "discovered";
      const currency = quest.currency || "USD";
      const price = quest.price || 0;
      const category = quest.category || "Otros";

      if (totals[state]) {
        totals[state][currency] = (totals[state][currency] || 0) + price;
      }

      if (state === "main") {
        if (!byCategory[category]) {
          byCategory[category] = { USD: 0, ARS: 0 };
        }

        byCategory[category][currency] = (byCategory[category][currency] || 0) + price;
      }
    });

    return { totals, byCategory };
  }, [quests]);

  const mainTotalUSD = budget.totals.main.USD;
  const mainTotalARS = budget.totals.main.ARS;

  const possibleTotalUSD = budget.totals.main.USD + budget.totals.evaluating.USD;
  const possibleTotalARS = budget.totals.main.ARS + budget.totals.evaluating.ARS;

  const exploratoryTotalUSD =
    budget.totals.main.USD + budget.totals.evaluating.USD + budget.totals.discovered.USD;

  const exploratoryTotalARS =
    budget.totals.main.ARS + budget.totals.evaluating.ARS + budget.totals.discovered.ARS;

  const budgetTarget = trip.budgetTarget || 0;
  const budgetCurrency = trip.currency || "USD";
  const selectedTotalForTarget = budgetCurrency === "ARS" ? mainTotalARS : mainTotalUSD;
  const budgetDifference = budgetTarget - selectedTotalForTarget;
  const questLabel = quests.length === 1 ? "quest" : "quests";

  const sortedItineraryItems = useMemo(() => {
    return [...itineraryItems].sort((a, b) => {
      const dayCompare = (a.dayLabel || "").localeCompare(b.dayLabel || "");
      if (dayCompare !== 0) return dayCompare;
      return (a.time || "").localeCompare(b.time || "");
    });
  }, [itineraryItems]);

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
          <span>💰 {budgetTarget} {budgetCurrency} objetivo</span>
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
          <button className={activeTab === "new" ? "detail-tab active" : "detail-tab"} onClick={() => setActiveTab("new")}>＋ Nueva quest</button>
          <button className={activeTab === "log" ? "detail-tab active" : "detail-tab"} onClick={() => setActiveTab("log")}>🧾 Quest log</button>
          <button className={activeTab === "budget" ? "detail-tab active" : "detail-tab"} onClick={() => setActiveTab("budget")}>💰 Budget</button>
          <button className={activeTab === "itinerary" ? "detail-tab active" : "detail-tab"} onClick={() => setActiveTab("itinerary")}>🗺️ Itinerary</button>
          <button className={activeTab === "deals" ? "detail-tab active" : "detail-tab"} onClick={() => setActiveTab("deals")}>🏷️ Deals</button>
        </nav>

        {activeTab === "new" && (
          <article className="tab-panel new-quest-panel">
            <div className="tab-panel-header">
              <div>
                <p className="eyebrow">New side quest</p>
                <h3>Agregar idea</h3>
              </div>
              <p>Cargá hoteles, vuelos, actividades, restaurantes, links o ideas sueltas para evaluar después.</p>
            </div>

            <div className="quest-form-grid">
              <label>
                <span>Título</span>
                <input placeholder="Ej: Hotel cerca de Universal" value={form.title} onChange={(e) => updateForm("title", e.target.value)} />
              </label>

              <label>
                <span>Categoría</span>
                <select value={form.category} onChange={(e) => updateForm("category", e.target.value)}>
                  {categories.map((category) => <option key={category} value={category}>{category}</option>)}
                </select>
              </label>

              <label>
                <span>Precio</span>
                <input placeholder="Ej: 120" type="number" value={form.price} onChange={(e) => updateForm("price", e.target.value)} />
              </label>

              <label>
                <span>Moneda</span>
                <select value={form.currency} onChange={(e) => updateForm("currency", e.target.value)}>
                  <option value="USD">USD</option>
                  <option value="ARS">ARS</option>
                </select>
              </label>

              <label>
                <span>Fuente</span>
                <select value={form.source} onChange={(e) => updateForm("source", e.target.value)}>
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
                <input placeholder="Pegá el link" value={form.link} onChange={(e) => updateForm("link", e.target.value)} />
              </label>
            </div>

            <label className="quest-notes-field">
              <span>Notas</span>
              <textarea placeholder="Comentarios, dudas, ubicación, condiciones, etc." value={form.notes} onChange={(e) => updateForm("notes", e.target.value)} />
            </label>

            <button className="add-quest-button" onClick={addQuest}>Agregar quest</button>
          </article>
        )}

        {activeTab === "log" && (
          <article className="tab-panel quest-log-panel">
            <div className="quest-log-header">
              <div>
                <p className="eyebrow">Quest log</p>
                <h3>Ideas guardadas</h3>
                <p className="quest-log-subtitle">Revisá las ideas cargadas, filtrá por categoría o estado y mové cada quest según avance la planificación.</p>
              </div>
              <div className="quest-log-counter">{visibleQuests.length} de {quests.length}</div>
            </div>

            <div className="quest-log-toolbar">
              <label>
                <span>Buscar</span>
                <input placeholder="Buscar por hotel, vuelo, fuente, notas..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              </label>

              <label>
                <span>Categoría</span>
                <select value={activeCategory} onChange={(e) => setActiveCategory(e.target.value)}>
                  <option value="Todas">Todas</option>
                  {categories.map((category) => <option key={category} value={category}>{category}</option>)}
                </select>
              </label>

              <label>
                <span>Estado</span>
                <select value={activeState} onChange={(e) => setActiveState(e.target.value)}>
                  <option value="Todos">Todos</option>
                  {states.map((state) => <option key={state.value} value={state.value}>{state.icon} {state.label}</option>)}
                </select>
              </label>
            </div>

            {visibleQuests.length === 0 ? (
              <div className="quest-empty-state">
                <span>🧾</span>
                <p>No hay quests que coincidan con los filtros actuales.</p>
                {(searchTerm || activeCategory !== "Todas" || activeState !== "Todos") && (
                  <button className="state-button" onClick={() => { setSearchTerm(""); setActiveCategory("Todas"); setActiveState("Todos"); }}>
                    Limpiar filtros
                  </button>
                )}
              </div>
            ) : (
              <div className="quest-cards-list">
                {visibleQuests.map((quest) => {
                  const currentState = states.find((state) => state.value === quest.state) || states[0];
                  const isEditing = editingQuestId === quest.id;

                  return (
                    <article key={quest.id} className={`detail-quest-card state-${quest.state || "discovered"}`}>
                      {isEditing ? (
                        <div className="edit-quest-panel">
                          <div className="quest-form-grid">
                            <label>
                              <span>Título</span>
                              <input value={editForm.title} onChange={(e) => updateEditForm("title", e.target.value)} />
                            </label>
                            <label>
                              <span>Categoría</span>
                              <select value={editForm.category} onChange={(e) => updateEditForm("category", e.target.value)}>
                                {categories.map((category) => <option key={category} value={category}>{category}</option>)}
                              </select>
                            </label>
                            <label>
                              <span>Precio</span>
                              <input type="number" value={editForm.price} onChange={(e) => updateEditForm("price", e.target.value)} />
                            </label>
                            <label>
                              <span>Moneda</span>
                              <select value={editForm.currency} onChange={(e) => updateEditForm("currency", e.target.value)}>
                                <option value="USD">USD</option>
                                <option value="ARS">ARS</option>
                              </select>
                            </label>
                            <label>
                              <span>Fuente</span>
                              <input value={editForm.source} onChange={(e) => updateEditForm("source", e.target.value)} />
                            </label>
                            <label>
                              <span>Link</span>
                              <input value={editForm.link} onChange={(e) => updateEditForm("link", e.target.value)} />
                            </label>
                          </div>
                          <label className="quest-notes-field">
                            <span>Notas</span>
                            <textarea value={editForm.notes} onChange={(e) => updateEditForm("notes", e.target.value)} />
                          </label>
                          <div className="inline-actions">
                            <button onClick={() => saveQuestEdit(quest.id)}>Guardar</button>
                            <button className="state-button" onClick={cancelEditingQuest}>Cancelar</button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="detail-quest-top">
                            <div className="detail-quest-main">
                              <div className="quest-card-meta-row">
                                <span className="quest-category-pill">{quest.category || "Otros"}</span>
                                <span className={`quest-state-pill state-${quest.state || "discovered"}`}>{currentState.icon} {currentState.label}</span>
                              </div>
                              <h4>{quest.title}</h4>
                              <p>Fuente: {quest.source || "Pendiente"}</p>
                            </div>

                            <div className="detail-quest-price">
                              <strong>{quest.price || 0}</strong>
                              <span>{quest.currency || "USD"}</span>
                            </div>
                          </div>

                          {quest.notes && <p className="detail-quest-notes">{quest.notes}</p>}

                          <div className="quest-card-footer">
                            {quest.link ? <a className="detail-quest-link" href={quest.link} target="_blank" rel="noreferrer">🔗 Abrir link</a> : <span className="quest-no-link">Sin link cargado</span>}

                            <div className="detail-state-actions">
                              {states.map((state) => (
                                <button key={state.value} className={quest.state === state.value ? "state-button active" : "state-button"} onClick={() => changeState(quest.id, state.value)}>
                                  {state.icon} {state.label}
                                </button>
                              ))}
                              <button className="state-button" onClick={() => startEditingQuest(quest)}>Editar</button>
                              <button className="danger-button" onClick={() => deleteQuest(quest.id)}>Eliminar</button>
                            </div>
                          </div>
                        </>
                      )}
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
              <p>Los montos se calculan según el estado de cada quest. Main Quest representa lo elegido.</p>
            </div>

            <div className="budget-summary-card">
              <span>Presupuesto objetivo</span>
              <strong>{formatAmount(budgetTarget, budgetCurrency)}</strong>
              <p className={budgetDifference >= 0 ? "budget-ok" : "budget-over"}>
                {budgetDifference >= 0 ? "Disponible" : "Excedido"}: {formatAmount(Math.abs(budgetDifference), budgetCurrency)}
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

            <div className="budget-category-list">
              <h4>Totales elegidos por categoría</h4>
              {Object.keys(budget.byCategory).length === 0 ? (
                <p className="quest-no-link">Todavía no hay quests marcadas como Main Quest.</p>
              ) : (
                Object.entries(budget.byCategory).map(([category, totals]) => (
                  <div key={category} className="budget-category-row">
                    <span>{category}</span>
                    <strong>{totals.USD || 0} USD · {totals.ARS || 0} ARS</strong>
                  </div>
                ))
              )}
            </div>
          </article>
        )}

        {activeTab === "itinerary" && (
          <article className="tab-panel itinerary-panel">
            <div className="tab-panel-header">
              <div>
                <p className="eyebrow">Main quest route</p>
                <h3>Itinerario</h3>
              </div>
              <p>Armá una primera simulación día por día y vinculá actividades con quests ya cargadas.</p>
            </div>

            <div className="itinerary-form-grid">
              <label>
                <span>Día</span>
                <input value={itineraryForm.dayLabel} onChange={(e) => updateItineraryForm("dayLabel", e.target.value)} placeholder="Día 1" />
              </label>
              <label>
                <span>Horario</span>
                <input value={itineraryForm.time} onChange={(e) => updateItineraryForm("time", e.target.value)} placeholder="09:00 / Mañana" />
              </label>
              <label>
                <span>Actividad</span>
                <input value={itineraryForm.title} onChange={(e) => updateItineraryForm("title", e.target.value)} placeholder="Ej: Universal Studios" />
              </label>
              <label>
                <span>Quest vinculada</span>
                <select value={itineraryForm.relatedQuestId} onChange={(e) => updateItineraryForm("relatedQuestId", e.target.value)}>
                  <option value="">Sin vincular</option>
                  {quests.map((quest) => <option key={quest.id} value={quest.id}>{quest.title}</option>)}
                </select>
              </label>
            </div>

            <label className="quest-notes-field">
              <span>Notas</span>
              <textarea value={itineraryForm.notes} onChange={(e) => updateItineraryForm("notes", e.target.value)} placeholder="Reservas, traslados, duración estimada, etc." />
            </label>

            <button className="add-quest-button" onClick={addItineraryItem}>Agregar al itinerario</button>

            <div className="simple-list">
              {sortedItineraryItems.length === 0 ? (
                <p className="quest-no-link">Todavía no hay actividades en el itinerario.</p>
              ) : (
                sortedItineraryItems.map((item) => (
                  <article key={item.id} className="simple-list-card">
                    <div>
                      <span>{item.dayLabel} {item.time ? `· ${item.time}` : ""}</span>
                      <h4>{item.title}</h4>
                      {item.relatedQuestTitle && <p>Quest: {item.relatedQuestTitle}</p>}
                      {item.notes && <p>{item.notes}</p>}
                    </div>
                    <button className="danger-button" onClick={() => deleteItineraryItem(item.id)}>Eliminar</button>
                  </article>
                ))
              )}
            </div>
          </article>
        )}

        {activeTab === "deals" && (
          <article className="tab-panel deals-panel">
            <div className="tab-panel-header">
              <div>
                <p className="eyebrow">Deal tracker</p>
                <h3>Ofertas y fechas clave</h3>
              </div>
              <p>Guardá vuelos, hoteles baratos, promos y eventos tipo Hot Sale, Black Friday o Travel Sale.</p>
            </div>

            <div className="deal-form-grid">
              <label>
                <span>Título</span>
                <input value={dealForm.title} onChange={(e) => updateDealForm("title", e.target.value)} placeholder="Ej: Hot Sale vuelos Miami" />
              </label>
              <label>
                <span>Tipo</span>
                <select value={dealForm.type} onChange={(e) => updateDealForm("type", e.target.value)}>
                  {dealTypes.map((type) => <option key={type}>{type}</option>)}
                </select>
              </label>
              <label>
                <span>Precio</span>
                <input type="number" value={dealForm.price} onChange={(e) => updateDealForm("price", e.target.value)} placeholder="Ej: 850" />
              </label>
              <label>
                <span>Moneda</span>
                <select value={dealForm.currency} onChange={(e) => updateDealForm("currency", e.target.value)}>
                  <option value="USD">USD</option>
                  <option value="ARS">ARS</option>
                </select>
              </label>
              <label>
                <span>Fecha/evento</span>
                <input value={dealForm.dateLabel} onChange={(e) => updateDealForm("dateLabel", e.target.value)} placeholder="Black Friday / Hot Sale / 20-11" />
              </label>
              <label>
                <span>Estado</span>
                <select value={dealForm.state} onChange={(e) => updateDealForm("state", e.target.value)}>
                  {dealStates.map((state) => <option key={state}>{state}</option>)}
                </select>
              </label>
            </div>

            <label className="quest-notes-field">
              <span>Link</span>
              <input value={dealForm.link} onChange={(e) => updateDealForm("link", e.target.value)} placeholder="Pegá el link de la promo" />
            </label>

            <label className="quest-notes-field">
              <span>Notas</span>
              <textarea value={dealForm.notes} onChange={(e) => updateDealForm("notes", e.target.value)} placeholder="Condiciones, equipaje, cuotas, banco, vencimiento, etc." />
            </label>

            <button className="add-quest-button" onClick={addDeal}>Agregar oferta</button>

            <div className="simple-list">
              {deals.length === 0 ? (
                <p className="quest-no-link">Todavía no hay ofertas cargadas.</p>
              ) : (
                deals.map((deal) => (
                  <article key={deal.id} className="simple-list-card">
                    <div>
                      <span>{deal.type} · {deal.state}</span>
                      <h4>{deal.title}</h4>
                      <p>{deal.price || 0} {deal.currency || "USD"} {deal.dateLabel ? `· ${deal.dateLabel}` : ""}</p>
                      {deal.notes && <p>{deal.notes}</p>}
                      {deal.link && <a href={deal.link} target="_blank" rel="noreferrer">🔗 Abrir link</a>}
                    </div>
                    <div className="inline-actions">
                      <button className="state-button" onClick={() => convertDealToQuest(deal)}>Pasar a quest</button>
                      <button className="danger-button" onClick={() => deleteDeal(deal.id)}>Eliminar</button>
                    </div>
                  </article>
                ))
              )}
            </div>
          </article>
        )}
      </section>
    </main>
  );
}
