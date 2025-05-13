export default function Home() {
  return (
    <div className="space-y-6">
      {/* Sezione Brogliaccio */}
      <section className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-4">Brogliaccio</h2>
        <div className="min-h-[300px] flex items-center justify-center text-gray-500">
          Contenuto del brogliaccio in arrivo...
        </div>
      </section>

      {/* Sezione Registri */}
      <section className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-4">Registri</h2>
        <div className="min-h-[300px] flex items-center justify-center text-gray-500">
          Contenuto dei registri in arrivo...
        </div>
      </section>
    </div>
  );
} 