from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os

from . import main

app = FastAPI()

app.mount("/static", StaticFiles(directory="/app/frontend"), name="static")

interface = main.Main()

@app.get("/nodes")
def get_nodes():
    return {"nodes": interface.get_nodes()}

@app.get("/navigate")
def navigate(start_str: str, end_str: str):
    path, distance = interface.navigate(start_str, end_str)

    return {"path": [node.name for node in path], "distance": distance}