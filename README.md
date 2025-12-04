# Club del Parque
Sistema de administración

---

## Pasos de inicialización:
### 1. Clonar el repositorio
``` bash
git clone https://github.com/fabdiangelo/club-del-parque.git
cd club-del-parque
```

### 2. Instalar dependencias del backend (Cloud Functions)
``` bash
cd functions
npm install
cd ..
``` 

### 3. Instalar dependencias del frontend (React / Vite)
``` bash
cd frontend
npm install
cd ..
```

---

## Desarrollo Local
### 1. Frontend (React / Vite):
``` bash
cd frontend
npm run dev
```

### 2. Emuladores Firebase (Hosting, Functions, Firestore):
``` bash
firebase emulators:start --import=./emulator-data --export-on-exit=./emulator-data
```

npx cypress run --spec "cypress/e2e/campeonato.cy.js"

---

## Deploy en Firebase
### Hosting (frontend):
```
firebase deploy --only hosting
```

### Functions (backend):
``` bash
firebase deploy --only functions
``` 

### Todo junto:
``` bash
firebase deploy
```