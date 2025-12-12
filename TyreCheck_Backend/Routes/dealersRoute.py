from fastapi import FastAPI, HTTPException, status, Depends, APIRouter
from Database.database import get_db
from Utils.auth import get_current_user
from sqlalchemy.orm import Session
from sqlalchemy import text







protected_dealer_route = APIRouter(
    prefix="/dealers",
    tags=["Get Dealers Route"],
    dependencies=[Depends(get_current_user)]
)




@protected_dealer_route.get("")
async def get_all_dealers(db: Session = Depends(get_db)):
    try:
        result = db.execute(text("CALL tyrecheck.GetAllDealers()"))
        
        rows = result.fetchall()
        columns = result.keys()
        
        # Convert to list of dicts
        response = [dict(zip(columns, row)) for row in rows]
        
        return response
    except Exception as e:
        print(f"Get Dealers Route Error: {e}")
        raise e
