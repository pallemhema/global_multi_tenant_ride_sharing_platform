
import React, { useState, useEffect, useRef } from 'react';
import Button from '../../components/Button';

const OTPVerify = ({ 
  phoneNumber, 
  countryCode, 
  onVerify, 
  onBack, 
  onResend, 
  loading, 
  error 
}) => {
  const [otp, setOtp] = useState(new Array(6).fill(""));
  const [timer, setTimer] = useState(30);
  const inputRefs = useRef([]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleChange = (element, index) => {
    const value = element.value.replace(/[^0-9]/g, "");
    if (!value && element.value !== "") return;

    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);

    // Focus next input
    if (value !== "" && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto submit if all filled
    if (newOtp.every(val => val !== "")) {
      onVerify(newOtp.join(""));
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleResend = () => {
    if (timer === 0) {
      setTimer(30);
      onResend();
    }
  };

  const isFormComplete = otp.every(val => val !== "");

  return (
    <div className="animate-in fade-in slide-in-from-right-4 duration-500 p-1">
      <button 
        onClick={onBack}
        className="mb-6 flex items-center text-indigo-600 text-sm font-bold hover:text-indigo-700 transition-colors group"
      >
        <svg className="w-4 h-4 mr-1 transform transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
        </svg>
        Edit Phone Number
      </button>

      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-slate-800">Verify OTP</h2>
        <p className="text-slate-500 mt-2">
          Enter the 6-digit code sent to <br/>
          <span className="font-semibold text-slate-700 tracking-wide">{countryCode} {phoneNumber}</span>
        </p>
      </div>

      <div className="space-y-8">
        <div className="flex justify-between gap-2 sm:gap-3">
          {otp.map((data, index) => (
            <input
              key={index}
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={1}
              ref={(el) => (inputRefs.current[index] = el)}
              value={data}
              onChange={(e) => handleChange(e.target, index)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              className="w-full aspect-square text-center text-2xl font-bold bg-slate-50 border-2 border-slate-100 rounded-2xl otp-input transition-all outline-none focus:bg-white text-indigo-600 focus:border-indigo-500"
              autoFocus={index === 0}
            />
          ))}
        </div>

        <div className="space-y-4">
          <Button 
            onClick={() => onVerify(otp.join(""))}
            disabled={!isFormComplete} 
            loading={loading}
          >
            Verify & Continue
          </Button>

          <div className="text-center">
            {timer > 0 ? (
              <p className="text-sm text-slate-400 font-medium">
                Resend code in <span className="text-indigo-600">{timer}s</span>
              </p>
            ) : (
              <button 
                onClick={handleResend}
                className="text-sm text-indigo-600 font-bold hover:underline"
              >
                Resend OTP
              </button>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="mt-6 p-4 bg-red-50 rounded-xl border border-red-100 animate-in fade-in duration-300">
          <p className="text-sm text-red-600 font-medium text-center">{error}</p>
        </div>
      )}
    </div>
  );
};

export default OTPVerify;
