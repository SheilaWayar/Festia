# Atajo: permite arrancar con "uvicorn main:app" desde la carpeta backend,
# además de "uvicorn app.main:app". La aplicación real está en app/main.py.
from app.main import app  # noqa: F401
