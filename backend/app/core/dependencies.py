from app.core.database import SessionLocal


def get_db():
    db = SessionLocal()
    try:
        yield db
        db.commit()
    except Exception:
        db.rollback()
        raise   # 👈 THIS IS CRITICAL
    finally:
        db.close()

