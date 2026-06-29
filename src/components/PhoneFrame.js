import React, { useState, useEffect } from 'react';

export default function PhoneFrame({ children }) {
  const [time, setTime] = useState('9:41 AM');

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      let hours = now.getHours();
      const minutes = now.getMinutes().toString().padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12; // the hour '0' should be '12'
      setTime(`${hours}:${minutes} ${ampm}`);
    };

    updateClock();
    const interval = setInterval(updateClock, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="phone">
      <div className="statusbar">
        <span>{time}</span>
        <span>●●● 📶 🔋</span>
      </div>
      {children}
    </div>
  );
}
