
import React from 'react';

const Button = ({ 
  children, 
  loading, 
  disabled, 
  variant = 'primary', 
  className = '', 
  ...props 
}) => {
  const baseStyles = "w-full py-4 px-6 rounded-2xl font-bold transition-all duration-300 flex items-center justify-center space-x-2 focus:outline-none focus:ring-4 focus:ring-offset-2 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-xl hover:shadow-indigo-200 active:scale-[0.98] focus:ring-indigo-200 disabled:opacity-40 disabled:hover:shadow-none disabled:active:scale-100",
    secondary: "bg-indigo-50 text-indigo-700 hover:bg-indigo-100 focus:ring-indigo-100",
    outline: "border-2 border-slate-200 text-slate-600 hover:bg-slate-50 focus:ring-slate-100"
  };

  return (
    <button 
      disabled={disabled || loading}
      className={`${baseStyles} ${variants[variant]} ${className}`}
      {...props}
    >
      {loading ? (
        <svg className="animate-spin h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ) : (
        <span className="tracking-wide uppercase text-sm">{children}</span>
      )}
    </button>
  );
};

export default Button;
