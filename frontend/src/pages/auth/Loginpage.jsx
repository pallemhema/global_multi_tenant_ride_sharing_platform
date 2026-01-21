import PhoneLogin from './PhoneLogin';

const LoginPage = () => {
  return (
    <div className="min-h-screen flex">
      
      {/* LEFT SIDE – IMAGE / BRAND PANEL */}
      <div className="hidden md:flex w-1/2 bg-indigo-500 text-white items-center justify-center">
        <div className="text-center px-12">
          <div className="text-5xl mb-6">🚗</div>
          <h1 className="text-3xl font-bold mb-4">Ride with ease</h1>
          <p className="text-indigo-100 text-lg leading-relaxed">
            Book rides, track drivers, and move smarter with our platform.
          </p>
        </div>
      </div>

      {/* RIGHT SIDE – FORM */}
      <div className="w-full md:w-1/2 flex items-center justify-center bg-blue-100">
        <div className="w-full max-w-md px-6">
          <PhoneLogin />
        </div>
      </div>

    </div>
  );
};

export default LoginPage;
