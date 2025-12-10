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



@protected_claimView_route.get("/Claim_ID={claim_id:path}")
async def claimViewRoute(claim_id: str, db: Session = Depends(get_db)):

    if not claim_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"message": "Claim ID Record not found"}
        )

    # Call stored procedure to get claim details
    sql = text("CALL tyrecheck.USP_GetTyreDetailsFromWarranty_ClaimNo(:claim_id)")
    result = db.execute(sql, {"claim_id": claim_id})
    data = result.fetchall()
    columns = result.keys()

    # Convert SQL rows to list of dicts
    response = [dict(zip(columns, row)) for row in data]

    # Optional: check if any data returned
    if not response:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"message": f"No records found for Claim ID {claim_id}"}
        )

    return response