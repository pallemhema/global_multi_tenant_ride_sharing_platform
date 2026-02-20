class DriverOnboardingStatus:
    NOT_STARTED = "not_started"
    TENANT_SELECTED = "tenant_selected"
    LOCATION_SELECTED = "location_selected"
    DRIVER_TYPE_SELECTED = "driver_type_selected"
    DOCUMENTS_UPLOADED = "documents_uploaded"
    COMPLETED = "completed"

DRIVER_ONBOARDING_FLOW = [
    DriverOnboardingStatus.NOT_STARTED,
    DriverOnboardingStatus.TENANT_SELECTED,
    DriverOnboardingStatus.LOCATION_SELECTED,
    DriverOnboardingStatus.DRIVER_TYPE_SELECTED,
    DriverOnboardingStatus.COMPLETED,
]