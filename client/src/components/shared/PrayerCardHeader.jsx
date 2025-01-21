import React, { useState } from 'react';

const PrayerCardHeader = ({ userName, country, categories = [] }) => {
  const [showAllCategories, setShowAllCategories] = useState(false);
  
  const renderCategories = () => {
    if (!categories || categories.length === 0) return null;
    
    if (showAllCategories) {
      return (
        <div className="flex flex-wrap gap-1 items-center">
          {categories.map((category) => (
            <span
              key={category}
              className="px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-800"
            >
              {category}
            </span>
          ))}
          {categories.length > 1 && (
            <button
              onClick={() => setShowAllCategories(false)}
              className="px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200"
            >
              Show less
            </button>
          )}
        </div>
      );
    }

    return (
      <div className="flex flex-wrap gap-1 items-center">
        <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-800">
          {categories[0]}
        </span>
        {categories.length > 1 && (
          <button
            onClick={() => setShowAllCategories(true)}
            className="px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200"
          >
            +{categories.length - 1} more
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="p-2">
      <div className="space-y-1 flex flex-row justify-between items-center">
        <div className="flex flex-row items-center justify-between">
          {country ? (
            <div className="flex flex-row items-center gap-2">
              <h3 className="font-medium">{userName}</h3>
              <h3 className="font-light">({country})</h3>
            </div>
          ) : (
            <h3 className="font-medium">{userName}</h3>
          )}
        </div>
        {renderCategories()}
      </div>
    </div>
  );
};

export default PrayerCardHeader;