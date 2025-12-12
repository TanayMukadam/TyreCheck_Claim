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
    
    
    
class SummaryFilter(BaseModel):
    servicetype: Optional[str] = None
    dealer_code: Optional[str] = None
    from_date: Optional[str] = None
    to_date: Optional[str] = None


# --------------------------
# Response Models
# --------------------------
class PercentageReportItem(BaseModel):
    ServiceType: Optional[str]
    Percentage: Optional[float]
    DealerCode: Optional[str]
    TotalCount: Optional[int]


class OverallSummary(BaseModel):
    Overall: Optional[float]
    WarrantyCount: Optional[int]


# --------------------------
# Response Wrapper
# --------------------------
class SummaryResult(BaseModel):
    percentage_report: List[PercentageReportItem]
    overall_summary: List[OverallSummary]
    
    
    
class UpdateClaim(BaseModel):
    claim_id: str
    remark : Optional[str] = None
    result_percentage : Optional[int] = None
    type : Optional[str]
    corrected_value : Optional[str]
    
    
    
class ai_summary(BaseModel):
    dealer_id: Optional[str]
    service_type : str = "claim"
    fromDate : Optional[str] = None
    toDate : Optional[str] = None