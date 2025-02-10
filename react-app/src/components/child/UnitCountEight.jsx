import React, { useState, useEffect } from "react";

const UnitCountEight = () => {
  const [stats, setStats] = useState({
    currentMonthIncome: 0,
    lastMonthIncome: 0,
    currentMonthExpense: 0,
    lastMonthExpense: 0,
    netProfit: 0,
    totalSavings: 0,
    loading: true,
    error: null
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/stats', {
          credentials: 'include'
      });

        if (!response.ok) throw new Error('Failed to fetch stats');
        
        const data = await response.json();
        setStats(prev => ({
          ...prev,
          ...data,
          loading: false,
          error: null
        }));
      } catch (err) {
        setStats(prev => ({
          ...prev,
          loading: false,
          error: err.message
        }));
      }
    };

    // Initial fetch
    fetchStats();
    
    // Set up polling every 10 seconds
    const interval = setInterval(fetchStats, 100000);
    
    return () => clearInterval(interval);
  }, []);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'LKR'
    }).format(amount);
  };

  const calculatePercentageChange = (current, previous) => {
    if (previous === 0) return '0%';
    return `${(((current - previous) / previous) * 100).toFixed(1)}%`;
  };

  if (stats.loading) return <div className="text-center">Loading statistics...</div>;
  if (stats.error) return <div className="text-center text-danger">Error: {stats.error}</div>;

  return (
    <div className='row gy-4'>
      {/* Income Card */}
      <div className='col-xxl-3 col-sm-6'>
        <div className='card p-3 shadow-2 radius-8 h-100 gradient-deep-two-1 border border-white'>
          <div className='card-body p-0'>
            <div className='d-flex flex-wrap align-items-center justify-content-between gap-1 mb-8'>
              <div className='d-flex align-items-center gap-10'>
                <span className='mb-0 w-48-px h-48-px bg-cyan-600 flex-shrink-0 text-white d-flex justify-content-center align-items-center rounded-circle h6 mb-0'>
                  <img src='assets/images/home-eleven/icons/home-eleven-icon1.svg' alt='Income' />
                </span>
                <div>
                  <span className='fw-medium text-secondary-light text-md'>This Month Income</span>
                  <h6 className='fw-semibold mt-2'>{formatCurrency(stats.currentMonthIncome)}</h6>
                </div>
              </div>
            </div>
            <p className='text-sm mb-0 d-flex align-items-center flex-wrap gap-12 mt-12 text-secondary-light'>
              <span className='bg-success-focus px-6 py-2 rounded-2 fw-medium text-success-main text-sm d-flex align-items-center gap-1'>
                <i className='ri-arrow-right-up-line' /> 
                {calculatePercentageChange(stats.currentMonthIncome, stats.lastMonthIncome)}
              </span>
              Last month {formatCurrency(stats.lastMonthIncome)}
            </p>
          </div>
        </div>
      </div>

      {/* Expense Card */}
      <div className='col-xxl-3 col-sm-6'>
        <div className='card p-3 shadow-2 radius-8 h-100 gradient-deep-two-2 border border-white'>
          <div className='card-body p-0'>
            <div className='d-flex flex-wrap align-items-center justify-content-between gap-1 mb-8'>
              <div className='d-flex align-items-center gap-10'>
                <span className='mb-0 w-48-px h-48-px bg-warning-600 flex-shrink-0 text-white d-flex justify-content-center align-items-center rounded-circle h6 mb-0'>
                  <img src='assets/images/home-eleven/icons/home-eleven-icon2.svg' alt='Expenses' />
                </span>
                <div>
                  <span className='fw-medium text-secondary-light text-md'>This Month Expenses</span>
                  <h6 className='fw-semibold mt-2'>{formatCurrency(stats.currentMonthExpense)}</h6>
                </div>
              </div>
            </div>
            <p className='text-sm mb-0 d-flex align-items-center flex-wrap gap-12 mt-12 text-secondary-light'>
              <span className='bg-success-focus px-6 py-2 rounded-2 fw-medium text-success-main text-sm d-flex align-items-center gap-1'>
                <i className='ri-arrow-right-up-line' /> 
                {calculatePercentageChange(stats.currentMonthExpense, stats.lastMonthExpense)}
              </span>
              Last month {formatCurrency(stats.lastMonthExpense)}
            </p>
          </div>
        </div>
      </div>

      {/* Net Profit Card */}
      <div className='col-xxl-3 col-sm-6'>
        <div className='card p-3 shadow-2 radius-8 h-100 gradient-deep-two-3 border border-white'>
          <div className='card-body p-0'>
            <div className='d-flex flex-wrap align-items-center justify-content-between gap-1 mb-8'>
              <div className='d-flex align-items-center gap-10'>
                <span className='mb-0 w-48-px h-48-px bg-lilac-600 flex-shrink-0 text-white d-flex justify-content-center align-items-center rounded-circle h6 mb-0'>
                  <img src='assets/images/home-eleven/icons/home-eleven-icon3.svg' alt='Net Profit' />
                </span>
                <div>
                  <span className='fw-medium text-secondary-light text-md'>This Month Balance</span>
                  <h6 className='fw-semibold mt-2'>{formatCurrency(stats.netProfit)}</h6>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Savings Card */}
      <div className='col-xxl-3 col-sm-6'>
        <div className='card p-3 shadow-2 radius-8 h-100 gradient-deep-two-4 border border-white'>
          <div className='card-body p-0'>
            <div className='d-flex flex-wrap align-items-center justify-content-between gap-1 mb-8'>
              <div className='d-flex align-items-center gap-10'>
                <span className='mb-0 w-48-px h-48-px bg-success-600 flex-shrink-0 text-white d-flex justify-content-center align-items-center rounded-circle h6 mb-0'>
                  <img src='assets/images/home-eleven/icons/home-eleven-icon4.svg' alt='Savings' />
                </span>
                <div>
                  <span className='fw-medium text-secondary-light text-md'>Lifetime Saving</span>
                  <h6 className='fw-semibold mt-2'>{formatCurrency(stats.totalSavings)}</h6>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UnitCountEight;
