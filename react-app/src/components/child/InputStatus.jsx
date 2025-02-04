import { Icon } from '@iconify/react/dist/iconify.js';
import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

const BudgetThresholdForm = () => {
    const [monthlyLimit, setMonthlyLimit] = useState(0);
    const [categories, setCategories] = useState([]);
    const [categoryLimits, setCategoryLimits] = useState([]);
    const [newLimit, setNewLimit] = useState({
        categoryId: '',
        limit: ''
    });

   // Fetch all required data
useEffect(() => {
    const fetchData = async () => {
        try {
            const [userRes, catRes, limitsRes] = await Promise.all([
                fetch('http://localhost:5000/api/user', {
                    credentials: 'include',
                    headers: { 
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    }
                }),
                fetch('http://localhost:5000/api/categories', {
                    credentials: 'include'
                }),
                fetch('http://localhost:5000/api/user-limits', {
                    credentials: 'include',
                    headers: { 'Accept': 'application/json' }
                })
            ]);

            // Validate responses
            if (!userRes.ok) throw new Error(`User fetch failed: ${userRes.statusText}`);
            if (!catRes.ok) throw new Error(`Categories fetch failed: ${catRes.statusText}`);
            if (!limitsRes.ok) throw new Error(`Limits fetch failed: ${limitsRes.statusText}`);

            // Parse JSON
            const [userData, catData, limitsData] = await Promise.all([
                userRes.json(),
                catRes.json(),
                limitsRes.json()
            ]);

            // Update state
            setMonthlyLimit(userData.monthly_limit);
            setCategories(catData);
            setCategoryLimits(limitsData);

        } catch (error) {
            console.error('Fetch error:', error);
            MySwal.fire({
                title: <strong>Connection Error</strong>,
                html: <p>{error.message}</p>,
                icon: 'error'
            });
        }
    };
    fetchData();
}, []);

    
    


    const handleAddLimit = async () => {
        if (!newLimit.categoryId || !newLimit.limit) {
            MySwal.fire({
                title: <strong>Missing Data</strong>,
                html: <p>Please select a category and enter a limit</p>,
                icon: 'warning'
            });
            return;
        }

        try {
            const response = await fetch('http://localhost:5000/api/user-limits', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    category_id: newLimit.categoryId,
                    monthly_limit: parseFloat(newLimit.limit)
                }),
                credentials: 'include'
            });

            if (!response.ok) throw new Error('Failed to add limit');

            const newLimitData = await response.json();
            setCategoryLimits([...categoryLimits, newLimitData]);
            setNewLimit({ categoryId: '', limit: '' });

            MySwal.fire({
                title: <strong>Success!</strong>,
                html: <p>Category limit added</p>,
                icon: 'success',
                timer: 2000
            });

        } catch (error) {
            MySwal.fire({
                title: <strong>Error!</strong>,
                html: <p>{error.message}</p>,
                icon: 'error'
            });
        }
    };

    const handleDeleteLimit = async (limitId) => {
        try {
            const response = await fetch(`http://localhost:5000/api/user-limits/${limitId}`, {
                method: 'DELETE',
                credentials: 'include'
            });

            if (!response.ok) throw new Error('Failed to delete limit');

            setCategoryLimits(categoryLimits.filter(limit => limit.limit_id !== limitId));
            
            MySwal.fire({
                title: <strong>Deleted!</strong>,
                html: <p>Limit removed successfully</p>,
                icon: 'success',
                timer: 2000
            });

        } catch (error) {
            MySwal.fire({
                title: <strong>Error!</strong>,
                html: <p>{error.message}</p>,
                icon: 'error'
            });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch('http://localhost:5000/api/user', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ monthly_limit: monthlyLimit }),
                credentials: 'include'
            });
    
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to save');
            }
    
            const data = await response.json();
            setMonthlyLimit(data.monthly_limit); // Update with server response
    
            MySwal.fire({
                title: <strong>Success!</strong>,
                html: <p>Monthly limit updated to Rs. {data.monthly_limit}</p>,
                icon: 'success',
                timer: 2000
            });
    
        } catch (error) {
            MySwal.fire({
                title: <strong>Error!</strong>,
                html: <p>{error.message}</p>,
                icon: 'error'
            });
        }
    };

    return (
        <div className="col-lg-12">
            <div className="card">
                <div className="card-header">
                    <h5 className="card-title mb-0">Budget Threshold Settings</h5>
                    <div className="current-limit badge bg-success-600 font-size-7">
                <Icon icon="ph:currency-dollar-bold" className="me-2" />
                Current Monthly Limit: Rs. {monthlyLimit.toLocaleString()}
            </div>
                </div>
                <div className="card-body">
                    <form className="row gy-3 needs-validation" onSubmit={handleSubmit}>
                        {/* Monthly Expense Limit */}
                        <div className="col-md-6">
                            <label className="form-label">Monthly Expense Limit (Rs.)</label>
                            <div className="icon-field">
                                <span className="icon">
                                    <Icon icon="ph:currency-dollar-bold" />
                                </span>
                                <input
                                    type="number"
                                    className="form-control"
                                    value={monthlyLimit}
                                    onChange={(e) => setMonthlyLimit(e.target.value)}
                                    placeholder="Monthly budget cap"
                                    required
                                    min="0"
                                />
                            </div>
                        </div>

                        {/* Add New Category Threshold */}
                        <div className="col-md-6">
                            <label className="form-label">Add New Threshold</label>
                            <div className="input-group">
                                <select
                                    className="form-control"
                                    value={newLimit.categoryId}
                                    onChange={(e) => setNewLimit({...newLimit, categoryId: e.target.value})}
                                >
                                    <option value="">Select Category</option>
                                    {categories.map(cat => (
                                        <option key={cat.category_id} value={cat.category_id}>
                                            {cat.name} ({cat.type})
                                        </option>
                                    ))}
                                </select>
                                <input
                                    type="number"
                                    className="form-control"
                                    placeholder="Limit (Rs.)"
                                    value={newLimit.limit}
                                    onChange={(e) => setNewLimit({...newLimit, limit: e.target.value})}
                                    min="0"
                                    step="0.01"
                                />
                                <button 
                                    type="button" 
                                    className="btn btn-primary-600"
                                    onClick={handleAddLimit}
                                >
                                    <Icon icon="ic:round-add" />
                                </button>
                            </div>
                        </div>

                        {/* Threshold Display Table */}
                        <div className="col-12">
                            <div className="table-responsive">
                                <table className="table table-hover">
                                    <thead>
                                        <tr>
                                            <th style={{width: '40px'}}></th>
                                            <th>Category</th>
                                            <th>Type</th>
                                            <th>Limit (Rs.)</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
  {categoryLimits.length === 0 ? (
    <tr>
      <td colSpan="5" className="text-center text-muted py-4">
        No budget limits configured yet
      </td>
    </tr>
  ) : (
    categoryLimits.map(limit => {
      const category = categories.find(c => c.category_id === limit.category_id) || {};
      return (
        <tr key={limit.limit_id}>
          <td>
            <Icon 
              icon={getCategoryIcon(category?.name)}
              className={`text-${getCategoryColor(category?.type)}`}
              width={24}
              aria-hidden="true"
            />
          </td>
          <td>{category?.name || 'Uncategorized'}</td>
          <td>{category?.type || 'N/A'}</td>
          <td>Rs. {limit.monthly_limit?.toFixed(2) || '0.00'}</td>
          <td>
            <button 
              className="btn btn-sm btn-link text-danger"
              onClick={() => handleDeleteLimit(limit.limit_id)}
              aria-label={`Delete ${category?.name} limit`}
            >
              <Icon icon="mdi:trash-can-outline" aria-hidden="true" />
            </button>
          </td>
        </tr>
      );
    })
  )}
</tbody>
                                </table>
                            </div>
                        </div>

                        <div className="col-12">
                            <button className="btn btn-primary-600" type="submit">
                                Save Configuration
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

// Helper functions for icons and colors
const getCategoryIcon = (categoryName) => {
    const icons = {
        // Expense Categories
        'Food & Groceries': 'fluent:food-24-regular',
        'Public Transportation (Bus/Train)': 'mdi:bus',
        'Three Wheeler Fees': 'mdi:rickshaw',
        'Electricity (CEB)': 'mdi:lightbulb',
        'Water Supply': 'mdi:water',
        'Entertainment': 'mdi:party-popper',
        'Mobile Prepaid': 'mdi:cellphone',
        'Internet (ADSL/Fiber)': 'mdi:web',
        'Hospital Charges': 'mdi:hospital',
        'School Fees': 'mdi:school',
        'University Expenses': 'mdi:university',
        'Educational Materials': 'mdi:book-open',
        'Clothing & Textiles': 'mdi:tshirt-crew',
        'House Rent': 'mdi:home',
        'Home Maintenance': 'mdi:tools',
        'Family Events': 'mdi:account-group',
        'Petrol/Diesel': 'mdi:gas-station',
        'Vehicle Maintenance': 'mdi:wrench',
        'Vehicle Insurance': 'mdi:shield-car',
        'Bank Loans': 'mdi:bank',
        'Credit Card Payments': 'mdi:credit-card',
        'Income Tax': 'mdi:currency-usd',
        
        // Income Categories
        'Salary': 'mdi:cash-multiple',
        'Foreign Remittances': 'mdi:airplane',
        'Rental Income': 'mdi:key-chain',
        'Agricultural Income': 'mdi:sprout',
        'Business Profits': 'mdi:briefcase',
        'Investment Returns': 'mdi:chart-line',
        'Government Allowances': 'mdi:hand-coin',
        'Freelance Income': 'mdi:laptop'
    };
    return icons[categoryName] || 'mdi:tag-outline';
};

const getCategoryColor = (type) => {
    const colors = {
        'Income': 'success',    // Green
        'Expense': 'danger'     // Red
    };
    return colors[type] || 'primary';
};


export default BudgetThresholdForm;
