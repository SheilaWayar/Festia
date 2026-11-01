import sqlite3
c = sqlite3.connect(r"C:\dev\Festia\backend\salones.db")
print("salon_admins:", [r[1] for r in c.execute("pragma table_info(salon_admins)")])
print("admins:", c.execute("select id, email from usuarios where rol='admin'").fetchall())
print("salones:", c.execute("select id, nombre from salones").fetchall())
