
// import React, { useState } from 'react';
// import PhoneLogin from './PhoneLogin';
// import OTPVerify from './OTPVerify';

// import { useAuth } from '../../context/AuthContext';

// import { authService } from '../../services/auth';

// import { useNavigate } from "react-router-dom";
// import {jwtDecode} from "jwt-decode";
// import { redirectByRole } from "../../auth/roleRedirect";


// const Auth = () => {
//   const [step, setStep] = useState('PHONE'); // 'PHONE' | 'OTP' | 'SUCCESS'
//   const [phoneNumber, setPhoneNumber] = useState('');
//   const [countryCode, setCountryCode] = useState('+91');
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState(null);
//   const [authData, setAuthData] = useState(null);

//   const { login } = useAuth();


//   const handlePhoneSubmit = async (phone, code) => {
//     setLoading(true);
//     setError(null);
//     try {
//       const fullPhone = `${code}${phone}`;
//       await authService.requestOtp(fullPhone);
//       setPhoneNumber(phone);
//       setCountryCode(code);
//       setStep('OTP');
//     } catch (err) {
//       setError(err.message || 'Failed to send OTP. Please try again.');
//     } finally {
//       setLoading(false);
//     }
//   };



// const navigate = useNavigate();

// const handleOtpVerify = async (otp) => {
//   setLoading(true);
//   setError(null);

//   try {
//     const fullPhone = `${countryCode}${phoneNumber}`;
//     const response = await authService.verifyOtp(fullPhone, otp);

//     // ✅ single source of truth
//     login(response.access_token);

//     const decoded = jwtDecode(response.access_token);
//     navigate(redirectByRole(decoded.role), { replace: true });

//   } catch (err) {
//     setError(err.message || "Invalid OTP. Please try again.");
//   } finally {
//     setLoading(false);
//   }
// };



//   const handleBack = () => {
//     setStep('PHONE');
//     setError(null);
//   };

//   const handleResend = async () => {
//     setError(null);
//     try {
//       const fullPhone = `${countryCode}${phoneNumber}`;
//       await authService.requestOtp(fullPhone);
//     } catch (err) {
//       setError('Failed to resend OTP.');
//     }
//   };

//   return (
//    <div className="min-h-screen flex flex-col md:flex-row">

      
//       {/* LEFT SIDE – IMAGE / BRAND PANEL */}
// <div className="flex md:w-1/2 w-full h-64 md:h-auto bg-indigo-500 text-white items-center justify-center">
//         <div className="text-center px-12">
//           <div className="text-5xl mb-6">🚗</div>
//           <h1 className="text-3xl font-bold mb-4">Ride with ease</h1>
//           <p className="text-indigo-100 text-lg leading-relaxed">
//             Book rides, track drivers, and move smarter with our platform.
//           </p>
//         </div>
//       </div>

//       {/* RIGHT SIDE – FORM */}
//     <div className="w-full md:w-1/2 flex items-center justify-center bg-blue-100">
//         {/* <div className="w-full max-w-md px-6"> */}
//         {step === 'PHONE' && (
//           <PhoneLogin 
//             onContinue={handlePhoneSubmit} 
//             loading={loading} 
//             error={error} 
//           />
//         )}

//         {step === 'OTP' && (
//           <OTPVerify 
//             phoneNumber={phoneNumber}
//             countryCode={countryCode}
//             onVerify={handleOtpVerify}
//             onBack={handleBack}
//             onResend={handleResend}
//             loading={loading}
//             error={error}
//           />
//         )}

//         {step === 'SUCCESS' && (
//           <div className="text-center py-10 animate-in fade-in zoom-in duration-500">
//             <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
//               <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
//               </svg>
//             </div>
//             <h2 className="text-2xl font-bold text-slate-800">Verified!</h2>
//             <p className="text-slate-500 mt-2 mb-8">Welcome to the platform. {authData?.is_new_user ? 'Your account was created.' : 'Glad to see you again.'}</p>
//             <button 
//               onClick={() => window.location.reload()}
//               className="text-indigo-600 font-semibold hover:text-indigo-700 transition-colors"
//             >
//               Back to Start
//             </button>
//           </div>
//         )}
//       </div>

      
//     </div>
  
//     // <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-slate-50">
//     //   {/* App Branding */}
//     //   <div className="mb-8 text-center">
//     //     <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-indigo-200">
//     //       <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//     //         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
//     //       </svg>
//     //     </div>
//     //     <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Ride Platform</h1>
//     //     <p className="text-slate-500 font-medium mt-1">Fast. Reliable. Safe rides.</p>
//     //   </div>

//     //   {/* Main Container */}
//     //   <div className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/60 p-8 md:p-10 border border-slate-100 overflow-hidden relative">
//     //     {step === 'PHONE' && (
//     //       <PhoneLogin 
//     //         onContinue={handlePhoneSubmit} 
//     //         loading={loading} 
//     //         error={error} 
//     //       />
//     //     )}

//     //     {step === 'OTP' && (
//     //       <OTPVerify 
//     //         phoneNumber={phoneNumber}
//     //         countryCode={countryCode}
//     //         onVerify={handleOtpVerify}
//     //         onBack={handleBack}
//     //         onResend={handleResend}
//     //         loading={loading}
//     //         error={error}
//     //       />
//     //     )}

//     //     {step === 'SUCCESS' && (
//     //       <div className="text-center py-10 animate-in fade-in zoom-in duration-500">
//     //         <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
//     //           <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//     //             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
//     //           </svg>
//     //         </div>
//     //         <h2 className="text-2xl font-bold text-slate-800">Verified!</h2>
//     //         <p className="text-slate-500 mt-2 mb-8">Welcome to the platform. {authData?.is_new_user ? 'Your account was created.' : 'Glad to see you again.'}</p>
//     //         <button 
//     //           onClick={() => window.location.reload()}
//     //           className="text-indigo-600 font-semibold hover:text-indigo-700 transition-colors"
//     //         >
//     //           Back to Start
//     //         </button>
//     //       </div>
//     //     )}
//     //   </div>

//     //   {/* Footer Info */}
//     //   <div className="mt-8 text-slate-400 text-sm">
//     //     &copy; 2025 Ride Platform Inc.
//     //   </div>
//     // </div>
//   );
// };

// export default Auth;

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import PhoneLogin from "./PhoneLogin";
import OTPVerify from "./OTPVerify";

import { useAuth } from "../../context/AuthContext";
import { authService } from "../../services/auth";
import {redirectByRole} from "../../routes/RoleRedirect"

const Auth = () => {
  const [step, setStep] = useState("PHONE"); // PHONE | OTP
  const [phoneNumber, setPhoneNumber] = useState("");
  const [countryCode, setCountryCode] = useState("+91");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const { login, user } = useAuth();
  const navigate = useNavigate();

  /* ---------------------------------
     Redirect when user is set
  ----------------------------------*/
  useEffect(() => {
    if (user?.role) {
      navigate(redirectByRole(user.role), { replace: true });
    }
  }, [user, navigate]);

  /* ---------------------------------
     Phone submit
  ----------------------------------*/
  const handlePhoneSubmit = async (phone, code) => {
    setLoading(true);
    setError(null);

    try {
      const fullPhone = `${code}${phone}`;
      await authService.requestOtp(fullPhone);
      setPhoneNumber(phone);
      setCountryCode(code);
      setStep("OTP");
    } catch (err) {
      setError(err.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  /* ---------------------------------
     OTP verify
  ----------------------------------*/
  const handleOtpVerify = async (otp) => {
    setLoading(true);
    setError(null);

    try {
      const fullPhone = `${countryCode}${phoneNumber}`;
      const response = await authService.verifyOtp(fullPhone, otp);

      // 🔥 only this
      login(response.access_token);

    } catch (err) {
      setError(err.message || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setStep("PHONE");
    setError(null);
  };

  const handleResend = async () => {
    try {
      const fullPhone = `${countryCode}${phoneNumber}`;
      await authService.requestOtp(fullPhone);
    } catch {
      setError("Failed to resend OTP");
    }
  };

  /* ---------------------------------
     UI
  ----------------------------------*/
  return (
    <div className="min-h-screen flex flex-col md:flex-row">

      {/* LEFT PANEL */}
      <div className="md:w-1/2 bg-indigo-500 text-white flex items-center justify-center">
        <div className="text-center px-12">
          <div className="text-5xl mb-6">🚗</div>
          <h1 className="text-3xl font-bold mb-4">Ride with ease</h1>
          <p className="text-indigo-100 text-lg">
            Book rides, manage fleets, and operate seamlessly.
          </p>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="md:w-1/2 flex items-center justify-center bg-blue-100">
        {step === "PHONE" && (
          <PhoneLogin
            onContinue={handlePhoneSubmit}
            loading={loading}
            error={error}
          />
        )}

        {step === "OTP" && (
          <OTPVerify
            phoneNumber={phoneNumber}
            countryCode={countryCode}
            onVerify={handleOtpVerify}
            onBack={handleBack}
            onResend={handleResend}
            loading={loading}
            error={error}
          />
        )}
      </div>
    </div>
  );
};

export default Auth;
