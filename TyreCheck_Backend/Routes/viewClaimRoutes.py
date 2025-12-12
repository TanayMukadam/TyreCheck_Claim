from Database.database import get_db
from Database.models import ClaimWarranty
from fastapi import FastAPI, APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import text
from Utils.auth import get_current_user
import logging
from Schemas.claimSchema import UpdateClaim


logger = logging.getLogger(__name__)


protected_claimView_route = APIRouter(
    prefix="/viewClaim",
    tags=["View Claim Routes"],
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




@protected_claimView_route.post("/updateClaimResult")
async def update_claim_result(update_claim: UpdateClaim, db: Session = Depends(get_db)):
    try:
        
        claim = db.query(ClaimWarranty).filter(
            ClaimWarranty.Claim_Warranty_Id == update_claim.claim_id,
            ClaimWarranty.Type == update_claim.type
        ).first()

        if not claim:
            raise HTTPException(status_code=404, detail="Claim not found")

        claim_update_id = claim.ID
        claim_image_name = claim.Image_name

        sql = text("""
            call tyrecheck.USP_UpdateTyreDetails(
                :claimid, :remark, :imgName, :update_id, :correctvalue, :result_percentage
            )
        """)

        query = db.execute(sql, {
            "claimid": update_claim.claim_id,
            "remark": update_claim.remark,
            "imgName": claim_image_name,
            "update_id": claim_update_id,
            "correctvalue": update_claim.corrected_value,
            "result_percentage": update_claim.result_percentage
        })

        db.commit()
        return {"message": "Data Updated Successfully"}
            
        
    except Exception as e:
        print(f"Update Claim Route Error: {e}")
        raise e