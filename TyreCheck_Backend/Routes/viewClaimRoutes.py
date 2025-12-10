from Database.database import get_db
from fastapi import FastAPI, APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import text
from Utils.auth import get_current_user
import logging

logger = logging.getLogger(__name__)


protected_claimView_route = APIRouter(
    prefix="/viewClaim",
    tags=["User Protected"],
    dependencies=[Depends(get_current_user)]
)

# #claim_id = ROH2/25/045866
# @protected_claimView_route.get("/Claim_ID={claim_id}")
# async def claimViewRoute(claim_id: str, db: Session = Depends(get_db)):
    
#     if not claim_id:
#         raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail={"message": "Claim ID Record not found"})
    
#     sql = text("CALL tyrecheck.USP_GetTyreDetailsFromWarranty_ClaimNo(:claim_id)")
#     result = db.execute(sql, {"claim_id": claim_id})
#     data = result.fetchall()
    
#     columns = result.keys()
#     response = [dict(zip(columns, row)) for row in data]
    
#     return response

@protected_claimView_route.get("/Claim_ID={claim_id:path}")
async def claimViewRoute(claim_id: str, db: Session = Depends(get_db)):
    
    if not claim_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"message": "Claim ID Record not found"}
        )
    
    sql = text("CALL tyrecheck.USP_GetTyreDetailsFromWarranty_ClaimNo(:claim_id)")
    result = db.execute(sql, {"claim_id": claim_id})
    data = result.fetchall()
    
    columns = result.keys()
    response = [dict(zip(columns, row)) for row in data]
    
    return response
