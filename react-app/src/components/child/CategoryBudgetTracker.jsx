import React, { useState, useEffect } from 'react';
import { Icon } from '@iconify/react/dist/iconify.js';

const CategoryBudgetTracker = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Fetch data from API
  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch real data from the database
      const response = await fetch('http://localhost:5000/api/category-budget-status', { 
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      console.log('Raw API response:', data);
      
      // Transform the data to match our component structure
      const transformedData = data.map(category => {
        // Simple icon mapping
        let icon = 'mdi:dots-horizontal';
        let color = '#9E9E9E';
        
        const name = category.name.toLowerCase();
        if (name.includes('food') || name.includes('grocery')) {
          icon = 'mdi:food-fork-drink';
          color = '#FF6B6B';
        } else if (name.includes('transport')) {
          icon = 'mdi:car';
          color = '#4ECDC4';
        } else if (name.includes('entertainment')) {
          icon = 'mdi:movie';
          color = '#A8E6CF';
        } else if (name.includes('health')) {
          icon = 'mdi:medical-bag';
          color = '#FFEAA7';
        } else if (name.includes('education')) {
          icon = 'mdi:school';
          color = '#F7DC6F';
        } else if (name.includes('rent') || name.includes('house')) {
          icon = 'mdi:home';
          color = '#98D8C8';
        } else if (name.includes('electricity')) {
          icon = 'mdi:lightning-bolt';
          color = '#FFD93D';
        }
        
        return {
          id: Math.random(), // Simple ID for React
          name: category.name,
          icon: icon,
          color: color,
          budget: category.limit,
          spent: category.spent,
          lastMonthSpent: category.lastMonthSpent,
          limit: category.limit,
          remaining: category.limit - category.spent
        };
      });
      
      console.log('Transformed data:', transformedData);
      
      setCategories(transformedData);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching categories:', error);
      setError('Failed to fetch budget data from database. Please try again.');
      
      // No fallback data - let the user know there's an issue
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
    
    // Auto-refresh every 5 minutes (300000ms)
    const interval = setInterval(() => {
      fetchCategories();
    }, 300000);
    
    return () => clearInterval(interval);
  }, []);

  const getProgressColor = (spent, limit) => {
    const percentage = (spent / limit) * 100;
    if (percentage >= 90) return '#EF4444'; // Red - danger
    if (percentage >= 75) return '#F59E0B'; // Yellow - warning
    return '#10B981'; // Green - safe
  };

  const getProgressWidth = (spent, limit) => {
    return Math.min((spent / limit) * 100, 100);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('si-LK', {
      style: 'currency',
      currency: 'LKR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Add CSS for animations and layout
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .category-item {
        transition: all 0.3s ease;
        border: 1px solid #e9ecef !important;
      }
      .category-item:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      }
      .category-icon {
        transition: transform 0.3s ease;
      }
      .category-item:hover .category-icon {
        transform: scale(1.1);
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      // Fetch fresh data from API
      await fetchCategories();
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <div className="card h-100 p-0 radius-12">
        <div className="card-header border-bottom bg-base py-16 px-24">
          <h6 className="text-lg fw-semibold mb-0">Category Budget Tracker</h6>
        </div>
        <div className="card-body p-24">
          <div className="d-flex justify-content-center align-items-center" style={{ height: '200px' }}>
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card h-100 p-0 radius-12">
      <div className="card-header border-bottom bg-base py-16 px-24">
        <div className="d-flex align-items-center justify-content-between mb-4">
          <div>
            <h4 className="text-xl fw-bold mb-1 text-primary-light">Category Budget Tracker</h4>
            <p className="text-sm text-secondary-light mb-0">Monitor your spending across all categories</p>
          </div>
          <div className="d-flex align-items-center gap-2">

            {refreshing && (
              <span className="text-xs text-secondary-light">Refreshing...</span>
            )}
            <Icon 
              icon={refreshing ? "mdi:loading" : "mdi:refresh"} 
              className={`text-primary-light cursor-pointer ${refreshing ? 'animate-spin' : ''}`}
              onClick={handleRefresh}
              style={{ cursor: 'pointer' }}
              title="Refresh data"
            />
          </div>
        </div>
        <div className="d-flex justify-content-between align-items-center mt-4">
          <p className="text-sm text-secondary-light mb-0">
            Track your spending against budget limits
          </p>
          {lastUpdated && (
            <span className="text-xs text-secondary-light">
              Last updated: {lastUpdated.toLocaleTimeString('si-LK')}
            </span>
          )}
        </div>
      </div>
      <div className="card-body p-24">
        {error && (
          <div className="alert alert-danger mb-4" role="alert">
            <Icon icon="mdi:alert-circle" className="me-2" />
            {error}
          </div>
        )}
        {categories.length === 0 ? (
          <div className="text-center py-5">
            <Icon icon="mdi:database-off" className="text-4xl text-secondary-light mb-3" />
            <h6 className="text-lg text-secondary-light mb-2">No Budget Data Available</h6>
            <p className="text-sm text-secondary-light mb-3">
              It looks like you haven't set up any budget categories yet.
            </p>
            <button 
              onClick={handleRefresh}
              className="btn btn-primary btn-sm"
              disabled={refreshing}
            >
              {refreshing ? 'Refreshing...' : 'Refresh Data'}
            </button>
          </div>
        ) : (
          <div className="row g-4">
            {categories.map((category) => {
              const remaining = category.remaining || (category.limit - category.spent);
              const progressColor = getProgressColor(category.spent, category.limit);
              const progressWidth = getProgressWidth(category.spent, category.limit);
              const isOverBudget = category.limit > 0 && category.spent > category.limit;
              const isNearLimit = (category.limit > 0 && (category.spent / category.limit) >= 0.8);

              return (
                <div key={category.id} className="col-lg-6 col-md-12">
                  <div className="category-item p-4 border rounded-3 h-100" style={{ backgroundColor: '#fafbfc' }}>
                    <div className="d-flex align-items-center justify-content-between mb-3">
                  <div className="d-flex align-items-center gap-3">
                    <div 
                      className="category-icon d-flex align-items-center justify-content-center"
                      style={{ 
                        width: '40px', 
                        height: '40px', 
                        backgroundColor: category.color,
                        borderRadius: '50%',
                        color: 'white'
                      }}
                    >
                      <Icon icon={category.icon} className="text-xl" />
                    </div>
                    <div>
                      <h6 className="mb-1 fw-semibold text-primary-light">{category.name}</h6>
                      <div className="d-flex align-items-center gap-3">
                        <span className="text-sm text-secondary-light">
                          Budget: {formatCurrency(category.budget)}
                        </span>
                        <span className="text-sm text-secondary-light">
                          Spent: {formatCurrency(category.spent)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-end">
                    <div className={`fw-bold ${category.limit > 0 ? (isOverBudget ? 'text-danger' : 'text-success') : 'text-secondary'}`}>
                      {category.limit > 0 ? (isOverBudget ? '-' : '+') : ''}{formatCurrency(Math.abs(remaining))}
                    </div>
                    <div className="text-xs text-secondary-light">
                      {category.limit > 0 ? (isOverBudget ? 'Over Budget' : 'Remaining') : 'Spent'}
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                {category.limit > 0 ? (
                  <div className="progress mb-3" style={{ height: '8px', backgroundColor: '#e9ecef' }}>
                    <div
                      className="progress-bar"
                      style={{
                        width: `${progressWidth}%`,
                        backgroundColor: progressColor,
                        borderRadius: '4px',
                        transition: 'width 0.3s ease'
                      }}
                    />
                  </div>
                ) : (
                  <div className="mb-3 p-2 bg-warning-subtle text-warning-emphasis rounded text-center">
                    <small>No budget limit set for this category</small>
                  </div>
                )}

                {/* Budget Status and Last Month Comparison */}
                <div className="d-flex justify-content-between align-items-center">
                  <div className="d-flex align-items-center gap-3">
                    <span className={`badge ${category.limit > 0 ? (isOverBudget ? 'bg-danger' : isNearLimit ? 'bg-warning' : 'bg-success') : 'bg-secondary'} text-white px-3 py-2`}>
                      {category.limit > 0 ? (isOverBudget ? 'Over Budget' : isNearLimit ? 'Near Limit' : 'On Track') : 'No Limit Set'}
                    </span>
                    <span className="text-xs text-secondary-light">
                      {category.limit > 0 ? `${Math.round((category.spent / category.limit) * 100)}% used` : 'No budget limit'}
                    </span>
                  </div>
                  <div className="text-end">
                    <div className="text-xs text-secondary-light">Last Month</div>
                    <div className={`fw-semibold ${category.spent > category.lastMonthSpent ? 'text-danger' : 'text-success'}`}>
                      {formatCurrency(category.lastMonthSpent)}
                    </div>
                  </div>
                </div>

                {/* Last Month Comparison Indicator */}
                {category.spent !== category.lastMonthSpent && (
                  <div className="mt-2 d-flex align-items-center gap-2">
                    <Icon 
                      icon={category.spent > category.lastMonthSpent ? 'mdi:trending-up' : 'mdi:trending-down'} 
                      className={`text-sm ${category.spent > category.lastMonthSpent ? 'text-danger' : 'text-success'}`} 
                    />
                    <span className={`text-xs ${category.spent > category.lastMonthSpent ? 'text-danger' : 'text-success'}`}>
                      {category.spent > category.lastMonthSpent ? 'Increased' : 'Decreased'} by{' '}
                      {formatCurrency(Math.abs(category.spent - category.lastMonthSpent))} from last month
                    </span>
                  </div>
                )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Summary Section */}
        <div className="mt-5 pt-4 border-top">
          <div className="row text-center">
            <div className="col-md-4 col-6 mb-3">
              <div className="p-3 bg-light rounded-3">
                <div className="text-sm text-secondary-light mb-1">Total Budget</div>
                <div className="fw-bold text-primary-light fs-5">
                  {formatCurrency(categories.reduce((sum, cat) => sum + (cat.limit || 0), 0))}
                </div>
              </div>
            </div>
            <div className="col-md-4 col-6 mb-3">
              <div className="p-3 bg-light rounded-3">
                <div className="text-sm text-secondary-light mb-1">Total Spent</div>
                <div className="fw-bold text-primary-light fs-5">
                  {formatCurrency(categories.reduce((sum, cat) => sum + cat.spent, 0))}
                </div>
              </div>
            </div>
            <div className="col-md-4 col-12">
              <div className="p-3 bg-light rounded-3">
                <div className="text-sm text-secondary-light mb-1">Remaining</div>
                <div className="fw-bold text-success fs-5">
                  {formatCurrency(categories.reduce((sum, cat) => sum + (cat.remaining || 0), 0))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoryBudgetTracker;
