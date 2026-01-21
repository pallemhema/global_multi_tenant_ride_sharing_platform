class TripStatus(Base):
    __tablename__ = "lu_trip_status"

    status_code: Mapped[str] = mapped_column(Text, primary_key=True)
    description: Mapped[str] = mapped_column(Text, nullable=False)

class DriverRuntimeStatus(Base):
    __tablename__ = "lu_driver_runtime_status"

    status_code: Mapped[str] = mapped_column(Text, primary_key=True)
    description: Mapped[str] = mapped_column(Text, nullable=False)
