export default function AdminPage() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Amministrazione</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Card per la gestione degli agenti */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Agenti</h2>
          <p className="text-gray-600 mb-4">Gestisci il personale e le mansioni</p>
          <button className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600">
            Gestisci Agenti
          </button>
        </div>

        {/* Card per la gestione dei turni */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Turni</h2>
          <p className="text-gray-600 mb-4">Configura i turni e le ciclicità</p>
          <button className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600">
            Gestisci Turni
          </button>
        </div>

        {/* Card per la gestione degli impianti */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Impianti</h2>
          <p className="text-gray-600 mb-4">Gestisci gli impianti e i righelli</p>
          <button className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600">
            Gestisci Impianti
          </button>
        </div>

        {/* Card per la gestione delle mansioni */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Mansioni</h2>
          <p className="text-gray-600 mb-4">Gestisci le mansioni e le qualifiche</p>
          <a href="/admin/mansioni" className="inline-block">
            <button className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600">
              Gestisci Mansioni
            </button>
          </a>
        </div>
      </div>
    </div>
  );
} 