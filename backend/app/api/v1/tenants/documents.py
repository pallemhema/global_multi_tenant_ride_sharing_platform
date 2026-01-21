from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timezone

from app.core.dependencies import get_db
from app.core.security.roles import require_tenant_admin
from app.models.core.tenants.tenant_documents import TenantDocument
from app.schemas.core.tenants.tenant_documents import TenantDocumentCreate

router = APIRouter(
    prefix="/tenants",
    tags=["Tenant Admin – Documents"],
)

@router.post("/{tenant_id}/documents")
def upload_tenant_document(
    tenant_id: int,
    payload: TenantDocumentCreate,
    db: Session = Depends(get_db),
    user: dict = Depends(require_tenant_admin),

):
    # Prevent duplicate document type per tenant
    exists = (
        db.query(TenantDocument)
        .filter(
            TenantDocument.tenant_id == tenant_id,
            TenantDocument.document_type == payload.document_type,
        )
        .first()
    )

    if exists:
        raise HTTPException(
            status_code=409,
            detail="Document already uploaded",
        )

    doc = TenantDocument(
        tenant_id=tenant_id,
        document_type=payload.document_type,
        document_number=payload.document_number,
        document_url=payload.document_url,
        verification_status="pending",
        created_by=int(user["sub"]),
    )

    db.add(doc)
    db.commit()
    db.refresh(doc)

    return {
        "tenant_document_id": doc.tenant_document_id,
        "status": "uploaded",
        "verification_status": doc.verification_status,
    }

@router.get("/{tenant_id}/documents")
def list_tenant_documents(
    tenant_id: int,
    db: Session = Depends(get_db),
    _: dict = Depends(require_tenant_admin),
):
    docs = (
        db.query(TenantDocument)
        .filter(TenantDocument.tenant_id == tenant_id)
        .all()
    )

    return docs

@router.put("/tenants/{tenant_id}/documents/{doc_id}")
def update_tenant_document(
    tenant_id: int,
    doc_id: int,
    payload: TenantDocumentCreate,
    db: Session = Depends(get_db),
    user: dict = Depends(require_tenant_admin),
):
    doc = db.get(TenantDocument, doc_id)

    if not doc or doc.tenant_id != tenant_id:
        raise HTTPException(404, "Document not found")

    if doc.verification_status == "approved":
        raise HTTPException(400, "Approved document cannot be modified")

    doc.document_number = payload.document_number
    doc.document_url = payload.document_url
    doc.verification_status = "pending"
    doc.updated_by = int(user["sub"])
    doc.updated_at_utc = datetime.now(timezone.utc)

    db.commit()

    return {"status": "document re-uploaded"}
