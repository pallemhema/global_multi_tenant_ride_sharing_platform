class FleetOnboardingStatus:
    NOT_STARTED = "not_started"
    TENANT_SELECTED = "tenant_selected"
    LOCATION_SELECTED = "location_selected"
    DETAILS_FILLED = "fleet_details_filled"
    COMPLETED = "completed"


FLEET_ONBOARDING_FLOW = [
    FleetOnboardingStatus.NOT_STARTED,
    FleetOnboardingStatus.TENANT_SELECTED,
    FleetOnboardingStatus.LOCATION_SELECTED,
    FleetOnboardingStatus.DETAILS_FILLED,
    FleetOnboardingStatus.COMPLETED,
]
