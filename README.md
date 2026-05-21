# SideQuest Travel

App React + Vite + Firebase para gestionar ideas de viaje: quests por categoría, links, precios ARS/USD, presupuesto y persistencia por usuario.

## Cómo correr local

```bash
npm install
npm run dev
```

## Configurar Firebase

1. Crear proyecto en Firebase.
2. Activar Authentication con Email/Password.
3. Crear base Firestore.
4. Copiar la configuración web en `src/firebase.js`.
5. Reemplazar los valores `TU_...`.

## Colecciones usadas

- `trips`: viajes creados por usuario.
- `quests`: ideas/items asociados a cada viaje.

## Deploy

Se puede deployar en Vercel como app Vite normal.
