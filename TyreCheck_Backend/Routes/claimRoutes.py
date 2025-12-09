from fastapi import APIRouter, Depends, Query, HTTPException
from Database.models import User, ClaimWarranty
from Utils.auth import get_current_user
from Database.database import get_db
from sqlalchemy import text
from sqlalchemy.orm import Session
from Schemas.claimSchema import ClaimWarrantySPRequest, ClaimWarrantySPSchema, PaginatedClaimSPResponse
from typing import Optional, List
from pydantic import BaseModel

import logging
logger = logging.getLogger(__name__)
# Protected router: all routes here require a valid Bearer token
protected_user_router = APIRouter(
    prefix="/claim",
    tags=["User Protected"],
    dependencies=[Depends(get_current_user)]  # enforces token on every route in this router
)



@protected_user_router.get("/get_dealers")
async def get_dealers(cuurent_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        call_sql = text("call tyrecheck.GetAllDealers();")
        data = db.execute(call_sql)
        
        rows = data.mappings().all()
        data = [dict(r) for r in rows]
        print("--->", data)
        
        return True
    except Exception as e:
        print("Get Dealers Error")
        raise e




@protected_user_router.post("/details", response_model=PaginatedClaimSPResponse)
async def access_with_sp_paged_iso(
    request: ClaimWarrantySPRequest,
    per_page: int = Query(10, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Expects FromDate/ToDate in ISO yyyy-mm-dd (or null). Calls
    USP_GetAllDetails_Paged which uses DATE(FromDate) safely.
    """
    try:
        page = max(1, int(request.page or 1))

        # Build WHERE clauses & params for COUNT query (parameterized)
        where_clauses = []
        params = {}

        if request.ClaimWarrantyId:
            where_clauses.append("Claim_Warranty_Id = :claim_id")
            params["claim_id"] = request.ClaimWarrantyId

        if request.DealerId:
            where_clauses.append("sl.Dealer_Code = :dealer")
            params["dealer"] = request.DealerId

        if request.Servicetype:
            where_clauses.append("sl.Service_type = :service_type")
            params["service_type"] = request.Servicetype

        # IMPORTANT: expect ISO dates here (yyyy-mm-dd). We expand ToDate to end-of-day.
        if request.FromDate:
            # compare Request_Date >= 'YYYY-MM-DD 00:00:00'
            where_clauses.append("Request_Date >= :from_dt")
            params["from_dt"] = f"{request.FromDate} 00:00:00"
        if request.ToDate:
            # compare Request_Date <= 'YYYY-MM-DD 23:59:59'
            where_clauses.append("Request_Date <= :to_dt")
            params["to_dt"] = f"{request.ToDate} 23:59:59"

        where_sql = " AND ".join(where_clauses) if where_clauses else "1=1"

        # 1) Fast COUNT (DISTINCT Claim_Warranty_Id to match SP grouping)
        count_sql = text(
            f"SELECT COUNT(DISTINCT Claim_Warranty_Id) as total "
            f"FROM TBL_Tyre_Details sl "
            f"INNER JOIN tyre_dealer_masters tdm ON sl.Dealer_Code = tdm.Dealer_code "
            f"WHERE {where_sql}"
        )
        total = int(db.execute(count_sql, params).scalar() or 0)
        total_pages = (total + per_page - 1) // per_page if per_page else 1

        # 2) Call paged stored-proc (we pass the raw ISO dates - SP will do DATE(FromDate) as before)
        call_sql = text(
            "CALL USP_GetAllDetails_Paged(:ClaimWarrantyId, :DealerId, :Servicetype, :FromDate, :ToDate, :p_page, :p_per_page)"
        )

        # For SP, pass FROM/TO as ISO strings (or None)
        sp_params = {
            "ClaimWarrantyId": request.ClaimWarrantyId or None,
            "DealerId": request.DealerId or None,
            "Servicetype": request.Servicetype or None,
            "FromDate": request.FromDate or None,
            "ToDate": request.ToDate or None,
            "p_page": page,
            "p_per_page": per_page
        }

        res = db.execute(call_sql, sp_params)

        # get rows as dicts. Use mappings() if available.
        try:
            rows = res.mappings().all()
            data = [dict(r) for r in rows]
        except Exception:
            keys = res.keys() if res.returns_rows else []
            rows_list = res.fetchall() if res.returns_rows else []
            data = [dict(zip(keys, row)) for row in rows_list]

        return {
            "data": data,
            "page": page,
            "per_page": per_page,
            "total": total,
            "total_pages": total_pages
        }

    except Exception as exc:
        logger.exception("Error in paged SP endpoint (ISO-date variant)")
        try:
            db.rollback()
        except Exception:
            pass
        # return a slightly more helpful message for dev; remove `str(exc)` in production
        raise HTTPException(status_code=500, detail=f"Server error while fetching paged data: {str(exc)}")