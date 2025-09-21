from sqlalchemy.orm import Session
from backend.data.database import SessionLocal
from backend.data.models import Location, Edge

def init():
    db: Session = SessionLocal()

    # Insert locations
    locations_data = [
        ("Recreation Center", 29.718234287094702, -95.40365381464878),
        ("Fondren Library", 29.7184889244895, -95.40003002999113),
        ("Lovett College", 29.716736984405465, -95.39799155165602),
        ("Will Rice College", 29.716466139816475, -95.39871387154595),
        ("Hanszen College", 29.715892410957814, -95.40018766506088),
        ("Sid Richardson College", 29.715691758825585, -95.39829300944861),
        ("Wiess College", 29.714691511356488, -95.40085670596993),
        ("Baker College", 29.71733243453455, -95.39902187616832),
        ("Duncan College", 29.72188855408422, -95.39846252369836),
        ("Martel College", 29.72179538030585, -95.39770614078927),
        ("Jones College", 29.72165096077053, -95.39676200326267),
        ("Brown College", 29.72158108027819, -95.39587687430644),
        ("McMurtry College", 29.720369810681373, -95.39811383654994),
    ]

    # Add locations if not already in DB
    locations = {}
    for name, lat, lon in locations_data:
        loc = db.query(Location).filter_by(name=name).first()
        if not loc:
            loc = Location(name=name, latitude=lat, longitude=lon)
            db.add(loc)
            db.commit()
            db.refresh(loc)
        locations[name] = loc  # store in dictionary for edge lookups

    # Define edges with accurate distances
    edges = [
        ("Lovett College", "Will Rice College", 492),
        ("Fondren Library", "Will Rice College", 1131),
        ("Fondren Library", "Recreation Center", 1364),
        ("Hanszen College", "Will Rice College", 719),
        ("Fondren Library", "Hanszen College", 1277),
        ("Sid Richardson College", "Hanszen College", 700),
        ("Sid Richardson College", "Will Rice College", 528),
        ("Wiess College", "Hanszen College", 551),
        ("Baker College", "Will Rice College", 226),
        ("Baker College", "Fondren Library", 508),
        ("McMurtry College", "Fondren Library", 972),
        ("McMurtry College", "Recreation Center", 1728),
        ("Jones College", "McMurtry College", 798),
        ("Martel College", "Jones College", 798),
        ("Duncan College", "Martel College", 328),
        ("Brown College", "Jones College", 320),
        ("McMurtry College", "Lovett College", 1728),
        ("McMurtry College", "Baker College", 1584),
    ]

    # Insert edges if not already in DB
    for name1, name2, dist in edges:
        loc1 = locations[name1]
        loc2 = locations[name2]

        exists = db.query(Edge).filter_by(location_1_id=loc1.id, location_2_id=loc2.id).first()
        if not exists:
            edge = Edge(location_1_id=loc1.id, location_2_id=loc2.id, distance=dist)
            db.add(edge)

    db.commit()
    db.close()

def get_all_nodes():
    db: Session = SessionLocal()
    locations = db.query(Location).all()
    return [(loc.name, loc.latitude, loc.longitude) for loc in locations]

def get_all_edges():
    db: Session = SessionLocal()
    edges = db.query(Edge).all()
    return [(db.query(Location).get(edge.location_1_id).name, db.query(Location).get(edge.location_2_id).name, edge.distance) for edge in edges]