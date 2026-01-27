import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircle, Phone, Lock, CheckCircle } from "lucide-react";
import { useUserAuth } from "../../context/UserAuthContext";
import { userAuthApi } from "../../services/userAuthApi";
import { CountrySelector } from "../../components/auth/CountrySelector";
import { OTPInput } from "../../components/auth/OTPInput";
import { RoleSelectionModal } from "../../components/auth/RoleSelectionModal";
import { Car } from 'lucide-react'
export const UserLogin = () => {
  const navigate = useNavigate();
  const { loginUser, switchUserRole } = useUserAuth();

  // Step management
  const [currentStep, setCurrentStep] = useState("phone"); // phone, otp, role-selection
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Phone step
  const [countryCode, setCountryCode] = useState("+91");
  const [phoneNumber, setPhoneNumber] = useState("");

  // OTP step
  const [otp, setOtp] = useState("");
  const [resendTimer, setResendTimer] = useState(0);
  const [resendCount, setResendCount] = useState(0);

  // Role selection
  const [availableRoles, setAvailableRoles] = useState([]);
  const [currentRole, setCurrentRole] = useState(null);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedRoleKey, setSelectedRoleKey] = useState(null);

  // Resend timer logic
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  // Validate phone number (basic validation)
  const isValidPhone = () => {
    const digitsOnly = phoneNumber.replace(/\D/g, "");
    return digitsOnly.length >= 10;
  };

  // Handle phone submission
  const handlePhoneSubmit = async (e) => {
    e.preventDefault();
    if (!isValidPhone()) {
      setError("Please enter a valid phone number");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const fullPhone = countryCode + phoneNumber.replace(/\D/g, "");
      await userAuthApi.requestOtp(fullPhone);

      // Move to OTP step
      setCurrentStep("otp");
      setOtp("");
      setResendTimer(30);
      setResendCount(resendCount + 1);
    } catch (err) {
      setError(err.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  // Handle OTP resend
  const handleResendOTP = async () => {
    setLoading(true);
    setError("");

    try {
      const fullPhone = countryCode + phoneNumber.replace(/\D/g, "");
      await userAuthApi.requestOtp(fullPhone);
      setOtp("");
      setResendTimer(30);
      setResendCount(resendCount + 1);
    } catch (err) {
      setError(err.message || "Failed to resend OTP");
    } finally {
      setLoading(false);
    }
  };

  // Handle OTP completion
  const handleOTPComplete = async (completedOtp) => {
    setLoading(true);
    setError("");

    try {
      const fullPhone = countryCode + phoneNumber.replace(/\D/g, "");
      const result = await userAuthApi.verifyOtp(fullPhone, completedOtp);

      // User is logged in with their role
      loginUser(result.access_token, fullPhone);

      // Fetch available roles to determine next step
      const rolesData = await userAuthApi.getAvailableRoles();
      setAvailableRoles(rolesData.roles);
      setCurrentRole(rolesData.current_role);

      // Check if multiple roles exist
      if (rolesData.roles.length > 1) {
        setShowRoleModal(true);
        setCurrentStep("role-selection");
      } else {
        // Auto-redirect with single role
        redirectToDashboard(rolesData.current_role);
      }
    } catch (err) {
      setError(err.message || "Invalid OTP");
      setOtp("");
    } finally {
      setLoading(false);
    }
  };

  // Handle role selection
  const handleRoleSelect = async (selectedRole) => {
  setSelectedRoleKey(selectedRole);
  setLoading(true);
  setError("");

  try {
    if (selectedRole !== currentRole) {
      await switchUserRole(selectedRole); // ✅ ONLY context
    }

    redirectToDashboard(selectedRole);
  } catch (err) {
    setError(err.message || "Failed to switch role");
    setSelectedRoleKey(null);
  } finally {
    setLoading(false);
  }
};

  // Navigate to appropriate dashboard
  const redirectToDashboard = (role) => {
    const dashboardMap = {
      rider: "/rider/dashboard",
      driver: "/driver/dashboard",
      "fleet-owner": "/fleet-owner/dashboard",
    };

    const destination = dashboardMap[role] || "/";
    navigate(destination);
  };

  // Go back to phone step
  const handleBackToPhone = () => {
    setCurrentStep("phone");
    setOtp("");
    setError("");
    setPhoneNumber("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-2/5 bg-gradient-to-b from-blue-600 to-indigo-700 text-white flex-col justify-center items-center p-12">
        <div className="text-center">
          <div className="mb-8">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl"><Car color="red" size={24} /></span>
            </div>
          </div>
          <h1 className="text-4xl font-bold mb-4">RideShare</h1>
          <p className="text-xl text-blue-100 mb-8">
            Move smarter. Ride safer.
          </p>
          <div className="space-y-4 text-left bg-white bg-opacity-10 p-6 rounded-lg backdrop-blur">
            <div className="flex items-start gap-3">
              <CheckCircle size={24} className="flex-shrink-0 mt-1" />
              <div>
                <p className="font-semibold">Multi-Role Support</p>
                <p className="text-sm text-blue-100">
                  Switch between rider, driver, and fleet owner roles
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle size={24} className="flex-shrink-0 mt-1" />
              <div>
                <p className="font-semibold">Secure OTP Login</p>
                <p className="text-sm text-blue-100">
                  Phone-based authentication for all users
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle size={24} className="flex-shrink-0 mt-1" />
              <div>
                <p className="font-semibold">Instant Access</p>
                <p className="text-sm text-blue-100">
                  Get started in minutes without passwords
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="w-full lg:w-3/5 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* Step Indicators */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <div
                className={`flex flex-col items-center ${
                  currentStep === "phone" || currentStep === "otp"
                    ? "text-blue-600"
                    : "text-gray-400"
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold mb-2 ${
                    currentStep === "phone" || currentStep === "otp"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200"
                  }`}
                >
                  1
                </div>
                <span className="text-sm">Phone</span>
              </div>

              <div
                className={`flex-1 h-1 mx-4 ${
                  currentStep !== "phone" ? "bg-blue-600" : "bg-gray-200"
                }`}
              />

              <div
                className={`flex flex-col items-center ${
                  currentStep === "otp"
                    ? "text-blue-600"
                    : "text-gray-400"
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold mb-2 ${
                    currentStep === "otp"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200"
                  }`}
                >
                  2
                </div>
                <span className="text-sm">OTP</span>
              </div>

              <div
                className={`flex-1 h-1 mx-4 ${
                  currentStep === "role-selection" ? "bg-blue-600" : "bg-gray-200"
                }`}
              />

              <div
                className={`flex flex-col items-center ${
                  currentStep === "role-selection"
                    ? "text-blue-600"
                    : "text-gray-400"
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold mb-2 ${
                    currentStep === "role-selection"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200"
                  }`}
                >
                  3
                </div>
                <span className="text-sm">Role</span>
              </div>
            </div>
          </div>

          {/* White Card Container */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            {/* Error Alert */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-red-700">{error}</div>
              </div>
            )}

            {/* STEP 1: PHONE NUMBER */}
            {currentStep === "phone" && (
              <form onSubmit={handlePhoneSubmit} className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Enter Your Phone
                  </h2>
                  <p className="text-gray-600">
                    We'll send you an OTP to verify your account
                  </p>
                </div>

                {/* Country Selector */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Country
                  </label>
                  <CountrySelector
                    value={countryCode}
                    onChange={setCountryCode}
                  />
                </div>

                {/* Phone Number Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone
                      className="absolute left-3 top-3 text-gray-400"
                      size={20}
                    />
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) =>
                        setPhoneNumber(e.target.value.replace(/\D/g, ""))
                      }
                      placeholder="9876543210"
                      maxLength="15"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Enter digits only
                  </p>
                </div>

                {/* Continue Button */}
                <button
                  type="submit"
                  disabled={loading || !isValidPhone()}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-bold py-3 rounded-lg transition duration-200 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Sending OTP...
                    </>
                  ) : (
                    <>
                      Continue
                      <span>→</span>
                    </>
                  )}
                </button>
              </form>
            )}

            {/* STEP 2: OTP VERIFICATION */}
            {currentStep === "otp" && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (otp.length === 6) {
                    handleOTPComplete(otp);
                  }
                }}
                className="space-y-6"
              >
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Enter OTP
                  </h2>
                  <p className="text-gray-600">
                    We sent a 6-digit code to{" "}
                    <span className="font-semibold">
                      {countryCode} {phoneNumber}
                    </span>
                  </p>
                </div>

                {/* OTP Input */}
                <div className="py-8">
                  <OTPInput
                    value={otp}
                    onChange={setOtp}
                    length={6}
                    onComplete={handleOTPComplete}
                  />
                </div>

                {/* Resend Logic */}
                <div className="text-center">
                  {resendTimer > 0 ? (
                    <p className="text-gray-600">
                      Resend OTP in{" "}
                      <span className="font-bold text-blue-600">
                        00:{resendTimer.toString().padStart(2, "0")}
                      </span>
                    </p>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResendOTP}
                      disabled={loading}
                      className="text-blue-600 hover:text-blue-700 font-semibold"
                    >
                      Resend OTP
                    </button>
                  )}
                </div>

                {/* Back & Verify Buttons */}
                <div className="space-y-3">
                  <button
                    type="submit"
                    disabled={loading || otp.length < 6}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-bold py-3 rounded-lg transition duration-200 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      <>
                        <Lock size={20} />
                        Verify OTP
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleBackToPhone}
                    disabled={loading}
                    className="w-full border border-gray-300 text-gray-700 font-bold py-3 rounded-lg hover:bg-gray-50 transition duration-200"
                  >
                    Change Phone Number
                  </button>
                </div>
              </form>
            )}

            {/* Additional Info */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <p className="text-xs text-gray-500 text-center">
                By signing in, you agree to our{" "}
                <a href="#" className="text-blue-600 hover:underline">
                  Terms of Service
                </a>{" "}
                and{" "}
                <a href="#" className="text-blue-600 hover:underline">
                  Privacy Policy
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Role Selection Modal */}
      <RoleSelectionModal
        isOpen={showRoleModal}
        roles={availableRoles}
        currentRole={currentRole}
        onSelectRole={handleRoleSelect}
        isLoading={loading}
      /> 
    </div>
  );
};
