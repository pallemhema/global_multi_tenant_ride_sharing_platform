# app/api/v1/driver/documents.py

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.dependencies import get_db
from app.core.security.roles import require_driver

from app.models.core.drivers.driver_documents import DriverDocument

from app.schemas.core.drivers.driver_docuemnts import (
    DriverDocumentCreate,
    DriverDocumentOut,
)

router = APIRouter(
    prefix="/driver",
    tags=["Driver – Documents"],
)



@router.post(
    "/documents",
    response_model=DriverDocumentOut,
)
def upload_driver_document(
    payload: DriverDocumentCreate,
    db: Session = Depends(get_db),
    driver=Depends(require_driver),
):
    doc = DriverDocument(
        tenant_id=driver.tenant_id,
        driver_id=driver.driver_id,
        document_type=payload.document_type,
        document_number=payload.document_number,
        document_url=payload.document_url,
        expiry_date=payload.expiry_date,
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
