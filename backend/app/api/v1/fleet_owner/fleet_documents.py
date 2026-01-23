import shutil
from datetime import date, datetime, timezone
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from sqlalchemy.orm import Session

from app.core.dependencies import get_db
from app.core.security.roles import require_fleet_owner
from app.models.core.fleet_owners.fleet_owner_documents import FleetOwnerDocument
from app.schemas.core.fleet_owners.fleet_owner_documents import FleetOwnerDocumentOut
from app.core.utils.document_paths import build_document_paths

router = APIRouter(
    tags=["Fleet Owner – Documents"],
)


# 🔹 Upload Fleet Owner Document
@router.post(
    "/documents",
    response_model=FleetOwnerDocumentOut,
)
def upload_fleet_owner_document(
    document_type: str = Form(...),
    document_number: str | None = Form(None),
    expiry_date: date | None = Form(None),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    fleet=Depends(require_fleet_owner),
):
    ext = file.filename.split(".")[-1]
    filename = f"{document_type}.{ext}"

    paths = build_document_paths(
        tenant_id=fleet.tenant_id,
        entity="fleet_owners",
        entity_id=fleet.fleet_owner_id,
        filename=filename,
    )

    with open(paths["absolute_path"], "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    doc = FleetOwnerDocument(
        tenant_id=fleet.tenant_id,
        fleet_owner_id=fleet.fleet_owner_id,
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


# 🔹 Update Fleet Owner Document (only if not approved)
@router.put(
    "/documents/{doc_id}",
    response_model=FleetOwnerDocumentOut,
)
def update_fleet_owner_document(
    doc_id: int,
    document_number: str | None = Form(None),
    expiry_date: date | None = Form(None),
    file: UploadFile | None = File(None),
    db: Session = Depends(get_db),
    fleet=Depends(require_fleet_owner),
):
    doc = db.get(FleetOwnerDocument, doc_id)

    if not doc or doc.fleet_owner_id != fleet.fleet_owner_id:
        raise HTTPException(404, "Document not found")

    if doc.verification_status == "approved":
        raise HTTPException(400, "Approved document cannot be edited")

    # 🔁 Replace file if uploaded again
    if file:
        ext = file.filename.split(".")[-1]
        filename = f"{doc.document_type}.{ext}"

        paths = build_document_paths(
            tenant_id=fleet.tenant_id,
            entity="fleet_owners",
            entity_id=fleet.fleet_owner_id,
            filename=filename,
        )

        with open(paths["absolute_path"], "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        doc.document_url = paths["relative_path"]

    doc.document_number = document_number
    doc.expiry_date = expiry_date
    doc.updated_at_utc = datetime.now(timezone.utc)
    doc.updated_by = fleet.user_id

    db.commit()
    db.refresh(doc)
    return doc


# 🔹 List Fleet Owner Documents
@router.get(
    "/documents",
    response_model=list[FleetOwnerDocumentOut],
)
def list_fleet_owner_documents(
    db: Session = Depends(get_db),
    fleet=Depends(require_fleet_owner),
):
    return (
        db.query(FleetOwnerDocument)
        .filter(
            FleetOwnerDocument.tenant_id == fleet.tenant_id,
            FleetOwnerDocument.fleet_owner_id == fleet.fleet_owner_id,
        )
        .all()
    )
