const Fleets = () => {
  return (
    <div className="p-8">
      <h2 className="text-xl font-bold mb-4">Fleets</h2>

      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500">
            <tr>
              <th className="p-4 text-left">Fleet Name</th>
              <th className="p-4 text-left">Operator</th>
              <th className="p-4 text-left">Operating Region</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-t">
              <td className="p-4 font-medium">Swift Logistics</td>
              <td className="p-4">John Carter</td>
              <td className="p-4">India · Mumbai</td>
            </tr>
            <tr className="border-t">
              <td className="p-4 font-medium">Metro Fleet</td>
              <td className="p-4">Sarah Lee</td>
              <td className="p-4">USA · New York</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Fleets;
