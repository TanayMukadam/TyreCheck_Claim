from pydantic import BaseModel
from typing import Optional, List

class ClaimWarrantySPRequest(BaseModel):
    ClaimWarrantyId: Optional[str] = None
    DealerId: Optional[str] = None
    Servicetype: Optional[str] = None
    FromDate: Optional[str] = None  # 'YYYY-MM-DD'
    ToDate: Optional[str] = None    # 'YYYY-MM-DD'
    page: int = 1


class ClaimWarrantySPSchema(BaseModel):
    Claim_Warranty_Id: str
    Dealer_name: str
    Service_type: str
    CreatedDate: str
    TotalAVG: str
    InspectionTime: str
    View: str



class PaginatedClaimSPResponse(BaseModel):
    data: List[ClaimWarrantySPSchema]
    page: int
    per_page: int
    total: int
    total_pages: int