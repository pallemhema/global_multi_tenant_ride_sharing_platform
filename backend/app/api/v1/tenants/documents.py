import shutil
from datetime import date, datetime, timezone
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from sqlalchemy.orm import Session

from app.core.dependencies import get_db
from app.core.security.roles import require_tenant_admin
from app.models.core.tenants.tenant_documents import TenantDocument
from app.schemas.core.tenants.tenant_documents import TenantDocumentOut
from app.core.utils.document_paths import build_document_paths

router = APIRouter(
    tags=["Tenant Admin – Documents"],
)

# 📄 Upload tenant document (LOCAL STORAGE)
@router.post(
    "/{tenant_id}/documents",
    response_model=TenantDocumentOut,
)
def upload_tenant_document(
    tenant_id: int,
    document_type: str = Form(...),
    document_number: str | None = Form(None),
    expiry_date: date | None = Form(None),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    user: dict = Depends(require_tenant_admin),
):
    # 🔁 Prevent duplicate document type
    exists = (
        db.query(TenantDocument)
        .filter(
            TenantDocument.tenant_id == tenant_id,
            TenantDocument.document_type == document_type,
        )
        .first()
    )

    if exists:
        raise HTTPException(409, "Document already uploaded")

    if not file.filename:
        raise HTTPException(400, "Invalid file")

    ext = file.filename.split(".")[-1]
    filename = f"{document_type}.{ext}"

    # 📂 Build paths (tenant documents)
    paths = build_document_paths(
        tenant_id=tenant_id,
        entity="tenant",
        entity_id=None,
        filename=filename,
    )

    # 💾 Save file
    with open(paths["absolute_path"], "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # 🗃️ Save DB record
    doc = TenantDocument(
        tenant_id=tenant_id,
        document_type=document_type,
        document_number=document_number,
        document_url=paths["relative_path"],
        expiry_date=expiry_date,
        verification_status="pending",
        created_by=int(user["sub"]),
    )

    db.add(doc)
    db.commit()
    db.refresh(doc)

    return doc


# 📋 List tenant documents
@router.get(
    "/{tenant_id}/documents",
    response_model=list[TenantDocumentOut],
)
def list_tenant_documents(
    tenant_id: int,
    db: Session = Depends(get_db),
    _: dict = Depends(require_tenant_admin),
):
    return (
        db.query(TenantDocument)
        .filter(TenantDocument.tenant_id == tenant_id)
        .all()
    )


# 🔁 Re-upload tenant document (only if not approved)
@router.put(
    "/{tenant_id}/documents/{doc_id}",
    response_model=TenantDocumentOut,
)
def update_tenant_document(
    tenant_id: int,
    doc_id: int,
    document_number: str | None = Form(None),
    expiry_date: date | None = Form(None),
    file: UploadFile | None = File(None),
    db: Session = Depends(get_db),
    user: dict = Depends(require_tenant_admin),
):
    doc = db.get(TenantDocument, doc_id)

    if not doc or doc.tenant_id != tenant_id:
        raise HTTPException(404, "Document not found")

    if doc.verification_status == "approved":
        raise HTTPException(400, "Approved document cannot be modified")

    # 🔁 Replace file if provided
    if file:
        ext = file.filename.split(".")[-1]
        filename = f"{doc.document_type}.{ext}"

        paths = build_document_paths(
            tenant_id=tenant_id,
            entity="tenant",
            entity_id=None,
            filename=filename,
        )

        with open(paths["absolute_path"], "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        doc.document_url = paths["relative_path"]

    doc.document_number = document_number
    doc.expiry_date = expiry_date
    doc.verification_status = "pending"
    doc.updated_by = int(user["sub"])
    doc.updated_at_utc = datetime.now(timezone.utc)

    db.commit()
    db.refresh(doc)
    print(doc)

    return doc
