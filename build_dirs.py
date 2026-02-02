import os

dirs = [
    "app/routers",
    "app/services",
    "app/static/css",
    "app/static/js",
    "app/templates"
]

for d in dirs:
    os.makedirs(d, exist_ok=True)
    print(f"Created {d}")
