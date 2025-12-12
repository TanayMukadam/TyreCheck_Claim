from fastapi import FastAPI, HTTPException, status, Depends, APIRouter
from Database.database import get_db
from Schemas.claimSchema import *
from Utils.auth import get_current_user
from sqlalchemy.orm import Session
from sqlalchemy import text





protected_summary_route = APIRouter(
    prefix="/summary",
    tags=["Summary Page Routes"],
    dependencies=[Depends(get_current_user)]
)

# @protected_summary_route.get("/percentage_report")
# async def percentage_report(db: Session = Depends(get_db)):
    
#     try:
#         # First Sql Command    
#         sql = text("call tyrecheck.USP_DashboardServicetypewise_percentage_Report('claim', null, null, null)")
        
#         result = db.execute(sql)
#         data = result.fetchall()
#         columns = result.keys()

#         # Convert SQL rows to list of dicts
#         response = [dict(zip(columns, row)) for row in data]
        
#         return response
    
    
#     except Exception as e:
#         print(f"Summary Report Route Error: {e}")
#         raise e
    
    
    
# @protected_summary_route.get("/overall_report")
# async def overall_report(db: Session = Depends(get_db)):
    
#     try:
#         sql = text("call tyrecheck.USP_DashboardServicetypewiseCountReport('claim', null, null, null)")
        
#         result = db.execute(sql)
        
#         data = result.fetchall()
#         columns = result.keys()
        
#         response = [dict(zip(columns, row)) for row in data]
        
#         return response
#     except Exception as e:
#         print(f"Overal Report Route Error: {e}")
#         raise e
def normalize(value):
    """Convert empty values, 'null', 'string' → None"""
    if value is None:
        return None
    if value == "" or value.lower() == "string" or value.lower() == "null":
        return None
    return value


@protected_summary_route.post("/summary_report")
async def summary_report(filters: SummaryFilter, db: Session = Depends(get_db)):

    try:
        print("Dealer Code ->>>", filters.dealer_code)
        # print("Dealer Name ->>>", filters)
        servicetype = "claim"
        dealer = normalize(filters.dealer_code)
        from_date = normalize(filters.from_date)
        to_date = normalize(filters.to_date)

        # If user gives nothing → default SP call
        if not dealer and not from_date and not to_date:
            sql1 = text("""
                CALL tyrecheck.USP_DashboardServicetypewise_percentage_Report(:servicetype, NULL, NULL, NULL)
            """)
            sql2 = text("""
                CALL tyrecheck.USP_DashboardServicetypewiseCountReport(:servicetype, NULL, NULL, NULL)
            """)
        else:
            sql1 = text("""
                CALL tyrecheck.USP_DashboardServicetypewise_percentage_Report(
                    :servicetype, :dealer, :from_date, :to_date
                )
            """)

            sql2 = text("""
                CALL tyrecheck.USP_DashboardServicetypewiseCountReport(
                    :servicetype, :dealer, :from_date, :to_date
                )
            """)

        result1 = db.execute(sql1, {
            "servicetype": servicetype,
            "dealer": dealer,
            "from_date": from_date,
            "to_date": to_date,
        })

        rows1 = result1.fetchall()
        percentage_report = [dict(zip(result1.keys(), row)) for row in rows1]

        result2 = db.execute(sql2, {
            "servicetype": servicetype,
            "dealer": dealer,
            "from_date": from_date,
            "to_date": to_date,
        })

        rows2 = result2.fetchall()
        overall_summary = [dict(zip(result2.keys(), row)) for row in rows2]

        return {
            "percentage_report": percentage_report,
            "overall_summary": overall_summary
        }

    except Exception as e:
        print("Summary Report Error:", e)
        raise HTTPException(status_code=500, detail="Error fetching summary report")