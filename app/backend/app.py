from fastapi import FastAPI
from . import main

app = FastAPI()

interface = main.Main()

@app.get("/nodes")
def navigate():
    return {"nodes": interface.get_nodes()}

@app.get("/navigate")
def navigate(start_str, end_str):
    path, distance = interface.navigate(start_str, end_str)

    return {"path": path, "distance": distance}