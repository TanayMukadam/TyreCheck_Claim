import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from urllib.parse import quote
from dotenv import load_dotenv
load_dotenv()

db_username = os.environ.get("DB_USERNAME")
db_password = os.environ.get("DB_PASSWORD")
db_password = quote(db_password)
db_host = os.environ.get("DB_HOST")
db_name = os.environ.get("DB_NAME")



url_link = f"mysql+pymysql://{db_username}:{db_password}@{db_host}/{db_name}"

engine = create_engine(url_link, echo=True)

SessionLocal = sessionmaker(bind=engine, autoflush=True)

Base = declarative_base()