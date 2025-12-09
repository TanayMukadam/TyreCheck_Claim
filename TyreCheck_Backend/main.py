from fastapi import FastAPI, status, HTTPException, Depends
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from fastapi.params import Depends

#Routing
from Routes.userRoutes import public_user_router
from Routes.claimRoutes import protected_user_router
from Routes.viewClaimRoutes import protected_claimView_route

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
app.include_router(public_user_router, prefix="/auth")
app.include_router(protected_user_router, prefix="/auth")
app.include_router(protected_claimView_route, prefix="/auth")


@app.get('/')
async def root():
    return {
        "status": status.HTTP_200_OK,
        "Message": "TyreCheck_Claim_API"
    }



# if __name__ == "__main__":
#     uvicorn.run("main:app", host="127.0.0.1", port=8081, reload=True)
