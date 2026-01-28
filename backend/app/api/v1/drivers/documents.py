import os
import shutil
from datetime import date
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from sqlalchemy.orm import Session

from app.core.dependencies import get_db
from app.core.security.roles import require_driver
from app.models.core.drivers.driver_documents import DriverDocument
from app.schemas.core.drivers.driver_docuemnts import DriverDocumentOut
from app.core.utils.document_paths import build_document_paths
from app.core.config import settings


router = APIRouter(
    prefix="/driver",
    tags=["Driver – Documents"],
)


@router.post(
    "/documents",
    response_model=DriverDocumentOut,
)
def upload_driver_document(
    document_type: str = Form(...),
    document_number: str | None = Form(None),
    expiry_date: date | None = Form(None),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    driver=Depends(require_driver),
):
    # 🧾 Basic validation
    if not file.filename:
        raise HTTPException(400, "Invalid file")

    ext = file.filename.split(".")[-1]
    filename = f"{document_type}.{ext}"

    # 📂 Build paths using helper
    paths = build_document_paths(
        tenant_id=driver.tenant_id,
        entity="drivers",
        entity_id=driver.driver_id,
        filename=filename,
    )

    # 💾 Save file locally
    with open(paths["absolute_path"], "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # 🗃️ Save DB record
    doc = DriverDocument(
        tenant_id=driver.tenant_id,
        driver_id=driver.driver_id,
        document_type=document_type,
        document_number=document_number,
        document_url=paths["relative_path"],
        expiry_date=expiry_date,
        verification_status="pending",
        created_by=driver.user_id,
    )

    db.add(doc)
    db.commit()
    db.refresh(doc)

    return doc

@router.get(
    "/documents",
    response_model=list[DriverDocumentOut],
)
def list_driver_documents(
    db: Session = Depends(get_db),
    driver=Depends(require_driver),
):
    return (
        db.query(DriverDocument)
        .filter(
            DriverDocument.driver_id == driver.driver_id,
            DriverDocument.tenant_id == driver.tenant_id,
        )
        .all()
    )

@router.put(
    "/documents/{document_id}",
    response_model=DriverDocumentOut,
)
def update_driver_document(
    document_id: int,
    document_number: str | None = Form(None),
    expiry_date: date | None = Form(None),
    file: UploadFile | None = File(None),
    db: Session = Depends(get_db),
    driver=Depends(require_driver),
):
    doc = (
        db.query(DriverDocument)
        .filter(
            DriverDocument.document_id == document_id,
            DriverDocument.driver_id == driver.driver_id,
            DriverDocument.tenant_id == driver.tenant_id,
        )
        .first()
    )

    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    # ❌ Block edit if document is already approved
    if doc.verification_status == "approved":
        raise HTTPException(
            status_code=403,
            detail="Cannot edit an approved document. Please contact tenant admin."
        )

    # 🧾 Update metadata
    if document_number is not None:
        doc.document_number = document_number

    if expiry_date is not None:
        doc.expiry_date = expiry_date

    # 📂 Replace file if provided
    if file:
        if not file.filename:
            raise HTTPException(400, "Invalid file")

        ext = file.filename.split(".")[-1]
        filename = f"{doc.document_type}.{ext}"

        paths = build_document_paths(
            tenant_id=driver.tenant_id,
            entity="drivers",
            entity_id=driver.driver_id,
            filename=filename,
        )

        # delete old file if exists
        if doc.document_url and os.path.exists(paths["absolute_path"]):
            try:
                os.remove(paths["absolute_path"])
            except Exception:
                pass

        # save new file
        with open(paths["absolute_path"], "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        doc.document_url = paths["relative_path"]

    # 🔄 Reset verification if edited
    doc.verification_status = "pending"
    doc.updated_by = driver.user_id

    db.commit()
    db.refresh(doc)

    return doc


@router.delete(
    "/documents/{document_id}",
    status_code=204,
)
def delete_driver_document(
    document_id: int,
    db: Session = Depends(get_db),
    driver=Depends(require_driver),
):
    doc = (
        db.query(DriverDocument)
        .filter(
            DriverDocument.document_id == document_id,
            DriverDocument.driver_id == driver.driver_id,
            DriverDocument.tenant_id == driver.tenant_id,
        )
        .first()
    )

    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    # ❌ Block delete if document is already approved
    if doc.verification_status == "approved":
        raise HTTPException(
            status_code=403,
            detail="Cannot delete an approved document. Please contact tenant admin."
        )

    # 🗑️ Delete file from disk
    if doc.document_url:
        try:
            abs_path = os.path.join(
                settings.MEDIA_ROOT,
                doc.document_url.lstrip("/")
            )
            if os.path.exists(abs_path):
                os.remove(abs_path)
        except Exception:
            pass  # do not block deletion

    db.delete(doc)
    db.commit()

    return

@router.post("/driver/submit-documents")
def submit_driver_documents(
    db: Session = Depends(get_db),
    driver = Depends(require_driver),
):
    if driver.onboarding_status == "completed":
        return {"ok": True, "status": "already_completed"}

    # ensure at least one document exists
    has_docs = (
        db.query(DriverDocument)
        .filter(
            DriverDocument.driver_id == driver.driver_id,
            DriverDocument.tenant_id == driver.tenant_id,
        )
        .count()
        > 0
    )

    if not has_docs:
        raise HTTPException(
            status_code=400,
            detail="Upload required documents before submitting",
        )

    driver.onboarding_status = "completed"
    db.commit()

    return {
        "ok": True,
        "onboarding_status": driver.onboarding_status,
    }
