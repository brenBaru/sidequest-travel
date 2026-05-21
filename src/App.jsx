import { useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "./firebase";
import Login from "./components/Login";
import Trips from "./components/Trips";
import TripDetail from "./components/TripDetail";

function App() {
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [selectedTrip, setSelectedTrip] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoadingUser(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    setSelectedTrip(null);
  };

  if (loadingUser) {
    return <div className="loading">Cargando aventura...</div>;
  }

  if (!user) {
    return <Login />;
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <p className="eyebrow">Adventure planning app</p>
          <h1>🧭 SideQuest Travel</h1>
        </div>
        <button className="secondary-button" onClick={handleLogout}>Cerrar sesión</button>
      </header>

      {selectedTrip ? (
        <TripDetail
          trip={selectedTrip}
          user={user}
          goBack={() => setSelectedTrip(null)}
        />
      ) : (
        <Trips user={user} onSelectTrip={setSelectedTrip} />
      )}
    </div>
  );
}

export default App;
