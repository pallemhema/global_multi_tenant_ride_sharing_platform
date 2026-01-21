
import React, { useState } from 'react';

import Button from '../../components/Button';

const PhoneLogin = ({ onContinue, loading, error }) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [countryCode, setCountryCode] = useState('+91');

  const isValid = phoneNumber.length >= 10;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isValid) {
      onContinue(phoneNumber, countryCode);
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-slate-800">Login</h2>
        <p className="text-slate-500 mt-2">Enter your phone to get started</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <div>
            <label htmlFor="country" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">
              Select Country
            </label>
            <div className="relative">
              <select
                id="country"
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
                className="w-full px-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:ring-0 focus:border-indigo-500 focus:bg-white transition-all appearance-none text-slate-800 font-medium pr-10"
              >
                <option value="+91">🇮🇳 India (+91)</option>
                <option value="+1">🇺🇸 United States (+1)</option>
                <option value="+44">🇬🇧 United Kingdom (+44)</option>
                <option value="+61">🇦🇺 Australia (+61)</option>
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="phone" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">
              Phone Number
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold tracking-tight">
                {countryCode}
              </span>
              <input
                id="phone"
                type="tel"
                placeholder="00000 00000"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                className="w-full pl-16 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:ring-0 focus:border-indigo-500 focus:bg-white transition-all text-slate-800 font-bold tracking-[0.2em]"
                autoFocus
              />
            </div>
            {error && <p className="mt-3 text-sm text-red-500 font-semibold pl-1">{error}</p>}
            <p className="mt-4 text-[11px] text-slate-400 text-center font-medium leading-relaxed">
              By continuing, you agree to receive an automated SMS for verification.
            </p>
          </div>
        </div>

        <Button 
          type="submit" 
          disabled={!isValid} 
          loading={loading}
        >
          Continue
        </Button>
      </form>

      <div className="mt-8 flex items-center justify-center space-x-4">
        <div className="h-px bg-slate-100 flex-1"></div>
        <span className="text-[10px] uppercase font-bold text-slate-300 tracking-[0.2em]">Social Connect</span>
        <div className="h-px bg-slate-100 flex-1"></div>
      </div>

      <div className="mt-6 flex justify-center space-x-4">
        <button className="p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors border border-slate-100">
          <svg className="w-5 h-5 text-slate-600" fill="currentColor" viewBox="0 0 24 24"><path d="M12.48 10.92v3.28h4.78c-.19 1.06-1.22 3.11-4.78 3.11-3.09 0-5.61-2.56-5.61-5.71s2.52-5.71 5.61-5.71c1.76 0 2.94.75 3.61 1.39l2.58-2.48C17.01 3.22 14.94 2 12.48 2 6.69 2 2 6.7 2 12.5S6.69 23 12.48 23c5.98 0 10.19-4.21 10.19-10.29 0-.69-.07-1.22-.19-1.79h-10z"/></svg>
        </button>
        <button className="p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors border border-slate-100">
          <svg className="w-5 h-5 text-slate-600" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
        </button>
      </div>
    </div>
  );
};

export default PhoneLogin;
