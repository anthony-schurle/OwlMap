from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from backend.logic import main

from backend.data.crud import init, get_course_location
from backend.data.database import engine, Base

app = FastAPI()

Base.metadata.create_all(bind=engine)
init()

app.mount("/frontend/dist", StaticFiles(directory="frontend/dist"), name="frontend-dist")

interface = main.Main()

@app.get("/")
def index():
    return FileResponse("frontend/dist/index.html")

@app.get("/nodes")
def get_nodes():
    nodes = interface.get_nodes()
    return {"nodes": [(node.name, node.x, node.y) for node in nodes]}

@app.get("/navigate")
def navigate(start_str: str, end_str: str):
    path, distance = interface.navigate(start_str, end_str)

    return {"path": [node.name for node in path], "distance": distance}

@app.get("/course-location")
def course_location(code: str):
    loc_name = get_course_location(code)

    return {"location-name": loc_name}