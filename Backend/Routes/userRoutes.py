# routes/user_routes.py
from fastapi import APIRouter, status, HTTPException, Depends
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.exc import SQLAlchemyError

# User Controller Modules
from Controllers.userController import create_user_function, verify_user_function
# Schemas
from Schemas.userSchema import Create_User, Token
# Auth dependency to get current user (from your auth file)
from Utils.auth import get_current_user
from Database.models import User

# Public router: signup & login (no token required)
public_user_router = APIRouter(prefix="/user", tags=["User Public"])

@public_user_router.post("/user_create", status_code=status.HTTP_201_CREATED)
async def create_user_service(credentials: Create_User):
    if not credentials.username or not credentials.password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"message": "Please provide username and password"}
        )

    created = create_user_function(credentials.username, credentials.password)
    if not created:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"message": "Server failed to create a new user"}
        )
    return {"message": "User created successfully"}


@public_user_router.post("/user_login", response_model=Token)
async def user_login_service(form_data: OAuth2PasswordRequestForm = Depends()):
    username = form_data.username
    password = form_data.password

    if not username or not password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"message": "Please provide username and password"}
        )

    token_response = verify_user_function(username, password)
    if not token_response:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"message": "Invalid username or password"}
        )
    return token_response

