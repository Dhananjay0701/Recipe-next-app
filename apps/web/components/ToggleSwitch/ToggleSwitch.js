// ToggleSwitch.js
import React from "react";
import "./ToggleSwitch.css"; // Import the styles

const ToggleSwitch = ({ checked, onChange, label }) => {
  return (
    <div className="toggle-container">
      {label && <span className="toggle-label">{label}</span>}
      <label className="toggle-switch">
        <input type="checkbox" checked={checked} onChange={onChange} />
        <span className="slider"></span>
      </label>
    </div>
  );
};

export default ToggleSwitch;
