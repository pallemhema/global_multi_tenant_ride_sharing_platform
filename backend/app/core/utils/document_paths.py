import os

BASE_UPLOAD_DIR = "app/uploads"

def build_document_paths(
    tenant_id: int,
    entity: str,     # tenant | drivers | vehicles | fleet_owners
    entity_id: int | None,
    filename: str,
):
    if entity == "tenant":
        relative_dir = f"/uploads/tenants/{tenant_id}/tenant_documents"
        absolute_dir = f"{BASE_UPLOAD_DIR}/tenants/{tenant_id}/tenant_documents"
    else:
        relative_dir = f"/uploads/tenants/{tenant_id}/{entity}/{entity_id}"
        absolute_dir = f"{BASE_UPLOAD_DIR}/tenants/{tenant_id}/{entity}/{entity_id}"

    os.makedirs(absolute_dir, exist_ok=True)

    return {
        "relative_path": f"{relative_dir}/{filename}",
        "absolute_path": f"{absolute_dir}/{filename}",
    }
