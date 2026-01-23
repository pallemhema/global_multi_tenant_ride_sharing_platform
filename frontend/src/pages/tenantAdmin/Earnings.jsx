const Earnings = () => {
  return (
    <div className="p-8 space-y-6">
      <h2 className="text-xl font-bold">Earnings Analytics</h2>

      {/* Country level */}
      <div className="bg-white rounded-xl border p-6">
        <h3 className="font-semibold mb-4">By Country</h3>
        <ul className="space-y-2 text-sm">
          <li>🇮🇳 India — $45,200</li>
          <li>🇺🇸 USA — $38,900</li>
          <li>🇬🇧 UK — $22,100</li>
        </ul>
      </div>

      {/* City level */}
      <div className="bg-white rounded-xl border p-6">
        <h3 className="font-semibold mb-4">By City</h3>
        <ul className="space-y-2 text-sm">
          <li>Mumbai — $18,500</li>
          <li>New York — $21,000</li>
          <li>London — $14,300</li>
        </ul>
      </div>
    </div>
  );
};

export default Earnings;
