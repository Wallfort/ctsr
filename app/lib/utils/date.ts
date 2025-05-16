import { getDate, getMonth, getDay } from 'date-fns';

// Funzione per verificare se una data è un festivo italiano
export function isFestivoItaliano(data: Date): boolean {
  const giorno = getDate(data);
  const mese = getMonth(data);
  const giornoSettimana = getDay(data);

  // Domenica
  if (giornoSettimana === 0) return true;

  // Festivi fissi
  const festiviFissi = [
    { giorno: 1, mese: 0 },   // Capodanno
    { giorno: 6, mese: 0 },   // Epifania
    { giorno: 25, mese: 3 },  // Liberazione
    { giorno: 1, mese: 4 },   // Festa del Lavoro
    { giorno: 2, mese: 5 },   // Repubblica
    { giorno: 15, mese: 7 },  // Ferragosto
    { giorno: 1, mese: 10 },  // Tutti i Santi
    { giorno: 8, mese: 11 },  // Immacolata
    { giorno: 25, mese: 11 }, // Natale
    { giorno: 26, mese: 11 }, // Santo Stefano
  ];

  return festiviFissi.some(festivo => festivo.giorno === giorno && festivo.mese === mese);
} 