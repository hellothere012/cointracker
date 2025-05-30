'use client';

import React from 'react';

interface WidgetProps {
  title: string;
  value: string | number | null | undefined;
  unit?: string;
  isLoading?: boolean;
  error?: string | null;
  valueClassName?: string; // Optional class for the value itself
}

const Widget: React.FC<WidgetProps> = ({ title, value, unit, isLoading, error, valueClassName }) => {
  let displayValue: string | React.ReactNode = 'N/A';

  if (isLoading) {
    displayValue = <span className="text-sm text-gray-500">Loading...</span>;
  } else if (error) {
    displayValue = <span className="text-sm text-red-500 truncate" title={error}>Error</span>;
  } else if (value !== null && value !== undefined) {
    displayValue = `${value}${unit || ''}`;
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md flex flex-col justify-between h-full">
      <div>
        <h3 className="text-lg font-semibold text-gray-600 mb-2">{title}</h3>
      </div>
      <div>
        <p className={`text-3xl font-bold text-gray-800 ${valueClassName || ''}`}>
          {displayValue}
        </p>
      </div>
    </div>
  );
};

export default Widget;
