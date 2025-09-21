from sqlalchemy.orm import Session
from backend.data.database import SessionLocal
from backend.data.models import Location

def init():
    locations = [
    Location(name="Recreation Center", latitude=29.718234287094702, longitude=-95.40365381464878),
    Location(name="Fondren Library", latitude=29.7184889244895, longitude=-95.40003002999113),
    Location(name="Lovett College", latitude=29.716736984405465, longitude=-95.39799155165602),
    Location(name="Will Rice College", latitude=29.716466139816475, longitude=-95.39871387154595),
    Location(name="Hanszen College", latitude=29.715892410957814, longitude=-95.40018766506088),
    Location(name="Sid Richardson College", latitude=29.715691758825585, longitude=-95.39829300944861),
    Location(name="Wiess College", latitude=29.714691511356488, longitude=-95.40085670596993),
    Location(name="Baker College", latitude=29.71733243453455, longitude=-95.39902187616832),
    Location(name="Duncan College", latitude=29.72188855408422, longitude=-95.39846252369836),
    Location(name="Martel College", latitude=29.72179538030585, longitude=-95.39770614078927),
    Location(name="Jones College", latitude=29.72165096077053, longitude=-95.39676200326267),
    Location(name="Brown College", latitude=29.72158108027819, longitude=-95.39587687430644),
    Location(name="McMurtry College", latitude=29.720369810681373, longitude=-95.39811383654994),
    Location(name="Anderson Biological Laboratories", latitude=29.718533877370447, longitude=-95.40277557979525),
    Location(name="Duncan Hall", latitude=29.72012629264678, longitude=-95.39876267795523),
    Location(name="Brockman Hall", latitude=29.719657512578248, longitude= -95.40156544571923),
    Location(name="Dell Butcher Hall", latitude=29.719610775088725, longitude=-95.40342413588199),
    Location(name="Keck Hall", latitude=29.71976632116094, longitude=-95.40013150519043),
    Location(name="Herzstein Hall", latitude=29.719403657626334, longitude=-95.39848599355855),
    Location(name="Rayzor Hall", latitude=29.718120367743776, longitude=-95.39900093604061),
    Location(name="BRC", latitude=29.710575418118918, longitude=-95.4014485121265),
    Location(name="OEDK", latitude=29.72116327508793, longitude=-95.40133636100799)

]

    db = SessionLocal()

    for loc in locations:
        db.add(loc)
        db.commit()
        db.refresh(loc)

    