/**
 * TrafficLights - macOS-style window controls
 */
import React, { memo } from 'react';

interface TrafficLightsProps {
  onClose?: () => void;
  onMinimize?: () => void;
  onMaximize?: () => void;
}

export const TrafficLights = memo(function TrafficLights({
  onClose,
  onMinimize,
  onMaximize,
}: TrafficLightsProps) {
  return (
    <div className="flex gap-2 group">
      <button
        onClick={onClose}
        className="w-3 h-3 rounded-full bg-[#ff5f57] relative overflow-hidden flex items-center justify-center hover:brightness-90 transition-all"
        title="Close"
      >
        <span className="text-[8px] text-black/40 font-bold opacity-0 group-hover:opacity-100 transition-opacity absolute">
          x
        </span>
      </button>
      <button
        onClick={onMinimize}
        className="w-3 h-3 rounded-full bg-[#febc2e] relative overflow-hidden flex items-center justify-center hover:brightness-90 transition-all"
        title="Minimize"
      >
        <span className="text-[8px] text-black/40 font-bold opacity-0 group-hover:opacity-100 transition-opacity absolute">
          -
        </span>
      </button>
      <button
        onClick={onMaximize}
        className="w-3 h-3 rounded-full bg-[#28c840] relative overflow-hidden flex items-center justify-center hover:brightness-90 transition-all"
        title="Maximize"
      >
        <span className="text-[6px] text-black/40 font-bold opacity-0 group-hover:opacity-100 transition-opacity absolute">
          +
        </span>
      </button>
    </div>
  );
});

export default TrafficLights;
