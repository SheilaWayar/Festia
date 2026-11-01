import sys
sys.path.insert(0, r"C:\dev\Festia\backend")

from sqlalchemy import inspect, text, DateTime
from app.core.db import engine, Base
import app.main  # importa todos los modelos

insp = inspect(engine)
with engine.begin() as conn:
    for table in Base.metadata.sorted_tables:
        if not insp.has_table(table.name):
            continue
        existentes = {c["name"] for c in insp.get_columns(table.name)}
        for col in table.columns:
            if col.name in existentes:
                continue
            tipo = col.type.compile(engine.dialect)
            extra = ""
            d = col.default
            if d is not None and getattr(d, "is_scalar", False):
                v = d.arg
                if isinstance(v, bool):
                    v = int(v)
                extra = f" DEFAULT {v!r}"
            conn.execute(text(f'ALTER TABLE "{table.name}" ADD COLUMN "{col.name}" {tipo}{extra}'))
            if isinstance(col.type, DateTime):
                conn.execute(text(f'UPDATE "{table.name}" SET "{col.name}" = CURRENT_TIMESTAMP'))
            print(f"Agregada: {table.name}.{col.name} ({tipo}{extra})")
print("Listo")
