import shutil
from datetime import date
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from sqlalchemy.orm import Session

from app.core.dependencies import get_db
from app.core.security.roles import require_driver
from app.models.core.drivers.driver_documents import DriverDocument
from app.schemas.core.drivers.driver_docuemnts import DriverDocumentOut
from app.core.utils.document_paths import build_document_paths

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
