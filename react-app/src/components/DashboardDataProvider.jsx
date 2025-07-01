import React, { createContext, useContext, useEffect, useState } from 'react';

const DashboardDataContext = createContext();

export const useDashboardData = () => useContext(DashboardDataContext);

export const DashboardDataProvider = ({ children }) => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [forecastData, setForecastData] = useState(null);
  const [forecastLoading, setForecastLoading] = useState(true);
  const [forecastError, setForecastError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/dashboard-data', { credentials: 'include' });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        setDashboardData(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  useEffect(() => {
    const fetchForecastData = async () => {
      setForecastLoading(true);
      try {
        const response = await fetch('/api/predict', { credentials: 'include' });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        setForecastData(data);
      } catch (err) {
        setForecastError(err.message);
      } finally {
        setForecastLoading(false);
      }
    };
    fetchForecastData();
  }, []);

  return (
    <DashboardDataContext.Provider value={{ dashboardData, loading, error, forecastData, forecastLoading, forecastError }}>
      {children}
    </DashboardDataContext.Provider>
  );
}; 