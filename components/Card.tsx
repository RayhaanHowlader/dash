import React from 'react';

interface CardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  subtitle?: string;
  subtitleValue?: number | string;
  accentColor?: 'primary' | 'success' | 'warning' | 'info';
  className?: string;
}

const Card: React.FC<CardProps> = ({
  title,
  value,
  icon,
  subtitle,
  subtitleValue,
  accentColor = 'primary',
  className = '',
}) => {
  const getAccentColor = () => {
    switch (accentColor) {
      case 'success':
        return 'border-green-500';
      case 'warning':
        return 'border-yellow-500';
      case 'info':
        return 'border-blue-500';
      default:
        return 'border-red-600';
    }
  };

  const getIconColor = () => {
    switch (accentColor) {
      case 'success':
        return 'text-green-500 bg-green-500/10';
      case 'warning':
        return 'text-yellow-500 bg-yellow-500/10';
      case 'info':
        return 'text-blue-500 bg-blue-500/10';
      default:
        return 'text-red-500 bg-red-500/10';
    }
  };

  const getSubtitleColor = () => {
    switch (accentColor) {
      case 'success':
        return 'text-green-500';
      case 'warning':
        return 'text-yellow-500';
      case 'info':
        return 'text-blue-500';
      default:
        return 'text-red-500';
    }
  };

  return (
    <div 
      className={`
        bg-[#2d2d2d]/90 p-6 rounded-lg border-l-4 ${getAccentColor()}
        shadow-xl hover:shadow-${accentColor}-600/10 transition-all duration-300 
        transform hover:-translate-y-1 ${className}
      `}
    >
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-gray-400 text-lg font-medium">{title}</h3>
          <p className="text-4xl font-bold text-white mt-2">{value}</p>
        </div>
        <div className={`w-14 h-14 rounded-lg ${getIconColor()} flex items-center justify-center`}>
          {icon}
        </div>
      </div>
      {subtitle && (
        <div className="mt-4 pt-4 border-t border-gray-700">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-400">{subtitle}</span>
            <span className={`text-sm font-bold ${getSubtitleColor()}`}>
              {subtitleValue}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default Card; 