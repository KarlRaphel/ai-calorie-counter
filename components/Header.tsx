import React from 'react';

interface HeaderProps {
  title: string;
  rightElement?: React.ReactNode;
  className?: string;
}

const Header: React.FC<HeaderProps> = ({ title, rightElement, className = '' }) => {
  return (
    <div className={`bg-white px-4 py-4 shadow-sm z-10 flex justify-between items-center sticky top-0 ${className}`}>
      <h1 className="text-2xl font-bold text-gray-800">{title}</h1>
      {rightElement && (
        <div className="flex items-center gap-2">
          {rightElement}
        </div>
      )}
    </div>
  );
};

export default Header;
