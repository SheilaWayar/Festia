# Sistema de Turnos — PP2 Grupo 8

Reserva de salones de eventos: búsqueda por tipo de evento, detalle, calendario por salón, reservas y panel de administración.

## Tecnologías
- Backend: FastAPI, SQLAlchemy, SQLite (PostgreSQL en producción), JWT
- Frontend: React + Vite, react-router-dom, react-datepicker

## Backend

```bash
python -m venv .venv
.venv\Scripts\activate            # Windows
pip install -r requirements.txt
python -m scripts.seed            # carga datos de prueba
python -m scripts.crear_admin     # crea admin@turnos.com
python -m uvicorn app.main:app --reload
```

Documentación interactiva: http://localhost:8000/docs

## Frontend

```bash
cd frontend
npm install
cp .env.example .env              # en Windows: copy .env.example .env
npm run dev
```

App: http://localhost:5173

## Flujo de trabajo (Git)
1. `git checkout develop && git pull`
2. `git checkout -b feature/nombre-tarea`
3. Commits chicos y `git push -u origin feature/nombre-tarea`
4. Pull Request a `develop`, revisión de otro integrante
5. Merge y borrar la rama

## Definición de Hecho
Funciona en local, lo revisó otro integrante, no rompe lo existente y está en `develop`.
