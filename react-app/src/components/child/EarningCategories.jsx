import React from "react";
import { useDashboardData } from "../DashboardDataProvider";

const COLORS = [
  "bg-primary-100",
  "bg-danger-100",
  "bg-warning-200",
  "bg-success-200",
  "bg-cyan-100",
  "bg-orange-100",
  "bg-purple-100",
  "bg-yellow-100"
];

const EarningCategories = () => {
  const { dashboardData, loading, error } = useDashboardData();

  if (loading) return <div className="text-center py-4">Loading...</div>;
  if (error) return <div className="text-danger">{error}</div>;
  if (!dashboardData) return <div className="text-secondary">No data available.</div>;

  const { incomeCategories, incomeByCategory, currentMonthIncome } = dashboardData;

  return (
    <div className='w-100 sidebar-card'>
      <div className='card radius-16 h-100 w-100'>
        <div className='card-header'>
          <div className='d-flex align-items-center flex-wrap gap-2 justify-content-between'>
            <h6 className='mb-2 fw-bold text-lg mb-0'>Earning Categories</h6>
          </div>
        </div>
        <div className='card-body'>
          <div className='d-flex flex-column gap-20'>
            {incomeCategories && incomeCategories.length > 0 ? (
              incomeCategories.map((cat, idx) => {
                const amount = incomeByCategory[idx] || 0;
                const percent = currentMonthIncome ? ((amount / currentMonthIncome) * 100).toFixed(1) : 0;
                const colorClass = COLORS[idx % COLORS.length];
                return (
                  <div className='d-flex align-items-center justify-content-between gap-3' key={cat} style={{ minWidth: 0 }}>
                    <div className='d-flex align-items-center w-100 gap-12 flex-grow-1' style={{ minWidth: 0 }}>
                      <span className={`w-40-px h-40-px rounded-circle d-flex justify-content-center align-items-center ${colorClass}`}></span>
                      <div className='flex-grow-1' style={{ minWidth: 0 }}>
                        <h6 className='text-sm mb-0 text-truncate' style={{ maxWidth: 120, overflowWrap: 'break-word', wordBreak: 'break-all' }}>{cat}</h6>
                        <span className='text-xs text-secondary-light fw-medium'>LKR {amount.toLocaleString()}</span>
                      </div>
                    </div>
                    <div className='d-flex align-items-center gap-2 w-100' style={{ minWidth: 0 }}>
                      <div className='w-100 max-w-66 ms-auto'>
                        <div
                          className='progress progress-sm rounded-pill'
                          role='progressbar'
                          aria-label='Success example'
                          aria-valuenow={percent}
                          aria-valuemin={0}
                          aria-valuemax={100}
                        >
                          <div
                            className='progress-bar bg-primary-600 rounded-pill'
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                      <span className='text-secondary-light font-xs fw-semibold'>
                        {percent}%
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center text-secondary-light">No income data to display for this month.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EarningCategories;
