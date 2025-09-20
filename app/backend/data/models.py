from sqlalchemy import String, Column, Float
from .database import Base
from sqlalchemy.dialects.postgresql import UUID
import uuid

class Location(Base):
    __tablename__ = "locations"
    id = Column(UUID(as_uuid=True), default=uuid.uuid4, primary_key=True, nullable=False)
    name = Column(String, nullable=False)
    longitude = Column(Float, nullable=False)
    latitude = Column(Float, nullable=False)
    