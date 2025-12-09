import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from urllib.parse import quote
from dotenv import load_dotenv
load_dotenv

# db_username = os.environ.get("DB_USERNAME")
# db_password = os.environ.get("DB_PASSWORD")
# db_host = os.environ.get("DB_HOST")
# db_name = os.environ.get("DB_NAME")


# if db_password is None:
#     db_password = ""
# elif isinstance(db_password, bytes):
#     db_password = db_password.decode("utf-8", errors="ignore")
# else:
#     # covers int, float, bool, and already-str values
#     db_password = str(db_password)

# db_password = quote(db_password)


db_username="root"
db_password="12345"
db_host="localhost"
db_name="tyrecheck"


url_link = f"mysql+pymysql://{db_username}:{db_password}@{db_host}/{db_name}"

engine = create_engine(url_link, echo=True)

SessionLocal = sessionmaker(bind=engine, autoflush=True)

Base = declarative_base()