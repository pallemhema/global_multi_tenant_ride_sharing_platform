import shutil
from datetime import date, datetime, timezone
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from sqlalchemy.orm import Session

from app.core.dependencies import get_db
from app.core.security.roles import get_or_create_fleet_owner
from app.models.core.fleet_owners.fleet_owner_documents import FleetOwnerDocument
from app.models.core.fleet_owners.fleet_owners import FleetOwner
from app.schemas.core.fleet_owners.fleet_owner_documents import FleetOwnerDocumentOut
from app.core.utils.document_paths import build_document_paths
from app.models.lookups.tenant_Fleet_document_types import TenantFleetDocumentType

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
    fleet=Depends(get_or_create_fleet_owner),
):
    if not fleet:
        raise HTTPException(403, "Access denied for this FLEET")
    
    if not fleet.tenant_id:
        raise HTTPException(400, "Tenant must be selected before uploading documents")
    
    exists = (
        db.query(FleetOwnerDocument)
        .filter(
            FleetOwnerDocument.fleet_owner_id == fleet.fleet_owner_id,
            FleetOwnerDocument.document_type == document_type,
        )
        .first()
    )
    if exists:
        raise HTTPException(409, "Document already uploaded")

    if not file.filename:
        raise HTTPException(400, "Invalid file")
    
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
    uploaded_docs = (
        db.query(FleetOwnerDocument)
        .filter(
            FleetOwnerDocument.fleet_owner_id == fleet.fleet_owner_id
        )
        .all()
    )

    
    # 🔄 CHECK: If all mandatory documents are now uploaded, auto-complete registration
    mandatory_docs = (
        db.query(TenantFleetDocumentType)
        .filter(
            
            TenantFleetDocumentType.is_mandatory.is_(True),
        )
        .all()
    )
            
    
    uploaded_doc_types = {d.document_type for d in uploaded_docs}
    mandatory_doc_types = {d.document_code for d in mandatory_docs}
    
    # If all mandatory docs are uploaded, mark registration as completed
    if mandatory_doc_types.issubset(uploaded_doc_types):
        fleet_owner_record = db.query(FleetOwner).filter(
            FleetOwner.fleet_owner_id == fleet.fleet_owner_id
        ).first()
        
        if fleet_owner_record and fleet_owner_record.onboarding_status != "completed":
            fleet_owner_record.onboarding_status = "completed"
            db.add(fleet_owner_record)
            db.commit()
    
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
    fleet=Depends(get_or_create_fleet_owner),
):
    if not fleet:
        raise HTTPException(403, "Cross-fleet access denied")
    
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
    fleet=Depends(get_or_create_fleet_owner),

):
    print("found fleet for documents:", fleet.fleet_owner_id)
    if not fleet:
        raise HTTPException(403, "Access denied for this FLEET")
    
    docs =( 
        db.query(FleetOwnerDocument)
        .filter(
            FleetOwnerDocument.fleet_owner_id == fleet.fleet_owner_id,
             FleetOwnerDocument.tenant_id == fleet.tenant_id,
        )
        .all()
    )
    print(f"Found {len(docs)} documents for fleet owner {fleet.fleet_owner_id}")
    return docs
    
