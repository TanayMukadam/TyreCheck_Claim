'''
User Controller Module
'''

from fastapi import status, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from typing import Optional

# Database Modules
from Database.database import get_db
from Database.models import User

# Hashing and JWT Modules
from Utils.auth import hash_password, check_password, create_access_token


def create_user_function(username: str, password: str) -> bool:
    """
    Create a new user in the database.
    Returns True on success, False on failure.
    """
    db_gen = get_db()
    db: Session = next(db_gen)

    try:
        if not username or not password:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"message": "Enter username and password"}
            )

        # Check if user already exists
        existing = db.query(User).filter_by(name=username).first()
        if existing:
            # Prefer returning an error to the client; the route layer can translate this.
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail={"message": "Username already exists"}
            )

        # Hash the password (hash_password should raise/return valid string)
        try:
            hashed_password = hash_password(password)
        except Exception as e:
            # If hashing fails for some reason, surface a 500
            print("Hashing error:", e)
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Password hashing failed")

        # Create and persist user
        new_user = User(name=username, password=hashed_password)
        db.add(new_user)
        db.commit()
        db.refresh(new_user)

        # Success: return True (or return new_user if you prefer)
        return True

    except HTTPException:
        # re-raise HTTPExceptions for route layer to handle
        db.rollback()
        raise
    except SQLAlchemyError as e:
        db.rollback()
        print("DB Error creating user:", e)
        # hide DB internals, return generic 500
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Database error")
    except Exception as e:
        db.rollback()
        print("Unexpected error creating user:", e)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal server error")
    finally:
        db_gen.close()


def verify_user_function(username: str, password: str) -> dict:
    """
    Verifies a user's credentials and returns a JWT access token dict:
    {"access_token": "<token>", "token_type": "bearer"} on success.
    Raises HTTPException on failure.
    """
    db_gen = get_db()
    db: Session = next(db_gen)

    try:
        if not username or not password:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"message": "Username and password are required"}
            )

        check_user: Optional[User] = db.query(User).filter_by(name=username).first()

        if not check_user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail={"message": "Invalid username or password"}
            )

        # check_password should return a boolean
        if not check_password(password, check_user.password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail={"message": "Invalid username or password"}
            )

        # Create JWT token. create_access_token should accept {"sub": username}
        data = {"sub": check_user.name}
        access_token = create_access_token(data)

        return {"access_token": access_token, "token_type": "bearer"}

    finally:
        db_gen.close()
