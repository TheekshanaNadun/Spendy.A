import React, { useState, useEffect } from 'react';
import $ from 'jquery';
import 'datatables.net-dt/js/dataTables.dataTables.js';
import { Icon } from '@iconify/react';
import Swal from 'sweetalert2';

const TransactionTable = () => {
    const [transactions, setTransactions] = useState([]);
    const [selectedTransaction, setSelectedTransaction] = useState(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const perPage = 10;

    const fetchTransactions = async () => {
        try {
            setLoading(true);
            const response = await fetch(`http://localhost:5000/api/transactions?page=${page}&per_page=${perPage}`, {
                credentials: 'include'
            });
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const data = await response.json();
            setTransactions(data);
        } catch (error) {
            console.error('Error:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Failed to fetch transactions'
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTransactions();
    }, [page]);
    

    const [categories, setCategories] = useState([]);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await fetch('http://localhost:5000/api/categories', {
                    credentials: 'include'
                });
                const data = await response.json();
                setCategories(data);
            } catch (error) {
                console.error('Error fetching categories:', error);
            }
        };
        fetchCategories();
    }, []);


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
        return icons[category] || 'mdi:help-circle';
    };
    
    const handleUpdate = async (updatedData) => {
        try {
            const response = await fetch(`http://localhost:5000/api/transactions/${selectedTransaction.transaction_id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...updatedData,
                    date: new Date(updatedData.date).toISOString().split('T')[0]
                }),
                credentials: 'include'
            });
    
            if (!response.ok) throw new Error('Update failed');
            
            // Use pagination.currentPage from existing state
            const newData = await fetch(`http://localhost:5000/api/transactions?page=${page}`, {
                credentials: 'include'
            }).then(res => res.json());
            
            setTransactions(newData);
            setShowEditModal(false);
            Swal.fire({
                icon: 'success',
                title: 'Updated!',
                text: 'Transaction has been updated successfully',
                timer: 2000,
                showConfirmButton: false
            });
    
        } catch (error) {
            console.error('Update error:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Failed to update transaction'
            });
        }
    };
    
    const handleDelete = async (id) => {
        // Use SweetAlert2 for better confirmation
        const result = await Swal.fire({
            title: 'Are you sure?',
            text: "You won't be able to revert this!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete it!',
            cancelButtonText: 'Cancel'
        });

        if (result.isConfirmed) {
            try {
                setLoading(true);
                const response = await fetch(`http://localhost:5000/api/transactions/${id}`, {
                    method: 'DELETE',
                    credentials: 'include'
                });
                
                if (response.ok) {
                    // Show success notification
                    Swal.fire({
                        icon: 'success',
                        title: 'Deleted!',
                        text: 'Transaction has been deleted successfully',
                        timer: 2000,
                        showConfirmButton: false
                    });

                    // Refresh the transactions list
                    await fetchTransactions();
                } else {
                    throw new Error('Failed to delete transaction');
                }
            } catch (error) {
                console.error('Delete error:', error);
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Failed to delete transaction'
                });
            } finally {
                setLoading(false);
            }
        }
    };
    
    
    
    
    return (
        <>
            <div style={{ padding: '20px' }}>
                <div className="card shadow-sm" style={{ borderColor: 'var(--border-color)' }}>
                    <div className="card-header d-flex justify-content-between align-items-center py-3 border-bottom">
                        <h5 className="card-title mb-0 text-secondary-light">Transaction History</h5>
                        <div className="d-flex align-items-center gap-2">
                            <button 
                                className="btn btn-sm btn-light px-3 py-1 rounded-pill border"
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                            >
                                <Icon icon="mdi:chevron-left" width="20" />
                            </button>
                            <span className="text-muted small">Page {page}</span>
                            <button 
                                className="btn btn-sm btn-light px-3 py-1 rounded-pill border"
                                onClick={() => setPage(p => p + 1)}
                            >
                                <Icon icon="mdi:chevron-right" width="20" />
                            </button>
                        </div>
                    </div>
                    <div className="card-body p-0">
                        <div className="table-responsive">
                            <table className="table bordered-table mb-0">
                                <thead className="bg-light">
                                    <tr>
                                        <th scope="col" className="text-secondary-light">ID</th>
                                        <th scope="col" className="text-secondary-light">Item</th>
                                        <th scope="col" className="text-secondary-light">Category</th>
                                        <th scope="col" className="text-secondary-light">Type</th>
                                        <th scope="col" className="text-secondary-light">Date</th>
                                        <th scope="col" className="text-secondary-light">Time</th>
                                        <th scope="col" className="text-secondary-light text-end">Amount</th>
                                        <th scope="col" className="text-secondary-light">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {transactions.map((transaction) => (
                                        <tr key={transaction.transaction_id}>
                                            <td className="font-monospace text-secondary-light">
                                                #{transaction.transaction_id.toString().slice(0, 6)}
                                            </td>
                                            <td>
                                                <div className="d-flex align-items-center gap-2">
                                                    <Icon
                                                        icon={getCategoryIcon(transaction.category)}
                                                        className="flex-shrink-0 me-12 text-primary"
                                                        width="24"
                                                    />
                                                    <span className="text-secondary-light fw-semibold">
                                                        {transaction.item}
                                                    </span>
                                                </div>
                                            </td>
                                            <td>
                                                <span className="badge bg-dark text-light rounded-pill px-24 py-4">
                                                    {transaction.category}
                                                </span>
                                            </td>
                                            <td>
                                                <span className={`badge ${transaction.type === 'Income' 
                                                    ? 'bg-success-focus text-success-main' 
                                                    : 'bg-danger-focus text-danger-main'} rounded-pill px-24 py-4`}>
                                                    {transaction.type}
                                                </span>
                                            </td>
                                            <td className="text-secondary-light">
                                                {new Date(transaction.date).toLocaleDateString('en-GB', {
                                                    day: '2-digit',
                                                    month: 'short'
                                                })}
                                            </td>
                                            <td className="text-secondary-light">
                                                {/* Format time as in TablesBorderColorsThree */}
                                                {(() => {
                                                    const timeString = transaction.timestamp;
                                                    if (!timeString) return 'N/A';
                                                    const [hours, minutes] = timeString.split(':');
                                                    const hour = parseInt(hours, 10);
                                                    return `${hour % 12 || 12}:${minutes} ${hour >= 12 ? 'PM' : 'AM'}`;
                                                })()}
                                            </td>
                                            <td className="text-end">
                                                <span className={
                                                    `font-monospace ${
                                                        transaction.type === 'Income' 
                                                        ? 'text-success-main' 
                                                        : 'text-danger-main'
                                                    }`
                                                }>
                                                    {new Intl.NumberFormat('en-LK', {
                                                        style: 'currency',
                                                        currency: 'LKR',
                                                        minimumFractionDigits: 2
                                                    }).format(transaction.price)}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="d-flex gap-2">
                                                    <button
                                                        title="Edit Transaction"
                                                        onClick={() => { setSelectedTransaction(transaction); setShowEditModal(true); }}
                                                        className="btn btn-sm btn-outline-primary"
                                                        style={{
                                                            width: '32px',
                                                            height: '32px',
                                                            borderRadius: '6px',
                                                            padding: '0',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            transition: 'all 0.2s ease',
                                                            borderWidth: '1.5px'
                                                        }}
                                                        onMouseOver={(e) => {
                                                            e.currentTarget.style.transform = 'translateY(-1px)';
                                                            e.currentTarget.style.boxShadow = '0 2px 8px rgba(13, 110, 253, 0.2)';
                                                        }}
                                                        onMouseOut={(e) => {
                                                            e.currentTarget.style.transform = 'translateY(0)';
                                                            e.currentTarget.style.boxShadow = 'none';
                                                        }}
                                                    >
                                                        <Icon icon="mdi:pencil" width="16" />
                                                    </button>
                                                    <button
                                                        title="Delete Transaction"
                                                        onClick={() => handleDelete(transaction.transaction_id)}
                                                        className="btn btn-sm btn-outline-danger"
                                                        style={{
                                                            width: '32px',
                                                            height: '32px',
                                                            borderRadius: '6px',
                                                            padding: '0',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            transition: 'all 0.2s ease',
                                                            borderWidth: '1.5px'
                                                        }}
                                                        onMouseOver={(e) => {
                                                            e.currentTarget.style.transform = 'translateY(-1px)';
                                                            e.currentTarget.style.boxShadow = '0 2px 8px rgba(220, 53, 69, 0.2)';
                                                        }}
                                                        onMouseOut={(e) => {
                                                            e.currentTarget.style.transform = 'translateY(0)';
                                                            e.currentTarget.style.boxShadow = 'none';
                                                        }}
                                                    >
                                                        <Icon icon="mdi:delete" width="16" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
            {showEditModal && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    color: 'black',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000
                }}>
                    <div style={{
                        backgroundColor: 'white',
                        padding: '2rem',
                        borderRadius: '8px',
                        width: '1000px',
                        maxHeight: '100vh',
                        display: 'flex',
                        flexDirection: 'column'
                    }}>
                        <div style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center', 
                            marginBottom: '1.5rem' 
                        }}>
                            <h3 style={{ margin: 0 , color: 'black'}}>Edit Transaction</h3>
                            <button 
                                onClick={() => setShowEditModal(false)}
                                style={{
                                    border: 'none',
                                    background: 'none',
                                    cursor: 'pointer',
                                    padding: '4px'
                                }}
                            >
                                <Icon icon="ic:round-close" width="24" />
                            </button>
                        </div>
                        <form onSubmit={async (e) => {
                            e.preventDefault();
                            const formData = new FormData(e.target);
                            handleUpdate({
                                item: formData.get('item'),
                                price: Number(formData.get('price')),
                                date: formData.get('date'),
                                location: formData.get('location'),
                                category: formData.get('category'),
                                type: formData.get('type'),
                                timestamp: formData.get('timestamp'),
                                latitude: Number(formData.get('latitude')),
                                longitude: Number(formData.get('longitude'))
                            });
                        }} style={{ flex: 1, overflowY: 'auto', paddingRight: '8px' }}>
                            <div style={{ 
                                display: 'grid',
                                gridTemplateColumns: 'repeat(2, 1fr)',
                                gap: '1rem',
                                marginBottom: '1rem'
                            }}>
                                {/* Left Column */}
                                <div>
                                    <div style={{ marginBottom: '1rem' }}>
                                        <label style={{ display: 'block', marginBottom: '0.5rem' }}>Item:</label>
                                        <input
                                            type="text"
                                            name="item"
                                            defaultValue={selectedTransaction?.item}
                                            style={{
                                                width: '100%',
                                                padding: '0.5rem',
                                                border: '1px solid black',
                                                borderRadius: '4px'
                                            }}
                                        />
                                    </div>

                                    <div style={{ marginBottom: '1rem' }}>
                                        <label style={{ display: 'block', marginBottom: '0.5rem' }}>Price:</label>
                                        <input
                                            type="number"
                                            name="price"
                                            defaultValue={selectedTransaction?.price}
                                            style={{
                                                width: '100%',
                                                padding: '0.5rem',
                                                border: '1px solid black',
                                                borderRadius: '4px'
                                            }}
                                        />
                                    </div>

                                    <div style={{ marginBottom: '1rem' }}>
                                        <label style={{ display: 'block', marginBottom: '0.5rem' }}>Date:</label>
                                        <input
                                            type="date"
                                            name="date"
                                            defaultValue={selectedTransaction?.date}
                                            style={{
                                                width: '100%',
                                                padding: '0.5rem',
                                                border: '1px solid black',
                                                borderRadius: '4px'
                                            }}
                                        />
                                    </div>
                                </div>

                                {/* Right Column */}
                                <div>
                                    <div style={{ marginBottom: '1rem' }}>
                                        <label style={{ display: 'block', marginBottom: '0.5rem' }}>Time:</label>
                                        <input
                                            type="time"
                                            name="timestamp"
                                            defaultValue={selectedTransaction?.timestamp}
                                            style={{
                                                width: '100%',
                                                padding: '0.5rem',
                                                border: '1px solid black',
                                                borderRadius: '4px'
                                            }}
                                        />
                                    </div>

                                    <div style={{ marginBottom: '1rem' }}>
                                        <label style={{ display: 'block', marginBottom: '0.5rem' }}>Location:</label>
                                        <input
                                            type="text"
                                            name="location"
                                            defaultValue={selectedTransaction?.location}
                                            style={{
                                                width: '100%',
                                                padding: '0.5rem',
                                                border: '1px solid black',
                                                borderRadius: '4px'
                                            }}
                                        />
                                    </div>

                                    <div style={{ marginBottom: '1rem' }}>
                                        <label style={{ display: 'block', marginBottom: '0.5rem' }}>Category:</label>
                                        <select
                                            name="category"
                                            value={`${selectedTransaction?.category}|${selectedTransaction?.type}`}
                                            onChange={(e) => {
                                                const [category, type] = e.target.value.split('|');
                                                setSelectedTransaction(prev => ({
                                                    ...prev,
                                                    category,
                                                    type
                                                }));
                                            }}
                                            style={{
                                                width: '100%',
                                                padding: '0.5rem',
                                                border: '1px solid black',
                                                borderRadius: '4px'
                                            }}
                                        >
                                            <option value="">Select Category</option>
                                            {categories.map(cat => (
                                                <option 
                                                    key={cat.category_id} 
                                                    value={`${cat.name}|${cat.type}`}
                                                >
                                                    {cat.name} ({cat.type})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <input 
                                type="hidden" 
                                name="latitude" 
                                value={selectedTransaction?.latitude || ''} 
                            />
                            <input 
                                type="hidden" 
                                name="longitude" 
                                value={selectedTransaction?.longitude || ''} 
                            />

                            <div style={{ 
                                display: 'flex', 
                                justifyContent: 'flex-end', 
                                gap: '1rem', 
                                marginTop: '2rem',
                                position: 'sticky',
                                bottom: 0,
                                backgroundColor: 'white',
                                padding: '1rem 0'
                            }}>
                                <button
                                    type="button"
                                    onClick={() => setShowEditModal(false)}
                                    style={{
                                        padding: '0.5rem 1rem',
                                        border: '1px solid black',
                                        borderRadius: '4px',
                                        backgroundColor: 'white',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    style={{
                                        padding: '0.5rem 1rem',
                                        backgroundColor: 'var(--primary-color, #3B82F6)',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
};

export default TransactionTable;
