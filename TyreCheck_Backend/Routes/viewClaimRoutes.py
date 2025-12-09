from Database.database import get_db
from fastapi import FastAPI, APIRouter, Depends
from sqlalchemy.orm import Session
from Utils.auth import get_current_user
import logging

logger = logging.getLogger(__name__)


protected_claimView_route = APIRouter(
    prefix="/viewClaim",
    tags=["User Protected"],
    dependencies=[Depends(get_current_user)]
)


@protected_claimView_route.get("")
async def claimViewRoute(db: Session = Depends(get_db)):
    return "hello World"