def normalize_phone(phone: str) -> str:
    phone = phone.strip().replace(" ", "")

    # If already E.164
    if phone.startswith("+"):
        return phone

    # India default (adjust later)
    if phone.startswith("91") and len(phone) == 12:
        return f"+{phone}"

    # 10-digit Indian number
    if len(phone) == 10:
        return f"+91{phone}"

    raise ValueError("Invalid phone number format")
