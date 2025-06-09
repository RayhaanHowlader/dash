import React from 'react';

interface StatusCardProps {
  title: string;
  value: number;
  subtitle?: string;
  subtitleValue?: number;
  variant: 'red' | 'green' | 'blue' | 'yellow';
  icon: React.ReactNode;
}

const StatusCard: React.FC<StatusCardProps> = ({
  title,
  value,
  subtitle,
  subtitleValue,
  variant,
  icon,
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'red':
        return {
          bg: 'bg-red-500/10',
          text: 'text-red-500',
          border: 'border-red-500/20',
          icon: 'text-red-500',
        };
      case 'green':
        return {
          bg: 'bg-emerald-500/10',
          text: 'text-emerald-500',
          border: 'border-emerald-500/20',
          icon: 'text-emerald-500',
        };
      case 'blue':
        return {
          bg: 'bg-blue-500/10',
          text: 'text-blue-500',
          border: 'border-blue-500/20',
          icon: 'text-blue-500',
        };
      case 'yellow':
        return {
          bg: 'bg-yellow-500/10',
          text: 'text-yellow-500',
          border: 'border-yellow-500/20',
          icon: 'text-yellow-500',
        };
      default:
        return {
          bg: 'bg-gray-500/10',
          text: 'text-gray-500',
          border: 'border-gray-500/20',
          icon: 'text-gray-500',
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <div className={`rounded-lg bg-[#1f2123] border ${styles.border} p-6`}>
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-gray-400 text-sm font-medium mb-1">{title}</h3>
          <p className="text-4xl font-bold text-white">{value}</p>
          {subtitle && (
            <div className="mt-4 flex items-center">
              <span className="text-sm text-gray-400">{subtitle}</span>
              <span className={`ml-2 text-sm font-semibold ${styles.text}`}>
                {subtitleValue}
              </span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-lg ${styles.bg}`}>
          <div className={styles.icon}>{icon}</div>
        </div>
      </div>
    </div>
  );
};

export default StatusCard; 