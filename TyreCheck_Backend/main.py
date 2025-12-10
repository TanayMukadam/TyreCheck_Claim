from fastapi import FastAPI, status, HTTPException, Depends
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from fastapi.params import Depends
from pathlib import Path
from fastapi.staticfiles import StaticFiles
#Routing
from Routes.userRoutes import public_user_router
from Routes.claimRoutes import protected_user_router
from Routes.viewClaimRoutes import protected_claimView_route
from Routes.summaryRoute import protected_summary_route
from Routes.dealersRoute import protected_dealer_route
#Access Route
from Utils.auth import get_current_user

app = FastAPI(debug=True)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Or specify [""] etc.
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
shared_folder_path = Path(__file__).parent.parent / "Shared_Folder"

# Mount images folder
app.mount("/protected_claim/images", StaticFiles(directory=shared_folder_path), name="images")

app.include_router(public_user_router, prefix="/auth")
app.include_router(protected_user_router, prefix="/auth")
app.include_router(protected_claimView_route, prefix="/auth")
app.include_router(protected_summary_route, prefix="/auth")
app.include_router(protected_dealer_route, prefix="/auth")

@app.get('/')
async def root():
    return {
        "status": status.HTTP_200_OK,
        "Message": "TyreCheck_Claim_API"
    }



# if __name__ == "__main__":
#     uvicorn.run("main:app", host="127.0.0.1", port=8081, reload=True)
