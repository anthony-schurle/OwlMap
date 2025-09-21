from sqlalchemy import String, Column, Float, ForeignKey
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

    # Relationship to edges (view-only to avoid inserting via this relationship)
    edges_from = relationship("Edge", foreign_keys="[Edge.location_1_id]", back_populates="location_1")
    edges_to = relationship("Edge", foreign_keys="[Edge.location_2_id]", back_populates="location_2")

    courses = relationship("Course", back_populates="location")


class Edge(Base):
    __tablename__ = "edges"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, nullable=False)
    location_1_id = Column(UUID(as_uuid=True), ForeignKey("locations.id"), nullable=False)
    location_2_id = Column(UUID(as_uuid=True), ForeignKey("locations.id"), nullable=False)
    distance = Column(Float, nullable=False)

    # Direct relationships to locations
    location_1 = relationship("Location", foreign_keys=[location_1_id], back_populates="edges_from")
    location_2 = relationship("Location", foreign_keys=[location_2_id], back_populates="edges_to")

class Course(Base):
    __tablename__ = "courses"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, nullable=False)
    code = Column(String, nullable=False, unique=True)        # e.g., "CS101"
    location_id = Column(UUID(as_uuid=True), ForeignKey("locations.id"), nullable=False)

    # Relationship to the building/location
    location = relationship("Location")