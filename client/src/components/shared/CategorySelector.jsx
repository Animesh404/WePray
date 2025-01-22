import React from "react";

const CategorySelector = ({
  selectedCategories = [],
  onChange,
  mode = "form",
  label,
  className = "",
  required,
}) => {
  const categories = [
    "Thanksgiving",
    "Confession",
    "Intercession",
    "Petition",
    "Healing",
    "Protection",
    "Deliverance",
    "Guidance",
    "Strength",
    "Peace",
    "Forgiveness",
    "Hope",
    "Faith",
    "Love",
    "Unity",
    "Wisdom",
    "Comfort",
    "Blessings",
    "Gratitude",
    "Marriage",
    "Family",
    "Finances",
    "Employment",
    "Health",
    "Spiritual",
    "Others",
  ];

  // const handleCategoryClick = (category) => {
  //   const currentSelected = selectedCategories || [];
  //   if (currentSelected.includes(category)) {
  //     onChange(currentSelected.filter(c => c !== category));
  //   } else {
  //     onChange([...currentSelected, category]);
  //   }
  // };

  const handleClearAll = () => {
    onChange([]);
  };

  const handleChange = (e) => {
    const newCategory = e.target.value;
    if (newCategory && !selectedCategories.includes(newCategory)) {
      onChange([...selectedCategories, newCategory]);
    }
    e.target.value = ""; 
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex justify-between items-center">
        <label className="block text-sm  font-medium text-gray-700">
          {label ||
            (mode === "form" ? "Prayer Categories" : "Filter by Category:")}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
        {selectedCategories.length > 0 && (
          <button
            type="button"
            onClick={handleClearAll}
            className="text-xs rounded-xl  bg-green-300 text-green-800 focus:outline-none focus:ring-2 focus:ring-[#409F9C] focus:ring-offset-2 transition-all duration-200 ease-in-out"
          >
            Clear all
          </button>
        )}
      </div>

      {mode === "form" && (
        <p className="text-sm text-gray-500 mt-1">
          Select one or more categories
        </p>
      )}

      <select
        value=""
        onChange={handleChange}
        required={required && selectedCategories.length === 0}
        className="w-full px-3 py-2 border bg-white border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
      >
        <option value="">Select category</option>
        {categories.map((category) => (
          <option key={category} value={category}>
            {category}
          </option>
        ))}
      </select>

      {selectedCategories.length > 0 && (
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span className="px-4 md:px-1">
            {mode === "filter" ? "Filtering by:" : "Selected:"}
          </span>
          <div className="flex flex-wrap gap-1">
            {selectedCategories.map((cat) => (
              <span
                key={cat}
                className="inline-flex items-center px-2 py-0.5 rounded bg-green-100 text-green-800"
              >
                {cat}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CategorySelector;
