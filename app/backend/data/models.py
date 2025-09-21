from sqlalchemy import String, Column, Float, ForeignKey, Table
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from .database import Base
import uuid

class Location(Base):
    __tablename__ = "locations"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, nullable=False)
    name = Column(String, nullable=False, unique=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    
    edges = relationship(
        "Edge",
        primaryjoin="or_(Location.id==Edge.location_1_id, Location.id==Edge.location_2_id)",
        back_populates="locations",
    )


class Edge(Base):
    __tablename__ = "edges"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, nullable=False)
    location_1_id = Column(UUID(as_uuid=True), ForeignKey("locations.id"), nullable=False)
    location_2_id = Column(UUID(as_uuid=True), ForeignKey("locations.id"), nullable=False)
    distance = Column(Float, nullable=False)
    
    locations = relationship(
        "Location",
        primaryjoin="or_(Edge.location_1_id==Location.id, Edge.location_2_id==Location.id)",
        viewonly=True,
        back_populates="edges",
    )
