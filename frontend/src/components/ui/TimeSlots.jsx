import React from 'react';
import { Loader2 } from 'lucide-react';

export const TimeSlots = ({ selectedDate, selectedSlot, setSelectedSlot, availableSlots, slotsLoading }) => {
  if (!selectedDate) {
    return <p className="text-slate-500 text-sm text-center">Sélectionnez d'abord une date</p>;
  }

  if (slotsLoading) return <Loader2 className="w-8 h-8 text-amber-400 animate-spin mx-auto" />;

  return (
    <div className="grid grid-cols-2 gap-3">
      {availableSlots.map((slot) => {
        const isSelected = selectedSlot === slot.time;
        // On rend les autres "inactifs" si une sélection est faite
        const isFaded = selectedSlot !== "" && !isSelected;
        const isDisabled = !slot.is_available;

        return (
          <button
            key={slot.time}
            type="button"
            disabled={isDisabled || isFaded}
            onClick={() => setSelectedSlot(slot.time)}
            className={`py-3 px-4 rounded-xl font-medium text-sm transition-all border text-center 
              ${isDisabled
                ? "bg-slate-950/20 border-slate-900 text-slate-600 cursor-not-allowed opacity-30 line-through"
                : isSelected
                  ? "!bg-[#fbbf24] !text-slate-950 !border-transparent font-bold scale-[1.02] shadow-lg shadow-amber-500/10"
                  : isFaded
                    ? "bg-slate-900/10 border-slate-800 text-slate-600 opacity-20 cursor-not-allowed"
                    : "bg-slate-800 border-slate-700 text-white hover:border-slate-600 hover:bg-slate-700"
              }`}
          >
            {slot.time}
          </button>
        );
      })}
    </div>
  );
};