import React from 'react';

interface InputGroupProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onKeyPress?: (event: React.KeyboardEvent) => void;
  disabled: boolean;
}

export function InputGroup({ 
  value, 
  onChange, 
  onSubmit, 
  onKeyPress,
  disabled 
}: InputGroupProps) {
  return (
    <div className="flex flex-col xs:flex-row gap-2">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyPress={onKeyPress}
        placeholder="Enter the next part of the pattern..."
        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
        disabled={disabled}
      />
      <button
        onClick={onSubmit}
        disabled={disabled}
        className="w-full xs:w-auto px-4 py-2 bg-emerald-500 text-white rounded-md hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Submit
      </button>
    </div>
  );
}