import React, { useState } from 'react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameMonth, isSameDay, isBefore, startOfDay } from 'date-fns';
import { fr } from 'date-fns/locale';

export const Calendar = ({ selected, onSelect }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const daysOfWeek = ['lu', 'ma', 'me', 'je', 've', 'sa', 'di'];

  // Générer les jours du mois courant
  const start = startOfMonth(currentDate);
  const end = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start, end });

  // Calculer le décalage pour le premier jour (pour que le 1er tombe sur le bon jour de la semaine)
  const prefixDays = (getDay(start) + 6) % 7;

  const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const handlePrevMonth = () => setCurrentDate(subMonths(currentDate, 1));


  return (
    <div className="w-full max-w-md p-6 bg-slate-950/40 rounded-xl border border-slate-800 select-none text-white">
      {/* En-tête : Mois et Flèches */}
      <div className="flex justify-between items-center mb-6 px-2">
        <h3 className="text-lg font-semibold text-slate-200 capitalize">
          {format(currentDate, 'MMMM yyyy', { locale: fr })}
        </h3>
        <div className="flex gap-4 text-slate-400">
          <button onClick={handlePrevMonth} className="hover:text-white transition-colors cursor-pointer text-xl">&lt;</button>
          <button onClick={handleNextMonth} className="hover:text-white transition-colors cursor-pointer text-xl">&gt;</button>
        </div>
      </div>

      {/* Grille des Jours de la semaine */}
      <div className="grid grid-cols-7 gap-y-2 mb-4 text-center">
        {daysOfWeek.map((day) =>
          <div key={day} className="text-slate-400 font-medium text-sm lowercase">
            {day}
          </div>
        )}
      </div>

      {/* Grille des Chiffres */}
      <div className="grid grid-cols-7 gap-x-2 gap-y-3 text-center">
        {/* Cases vides avant le 1er du mois */}
        {Array.from({ length: prefixDays }).map((_, i) => <div key={`empty-${i}`} />)}

        {daysInMonth.map((day) => {
          const isSelected = selected && isSameDay(day, selected);

          const isToday = isSameDay(day, new Date());
          const isBeforeToday = isBefore(day, startOfDay(new Date()));
          const isUnavailable = isBeforeToday || isToday;

          return (
            <button
              key={day.toString()}
              onClick={() => !isUnavailable && onSelect(day)}
              disabled={isUnavailable}
              className={`h-10 w-10 mx-auto flex items-center justify-center rounded-lg text-sm transition-all border border-transparent
                ${isSelected
                  ? '!bg-[#fbbf24] !text-slate-950 font-black scale-105 shadow-xl shadow-amber-500/20'
                  : isUnavailable
                    ? 'text-slate-700 cursor-not-allowed'
                    : 'text-slate-200 hover:bg-slate-800/60 hover:text-white cursor-pointer'
                }
              `}
            >
              {format(day, 'd')}
            </button>
          );
        })}
      </div>
    </div >
  );
};
