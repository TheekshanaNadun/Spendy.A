import React from "react";
import { useDashboardData } from "../DashboardDataProvider";
import { Link } from 'react-router-dom';
import Swal from 'sweetalert2';

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

  const showChatGuide = () => {
    Swal.fire({
      title: '💡 Use Chat for Easy Income Tracking!',
      html: `
        <div class="text-left">
          <p class="mb-3">Instead of filling out forms, you can simply chat with our AI assistant:</p>
          <div class="bg-light p-3 rounded mb-3">
            <strong>Examples:</strong><br>
            • "I earned 100000 from salary"<br>
            • "Received 50000 from investment"<br>
            • "Got 25000 as bonus"
          </div>
          <p class="text-muted small">Click the chat popup in the bottom right corner to get started!</p>
        </div>
      `,
      icon: 'info',
      confirmButtonText: 'Got it!',
      confirmButtonColor: '#3085d6',
      showCloseButton: true
    });
  };

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
              <div className="text-center py-4">
                <div className="mb-3">
                  <i className="ri-money-dollar-circle-line text-3xl text-secondary-light"></i>
                </div>
                <h6 className="text-sm text-secondary-light mb-2">No Income Data</h6>
                <p className="text-xs text-secondary-light mb-3">
                  Start adding income sources to see your earning categories.
                </p>
                <div className="d-flex justify-content-center gap-3">
                  <Link to="/form-validation" className="btn btn-outline-success btn-sm">
                    <i className="ri-add-line me-2"></i>Add Income
                  </Link>
                  <button className="btn btn-outline-info btn-sm" onClick={showChatGuide}>
                    <i className="ri-chat-1-line me-2"></i>Use Chat
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EarningCategories;
