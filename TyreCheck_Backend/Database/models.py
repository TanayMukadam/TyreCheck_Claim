from typing import List
from sqlalchemy import ForeignKey
from sqlalchemy import String, Column, Integer, DateTime
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy.orm import Mapped
from sqlalchemy.orm import mapped_column
from sqlalchemy.orm import relationship
from .engine import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True)
    password = Column(String(200))


class ClaimWarranty(Base):
    __tablename__ = "TBL_Tyre_Details"

    ID = Column(Integer, primary_key=True, autoincrement=True)
    Claim_Warranty_Id = Column(String(250), nullable=True)
    ImageType = Column(String(100), nullable=True)
    Dealer_Code = Column(String(150), nullable=True)
    Service_type = Column(String(150), nullable=True)
    Type = Column(String(150), nullable=True)
    Number_plate = Column(String(4000), nullable=True)
    Odometer_reading = Column(String(150), nullable=True)
    Make = Column(String(150), nullable=True)
    Brand = Column(String(150), nullable=True)
    QR_code = Column(String(150), nullable=True)
    Serial_no = Column(String(150), nullable=True)
    Tyre_size = Column(String(150), nullable=True)
    Defect_Result = Column(String(150), nullable=True)
    Gauge_reading = Column(String(150), nullable=True)
    Image_name = Column(String(250), nullable=True)
    Flow_Status = Column(Integer, nullable=True)
    Request_Date = Column(DateTime, nullable=True)
    Request_Insert_by = Column(String(50), nullable=True)
    Result_percentage = Column(Integer, nullable=True)
    Remark = Column(String(500), nullable=True)
    CorrectedValue = Column(String(500), nullable=True)
    ai_result = Column(String(1000), nullable=True)
    Final_Defect = Column(String(45), nullable=True)
    ai_api_output = Column(String(4000), nullable=True)
    Exception_Occurred = Column(String(1000), nullable=True)
    Side_Ground = Column(String(15), nullable=True)
    Latitude = Column(String(50), nullable=True)
    Longitude = Column(String(50), nullable=True)
    Address = Column(String(500), nullable=True)
    Device_Details = Column(String(500), nullable=True)
    IP_Address = Column(String(20), nullable=True)
    Extra1 = Column(String(20), nullable=True)
    Extra2 = Column(String(20), nullable=True)
    Extra3 = Column(String(20), nullable=True)
    folder_name = Column(String(45), nullable=True)