from pydantic import BaseModel


class Create_User(BaseModel):
    username: str
    password: str


class Verify_User(BaseModel):
    username: str
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str