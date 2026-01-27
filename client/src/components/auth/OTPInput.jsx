import { useEffect, useRef } from "react";

export const OTPInput = ({ value, onChange, length = 6, onComplete }) => {
  const inputRefs = useRef([]);

  // Handle input change
  const handleChange = (index, newValue) => {
    // Allow only digits
    const digit = newValue.replace(/[^0-9]/g, "");

    const newOTP = value.split("");
    newOTP[index] = digit;
    const otpString = newOTP.join("");

    onChange(otpString);

    // Auto-focus next input
    if (digit && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // Call onComplete if all digits filled
    if (otpString.length === length && digit) {
      onComplete?.(otpString);
    }
  };

  // Handle backspace
  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace") {
      e.preventDefault();

      const newOTP = value.split("");
      newOTP[index] = "";
      const otpString = newOTP.join("");

      onChange(otpString);

      // Move to previous input if current is empty
      if (index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    }

    // Move to next on right arrow
    if (e.key === "ArrowRight" && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // Move to previous on left arrow
    if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Handle paste
  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text");
    const digits = pastedData.replace(/[^0-9]/g, "").slice(0, length);

    if (digits.length > 0) {
      onChange(digits.padEnd(length, ""));
      
      // Auto-focus the next empty input
      const nextIndex = Math.min(digits.length, length - 1);
      inputRefs.current[nextIndex]?.focus();

      if (digits.length === length) {
        onComplete?.(digits);
      }
    }
  };

  return (
    <div className="flex gap-3 justify-center">
      {Array.from({ length }).map((_, index) => (
        <input
          key={index}
          ref={(ref) => (inputRefs.current[index] = ref)}
          type="text"
          maxLength="1"
          value={value[index] || ""}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          placeholder="0"
          className="w-12 h-12 text-center text-2xl font-bold border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition"
        />
      ))}
    </div>
  );
};
