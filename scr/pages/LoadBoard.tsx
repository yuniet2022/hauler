import React from 'react';
import { MOCK_LOADS } from '../constants';

const LoadBoard: React.FC = () => {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white">Load Board</h2>
      <div className="grid gap-4">
        {MOCK_LOADS.map(load => (
          <div key={load.id} className="bg-slate-900 border border-slate-800 p-6 rounded-xl flex justify-between items-center hover:border-green-500/30 transition-all cursor-pointer">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="font-bold text-white text-lg">{load.origin}</span>
                <span className="text-slate-500">→</span>
                <span className="font-bold text-white text-lg">{load.destination}</span>
              </div>
              <div className="text-sm text-slate-400">{load.vehicles.length} Vehicles • {load.distance} mi</div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-green-400">${load.price}</div>
              <div className="text-xs text-slate-500">${(load.price / load.distance).toFixed(2)}/mi</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LoadBoard;