import React, { useState, useEffect } from 'react';
import { Icon } from '@iconify/react/dist/iconify.js';

const ExpenseTransactionsTable = () => {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Category icons mapping
    const getCategoryIcon = (category) => {
        const icons = {
            // Expense Categories
            'Food & Groceries': 'mdi:cart',
            'Public Transportation (Bus/Train)': 'mdi:bus',
            'Three Wheeler Fees': 'mdi:car',
            'Electricity (CEB)': 'mdi:flash',
            'Water Supply': 'mdi:water',
            'Entertainment': 'mdi:party-popper',
            'Mobile Prepaid': 'mdi:cellphone',
            'Internet (ADSL/Fiber)': 'mdi:ethernet',
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
            'Vehicle Insurance': 'mdi:car-brake-alert',
            'Bank Loans': 'mdi:bank',
            'Credit Card Payments': 'mdi:credit-card',
            'Income Tax': 'mdi:currency-usd',
    
            // Income Categories
            'Salary': 'mdi:wallet',
            'Foreign Remittances': 'mdi:airplane',
            'Rental Income': 'mdi:home-city',
            'Agricultural Income': 'mdi:corn',
            'Business Profits': 'mdi:briefcase',
            'Investment Returns': 'mdi:chart-line',
            'Government Allowances': 'mdi:hand-coin',
            'Freelance Income': 'mdi:laptop'
        };
        return icons[category] || 'mdi:wallet';
    };

    // Fetch expense transactions with error handling
    useEffect(() => {
        const fetchExpenseTransactions = async () => {
            try {
                const response = await fetch('http://localhost:5000/api/transactions/expense', {
                    credentials: 'include' // Essential for session cookies
                });
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const data = await response.json();
                setTransactions(data);
                setError(null);
            } catch (error) {
                console.error('Error fetching transactions:', error);
                setError(error.message);
            } finally {
                setLoading(false);
            }
        };
        fetchExpenseTransactions();
    }, []);

    // Maintain 5 rows for consistent layout
    const displayData = transactions.length >= 6 ? 
        transactions.slice(0, 6) : 
        [...transactions, ...Array(6 - transactions.length).fill({})];

    return (
        <div className="col-lg-6">
            <div className="card">
                <div className="card-header">
                    <h5 className="card-title mb-0">Expense Transactions</h5>
                </div>
                <div className="card-body">
                    {loading ? (
                        <div className="text-center py-4">
                            <div className="spinner-border text-primary" role="status">
                                <span className="visually-hidden">Loading...</span>
                            </div>
                        </div>
                    ) : error ? (
                        <div className="alert alert-danger">
                            Error loading transactions: {error}
                        </div>
                    ) : (
                        <div className="table-responsive">
                            <table className="table colored-row-table mb-0">
                                <thead>
                                    <tr>
                                        <th className="bg-base">Item Name</th>
                                        <th className="bg-base" >Category</th>
                                        <th className="bg-base"style={{ width: '100px' }}>Date</th>
                                        <th className="bg-base" style={{ width: '100px' }}>Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {displayData.map((transaction, index) => (
                                        <tr key={transaction.transaction_id || index}>
                                            <td className="bg-primary-light">
                                                {transaction.item || '----------'}
                                            </td>
                                          
                                            <td className="bg-info-focus">
                                                <div className="d-flex align-items-center">
                                                    <Icon 
                                                        icon={getCategoryIcon(transaction.category)} 
                                                        className="me-2" 
                                                        width={20}
                                                    />
                                                    {transaction.category || 'N/A'}
                                                </div>
                                            </td>
                                            <td className="bg-warning-focus">
                                                {transaction.date ? 
                                                    new Date(transaction.date).toLocaleDateString('en-GB') : 
                                                    '--/--/----'}
                                            </td>
                                            
                                            
                                            <td className="bg-success-focus text-danger fw-bold text-end">
                                                {transaction.price ? 
                                                    new Intl.NumberFormat('en-LK', {
                                                        style: 'currency',
                                                        currency: 'LKR',
                                                        minimumFractionDigits: 0
                                                    }).format(transaction.price) : 
                                                    '-----'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ExpenseTransactionsTable;
