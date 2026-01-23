import shutil
from datetime import date
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from sqlalchemy.orm import Session

from app.core.dependencies import get_db
from app.core.security.roles import require_fleet_owner
from app.models.core.vehicles.vehicles import Vehicle
from app.models.core.vehicles.vehicle_docuemnts import VehicleDocument
from app.schemas.core.vehicles.vehicle_documents import VehicleDocumentOut
from app.core.utils.document_paths import build_document_paths

router = APIRouter(
    tags=["Fleet Owner – Vehicle Documents"],
)


# 📄 Upload vehicle document (LOCAL STORAGE)
@router.post(
    "/vehicles/{vehicle_id}/documents",
    response_model=VehicleDocumentOut,
)
def upload_vehicle_document(
    vehicle_id: int,
    document_type: str = Form(...),
    document_number: str | None = Form(None),
    expiry_date: date | None = Form(None),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    fleet=Depends(require_fleet_owner),
):
    # 🔐 Fleet approval check
    if not fleet.is_active:
        raise HTTPException(403, "Fleet owner not approved")

    # 🚗 Vehicle existence check
    vehicle = (
        db.query(Vehicle)
        .filter(
            Vehicle.vehicle_id == vehicle_id,
            Vehicle.tenant_id == fleet.tenant_id,
        )
        .first()
    )

    if not vehicle:
        raise HTTPException(404, "Vehicle not found")

    # 🧾 Build file name
    if not file.filename:
        raise HTTPException(400, "Invalid file")

    ext = file.filename.split(".")[-1]
    filename = f"{document_type}.{ext}"

    # 📂 Build paths
    paths = build_document_paths(
        tenant_id=fleet.tenant_id,
        entity="vehicles",
        entity_id=vehicle_id,
        filename=filename,
    )

    # 💾 Save file
    with open(paths["absolute_path"], "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # 🗃️ Save DB record
    doc = VehicleDocument(
        vehicle_id=vehicle.vehicle_id,
        tenant_id=fleet.tenant_id,
        document_type=document_type,
        document_number=document_number,
        document_url=paths["relative_path"],
        expiry_date=expiry_date,
        verification_status="pending",
        created_by=fleet.user_id,
    )

    db.add(doc)
    db.commit()
    db.refresh(doc)

    return doc


# 📋 List vehicle documents
@router.get(
    "/vehicles/{vehicle_id}/documents",
    response_model=list[VehicleDocumentOut],
)
def list_vehicle_documents(
    vehicle_id: int,
    db: Session = Depends(get_db),
    fleet=Depends(require_fleet_owner),
):
    return (
        db.query(VehicleDocument)
        .join(Vehicle)
        .filter(
            Vehicle.vehicle_id == vehicle_id,
            Vehicle.tenant_id == fleet.tenant_id,
        )
        .all()
    )
