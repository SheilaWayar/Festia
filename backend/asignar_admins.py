import sqlite3
c = sqlite3.connect(r"C:\dev\Festia\backend\salones.db")

# EDITAR: admin_id -> lista de salon_id
ASIGNACION = {
    1: [1, 2],      # admin@test.com
    4: [3, 4, 5],   # admin@festia.com
}

for admin_id, salones in ASIGNACION.items():
    for salon_id in salones:
        existe = c.execute(
            "select 1 from salon_admins where admin_id=? and salon_id=?",
            (admin_id, salon_id),
        ).fetchone()
        if not existe:
            c.execute(
                "insert into salon_admins (admin_id, salon_id) values (?, ?)",
                (admin_id, salon_id),
            )
c.commit()
print(c.execute("select * from salon_admins").fetchall())
