
from fastapi import APIRouter, Depends, File, Form, UploadFile, HTTPException
from sqlalchemy.orm import Session
from datetime import date
import shutil
import os


from app.core.dependencies import get_db
from app.core.security.roles import require_vehicle_owner
from app.models.core.vehicles.vehicles import Vehicle
from sqlalchemy.orm import Session
from app.models.core.vehicles.vehicles import Vehicle
from app.models.core.vehicles.vehicle_docuemnts import VehicleDocument
from app.schemas.core.vehicles.vehicle_documents import VehicleDocumentOut
from app.core.utils.document_paths import build_document_paths

router = APIRouter(prefix='/vehicles')

def get_owned_vehicle(
    vehicle_id: int,
    owner: dict,
    db: Session,
):
    query = db.query(Vehicle).filter(
        Vehicle.vehicle_id == vehicle_id,
        Vehicle.tenant_id == owner["tenant_id"],
        Vehicle.owner_type == owner["type"],
    )

    if owner["type"] == "driver":
        query = query.filter(Vehicle.driver_owner_id == owner["id"])

    if owner["type"] == "fleet_owner":
        query = query.filter(Vehicle.fleet_owner_id == owner["id"])

    vehicle = query.first()

    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")

    return vehicle


@router.post(
    "/{vehicle_id}/documents",
    response_model=VehicleDocumentOut,
)
def upload_vehicle_document(
    vehicle_id: int,

    document_type: str = Form(...),
    document_number: str | None = Form(None),
    expiry_date: date | None = Form(None),
    file: UploadFile = File(...),

    db: Session = Depends(get_db),
    owner=Depends(require_vehicle_owner),
):
    if not file.filename:
        raise HTTPException(400, "Invalid file")

    # 🔐 Ensure vehicle belongs to owner
    vehicle = (
        db.query(Vehicle)
        .filter(
            Vehicle.vehicle_id == vehicle_id,
            Vehicle.tenant_id == owner["tenant_id"],
        )
        .first()
    )
    if not vehicle:
        raise HTTPException(404, "Vehicle not found")

    # 📁 Build storage path
    ext = file.filename.split(".")[-1]
    filename = f"{document_type}.{ext}"

    paths = build_document_paths(
        tenant_id=owner["tenant_id"],
        entity="vehicles",
        entity_id=vehicle_id,
        filename=filename,
    )

    # 💾 Save file
    with open(paths["absolute_path"], "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # 🗃️ Save DB record
    doc = VehicleDocument(
        tenant_id=owner["tenant_id"],
        vehicle_id=vehicle_id,
        document_type=document_type,
        document_number=document_number,
        document_url=paths["relative_path"],
        expiry_date=expiry_date,
        verification_status="pending",
        created_by=owner["user_id"],
    )

    db.add(doc)
    db.commit()
    db.refresh(doc)

    return doc

@router.get(
    "/{vehicle_id}/documents",
    response_model=list[VehicleDocumentOut],
)
def list_vehicle_documents(
    vehicle_id: int,
    db: Session = Depends(get_db),
    owner=Depends(require_vehicle_owner),
):
    return (
        db.query(VehicleDocument)
        .filter(
            VehicleDocument.vehicle_id == vehicle_id,
            VehicleDocument.tenant_id == owner["tenant_id"],
        )
        .all()
    )

@router.put(
    "/{vehicle_id}/documents/{document_id}",
    response_model=VehicleDocumentOut,
)
def update_vehicle_document(
    vehicle_id: int,
    document_id: int,
    document_number: str | None = Form(None),
    expiry_date: date | None = Form(None),
    file: UploadFile | None = File(None),
    db: Session = Depends(get_db),
    owner=Depends(require_vehicle_owner),
):
    vehicle = get_owned_vehicle(vehicle_id, owner, db)

    doc = (
        db.query(VehicleDocument)
        .filter(
            VehicleDocument.document_id == document_id,
            VehicleDocument.vehicle_id == vehicle.vehicle_id,
            VehicleDocument.tenant_id == owner["tenant_id"],
        )
        .first()
    )

    if not doc:
        raise HTTPException(404, "Document not found")

    if document_number is not None:
        doc.document_number = document_number

    if expiry_date is not None:
        doc.expiry_date = expiry_date

    if file:
        ext = file.filename.split(".")[-1]
        filename = f"{doc.document_type}.{ext}"


        paths = build_document_paths(
            tenant_id=owner["tenant_id"],
            entity="vehicles",
            entity_id=vehicle.vehicle_id,
            filename=filename,
        )

        try:
            old_abs = os.path.join(
                settings.MEDIA_ROOT,
                doc.document_url.lstrip("/")
            )
            if os.path.exists(old_abs):
                os.remove(old_abs)
        except Exception:
            pass

        with open(paths["absolute_path"], "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        doc.document_url = paths["relative_path"]

    doc.verification_status = "pending"
    doc.updated_by = owner["user_id"]

    db.commit()
    db.refresh(doc)

    return doc

@router.delete(
    "/{vehicle_id}/documents/{document_id}",
    status_code=204,
)
def delete_vehicle_document(
    vehicle_id: int,
    document_id: int,
    db: Session = Depends(get_db),
    owner=Depends(require_vehicle_owner),
):
    vehicle = get_owned_vehicle(vehicle_id, owner, db)

    doc = (
        db.query(VehicleDocument)
        .filter(
            VehicleDocument.document_id == document_id,
            VehicleDocument.vehicle_id == vehicle.vehicle_id,
            VehicleDocument.tenant_id == owner["tenant_id"],
        )
        .first()
    )

    if not doc:
        raise HTTPException(404, "Document not found")

    try:
        abs_path = os.path.join(
            settings.MEDIA_ROOT,
            doc.document_url.lstrip("/")
        )
        if os.path.exists(abs_path):
            os.remove(abs_path)
    except Exception:
        pass

    db.delete(doc)
    db.commit()
