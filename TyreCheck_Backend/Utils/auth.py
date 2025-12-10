import os
from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
import bcrypt
from datetime import datetime, timedelta
from dotenv import load_dotenv
from jose import jwt, JWTError
from sqlalchemy.orm import Session

from Database.database import get_db
from Database.models import User

# Environment variables
load_dotenv()
SECRET_KEY = os.environ.get("SECRET_KEY")
ALGORITHM = os.environ.get("ALGORITHM")
print("ALGORITHM", ALGORITHM)
# Convert expire minutes to int (provide a safe default or raise if missing)
ACCESS_TOKEN_EXPIRE_MINUTES = os.environ.get("ACCESS_TOKEN_EXPIRE_MINUTES")
if ACCESS_TOKEN_EXPIRE_MINUTES is None:
    # you can set a default, or prefer to fail loudly
    ACCESS_TOKEN_EXPIRE_MINUTES = 60
else:
    try:
        ACCESS_TOKEN_EXPIRE_MINUTES = int(ACCESS_TOKEN_EXPIRE_MINUTES)
    except ValueError:
        raise RuntimeError("ACCESS_TOKEN_EXPIRE_MINUTES must be an integer")

if not SECRET_KEY or not ALGORITHM:
    raise RuntimeError("SECRET_KEY and ALGORITHM must be set in the environment")

##################### Password Encrypting and Checking ######################

def hash_password(password: str) -> str:
    """
    Hash a plaintext password and return a utf-8 string suitable for DB storage.
    Raises ValueError if password is None/empty.
    """
    if not password:
        raise ValueError("Password must be provided")

    salt = bcrypt.gensalt(rounds=12)  # 12 is a reasonable default cost
    encoded_password = password.encode("utf-8")
    hashed_password_bytes = bcrypt.hashpw(encoded_password, salt)
    # decode to store as string in DB (bcrypt output is ASCII-compatible)
    return hashed_password_bytes.decode("utf-8")


def check_password(password: str, hashed_password: Optional[str]) -> bool:
    """
    Check a plaintext password against stored hashed_password (string or bytes).
    Returns True if match, False otherwise.
    """
    if not hashed_password:
        return False

    if password is None:
        return False

    # hashed_password might already be a bytes object or a utf-8 string stored in DB
    if isinstance(hashed_password, str):
        hashed_bytes = hashed_password.encode("utf-8")
    else:
        hashed_bytes = hashed_password

    password_bytes = password.encode("utf-8")
    return bcrypt.checkpw(password_bytes, hashed_bytes)


####################### JWT ACCESS TOKEN LOGIC ################################

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/user_login")


def create_access_token(data: dict, expires_delta_minutes: Optional[int] = None) -> str:
    """
    Create a JWT. `data` should include the 'sub' key for the subject (username).
    `expires_delta_minutes` if provided overrides the default ACCESS_TOKEN_EXPIRE_MINUTES.
    """
    to_encode = data.copy()
    minutes = expires_delta_minutes if (expires_delta_minutes is not None) else ACCESS_TOKEN_EXPIRE_MINUTES
    expire = datetime.utcnow() + timedelta(minutes=minutes)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    """
    FastAPI dependency to retrieve the current user from the JWT token.
    Use in routes as: current_user: User = Depends(get_current_user)
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: Optional[str] = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = db.query(User).filter_by(name=username).first()
    if user is None:
        raise credentials_exception

    return user
