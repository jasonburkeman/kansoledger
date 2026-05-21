import React from "react";

interface SliderProps {
  value: number[];
  onValueChange: (val: number[]) => void;
  max: number;
  min?: number;
  step?: number;
}

export const Slider: React.FC<SliderProps> = ({ 
  value, 
  onValueChange, 
  max, 
  min = 0, 
  step = 1 
}) => {
  return (
    <div className="w-full flex items-center relative py-2">
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value[0]}
        onChange={(e) => onValueChange([Number(e.target.value)])}
        className="w-full h-2 bg-slate-100 rounded-full appearance-none cursor-pointer accent-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all border-none"
      />
    </div>
  );
};
