export default function Home() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-gray-900 mb-8">
        Gestione Turni CTSR
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Stazioni</h2>
          <p className="text-gray-600">Gestisci i turni delle stazioni</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Fermate</h2>
          <p className="text-gray-600">Gestisci i turni delle fermate</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">PL</h2>
          <p className="text-gray-600">Gestisci i turni del personale di linea</p>
        </div>
      </div>
    </div>
  )
} 