'use client';

import React, { useState } from 'react';
import './FilterBar.css';

const Dropdown = ({ title, options }) => {
  const [open, setOpen] = useState(false);
  const ic_val = (title === "Sort by") ? "sby-icon" : "icon";
  
  return (
    <div className="dropdown" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button>
        {title} <span className={ic_val}>▼</span>
      </button>
      {open && (
        <div className="dropdown-content">
          {options.map((option, index) => (
            <a key={index} href="#" onClick={() => setOpen(false)}>
              {option}
            </a>
          ))}
        </div>
      )}
    </div>
  );
};

const FilterBar = () => {
  return (
    <div className="container">
      <hr className="hr-1" />
      <div className="filters">
        <Dropdown title="CUISINE" options={["USA", "UK", "India"]} />
        <Dropdown title="TYPE" options={["Available", "Out of Stock", "New Arrivals"]} />
        <Dropdown title="YEAR" options={["Available", "Out of Stock", "New Arrivals"]} />
        <Dropdown title="FILTER" options={["Available", "Out of Stock", "New Arrivals"]} />
        <Dropdown title="Sort by" options={["Price", "Date", "Popularity"]} />
      </div>
      <hr className="hr-2" />
    </div>
  );
};

export default FilterBar;
