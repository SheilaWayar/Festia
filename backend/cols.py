import sqlite3
con = sqlite3.connect("salones.db")
print("salones:", [c[1] for c in con.execute("pragma table_info(salones)")])
print("turnos:", [c[1] for c in con.execute("pragma table_info(turnos)")])
