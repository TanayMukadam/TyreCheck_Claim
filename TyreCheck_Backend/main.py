from fastapi import FastAPI, status, HTTPException, Depends, UploadFile, File, Form
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from fastapi.params import Depends
from pathlib import Path
from fastapi.staticfiles import StaticFiles
#Routing
from Routes.userRoutes import public_user_router
from Routes.dashboardRoute import protected_dashboard_router
from Routes.viewClaimRoutes import protected_claimView_route
from Routes.summaryRoute import protected_summary_route
from Routes.dealersRoute import protected_dealer_route
#Access Route
import shutil, os

app = FastAPI(debug=True)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Or specify [""] etc.
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
shared_folder_path = Path(__file__).parent.parent / "shared_uploads"

# Mount images folder
app.mount("/protected_claim/images", StaticFiles(directory=shared_folder_path), name="images")

app.include_router(public_user_router, prefix="/auth")
app.include_router(protected_dashboard_router, prefix="/auth")
app.include_router(protected_claimView_route, prefix="/auth")
app.include_router(protected_summary_route, prefix="/auth")
app.include_router(protected_dealer_route, prefix="/auth")

@app.get('/')
async def root():
    return {
        "status": status.HTTP_200_OK,
        "Message": "TyreCheck_Claim_API"
    }
    
UPLOAD_DIR = "/shared_uploads"  # shared volume

# Ensure folder exists inside container
os.makedirs(UPLOAD_DIR, exist_ok=True)

@app.post("/upload-image")
async def upload_image(file: UploadFile = File(...),FolderName: str = Form()):
    try:
        # Create folder inside UPLOAD_DIR
        target_folder = os.path.join(UPLOAD_DIR, FolderName)
        os.makedirs(target_folder, exist_ok=True)

        # Keep original filename
        original_filename = file.filename

        # Full path
        file_path = os.path.join(target_folder, original_filename)

        # Save file
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        return {
            "status": "success",
            "filename": original_filename,
            "folder": FolderName,
            "path": f"/uploads/{FolderName}/{original_filename}"
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# if __name__ == "__main__":
#     uvicorn.run("main:app", host="127.0.0.1", port=8081, reload=True)