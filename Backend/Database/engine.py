import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from urllib.parse import quote

db_username = os.getenv("DB_USERNAME", "root")
db_password = os.getenv("DB_PASSWORD", "Check@2020")
db_password = quote(db_password)
db_host = os.getenv("DB_HOST", "164.52.209.14")
db_name = os.getenv("DB_NAME", "tyrecheck")


## Localhost --->

# db_username = os.getenv("DB_USERNAME", "root")
# db_password = os.getenv("DB_PASSWORD", "Tanay@82629")
# db_password = quote(db_password)
# db_host = os.getenv("DB_HOST", "localhost")
# db_name = os.getenv("DB_NAME", "tyrecheck")




url_link = f"mysql+pymysql://{db_username}:{db_password}@{db_host}/{db_name}"

engine = create_engine(url_link, echo=True)

SessionLocal = sessionmaker(bind=engine, autoflush=True)

Base = declarative_base()