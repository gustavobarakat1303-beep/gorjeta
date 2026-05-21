
import React from 'react';
import { db } from '../services/dataService';
import { Utensils, CalendarDays, MapPin, ChevronLeft, Home, ExternalLink, Info } from 'lucide-react';
import { Link } from 'react-router-dom';

const MenuAndReservations = () => {
  const units = db.units.all().filter(u => u.active && (u.menuUrl || u.reservationUrl));

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 px-6 py-5 flex items-center justify-between shadow-sm">
        <Link to="/" className="p-2 -ml-2 text-slate-400 hover:text-indigo-600 transition-colors">
          <ChevronLeft size={24} />
        </Link>
        <h1 className="text-sm font-black uppercase tracking-widest text-center flex-1">Cardápio & Reservas</h1>
        <Link to="/" className="p-2 -mr-2 text-slate-400 hover:text-indigo-600 transition-colors">
          <Home size={20} />
        </Link>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-10">
        <div className="mb-10 text-center">
          <div className="inline-flex p-4 bg-indigo-600 rounded-3xl shadow-xl shadow-indigo-200 mb-6 text-white">
            <Utensils size={32} />
          </div>
          <h2 className="text-3xl font-black text-slate-900 mb-3 tracking-tight">Experiências Gastronômicas</h2>
          <p className="text-slate-500 font-medium text-sm px-4">Confira os cardápios exclusivos e garanta sua mesa em nossas unidades parceiras.</p>
        </div>

        <div className="space-y-6">
          {units.length > 0 ? (
            units.map(unit => (
              <div key={unit.id} className="bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-black text-slate-900 mb-1">{unit.name}</h3>
                    <div className="flex items-center gap-1.5 text-slate-400 text-xs font-bold uppercase tracking-wider">
                      <MapPin size={14} className="text-indigo-500" />
                      {unit.city}
                    </div>
                  </div>
                  {unit.logoUrl && (
                     <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center p-2 overflow-hidden shadow-inner">
                        <img src={unit.logoUrl} alt={unit.name} className="max-w-full max-h-full object-contain" />
                     </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {unit.menuUrl && (
                    <a 
                      href={unit.menuUrl} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="flex items-center justify-between gap-3 p-5 bg-emerald-50 text-emerald-700 rounded-2xl hover:bg-emerald-100 transition-all border border-emerald-100 group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-emerald-600 rounded-xl text-white shadow-lg shadow-emerald-200 group-hover:scale-110 transition-transform">
                          <Utensils size={18} />
                        </div>
                        <span className="font-black text-xs uppercase tracking-widest">Cardápio</span>
                      </div>
                      <ExternalLink size={14} className="opacity-50" />
                    </a>
                  )}
                  
                  {unit.reservationUrl && (
                    <a 
                      href={unit.reservationUrl} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="flex items-center justify-between gap-3 p-5 bg-indigo-50 text-indigo-700 rounded-2xl hover:bg-indigo-100 transition-all border border-indigo-100 group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-indigo-600 rounded-xl text-white shadow-lg shadow-indigo-200 group-hover:scale-110 transition-transform">
                          <CalendarDays size={18} />
                        </div>
                        <span className="font-black text-xs uppercase tracking-widest">Reservas</span>
                      </div>
                      <ExternalLink size={14} className="opacity-50" />
                    </a>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white rounded-[2.5rem] p-12 border border-slate-200 text-center shadow-sm">
              <div className="inline-flex p-5 bg-slate-100 rounded-full text-slate-400 mb-4">
                <Info size={32} />
              </div>
              <p className="text-slate-500 font-bold uppercase text-xs tracking-widest leading-loose">Nenhuma unidade com links<br/>disponíveis no momento.</p>
            </div>
          )}
        </div>
      </main>

      <footer className="text-center py-10 opacity-30 select-none">
        <p className="text-[10px] font-black tracking-[0.3em] uppercase text-slate-400 italic">VoucherHub Experiências</p>
      </footer>
    </div>
  );
};

export default MenuAndReservations;
