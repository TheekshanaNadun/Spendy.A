import React, { useState, useEffect } from 'react';
import $ from 'jquery';
import 'datatables.net-dt/js/dataTables.dataTables.js';
import { Icon } from '@iconify/react';

const TransactionTable = () => {
    const [transactions, setTransactions] = useState([]);
    const [selectedTransaction, setSelectedTransaction] = useState(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [page, setPage] = useState(1);

    useEffect(() => {
    const fetchTransactions = async () => {
        try {
            const response = await fetch(`http://localhost:5000/api/transactions?page=${page}`, {
                credentials: 'include'
            });
            const data = await response.json();
            
            // Destroy existing DataTable instance first
            if ($.fn.DataTable.isDataTable('#transactionTable')) {
                $('#transactionTable').DataTable().destroy();
            }

            setTransactions(data);

            
        } catch (error) {
            console.error('Error:', error);
        }
    };
    fetchTransactions();
}, [page]);

    
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
            
            // Refresh data after update
            const newData = await fetch(`http://localhost:5000/api/transactions?page=${page}`, {
                credentials: 'include'
            }).then(res => res.json());
            
            setTransactions(newData);
            setShowEditModal(false);
    
        } catch (error) {
            console.error('Update error:', error);
            alert('Failed to update transaction');
        }
    };
    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this transaction?')) {
            try {
                await fetch(`http://localhost:5000/api/transactions/${id}`, {
                    method: 'DELETE',
                    credentials: 'include'
                });
                window.location.reload();
            } catch (error) {
                console.error('Delete error:', error);
            }
        }
    };

    return (
        <div style={{ padding: '20px' }}>
            <div style={{ 
                borderRadius: '8px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                border: '1px solid var(--border-color, #E5E7EB)'
            }}>
                <div style={{
                    padding: '1rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderBottom: '1px solid var(--border-color, #E5E7EB)'
                }}>
                    <h5 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '600' }}>
                        Transaction History
                    </h5>
                </div>

                <div style={{ padding: '1rem' }}>
                    <table id="transactionTable" style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0' }}>
                        <thead>
                            <tr>
                                <th style={{ padding: '12px', borderBottom: '1px solid var(--border-color, #E5E7EB)' }}>ID</th>
                                <th style={{ padding: '12px', borderBottom: '1px solid var(--border-color, #E5E7EB)' }}>Item</th>
                                <th style={{ padding: '12px', borderBottom: '1px solid var(--border-color, #E5E7EB)' }}>Category</th>
                                <th style={{ padding: '12px', borderBottom: '1px solid var(--border-color, #E5E7EB)' }}>Location</th>
                                <th style={{ padding: '12px', borderBottom: '1px solid var(--border-color, #E5E7EB)' }}>Date</th>
                                <th style={{ padding: '12px', borderBottom: '1px solid var(--border-color, #E5E7EB)' }}>Time</th>
                                <th style={{ padding: '12px', borderBottom: '1px solid var(--border-color, #E5E7EB)', textAlign: 'right' }}>Amount</th>
                                <th style={{ padding: '12px', borderBottom: '1px solid var(--border-color, #E5E7EB)', textAlign: 'center' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {transactions.map((transaction) => (
                                <tr key={transaction.transaction_id}>
                                    <td style={{ padding: '12px', borderBottom: '1px solid var(--border-color, #E5E7EB)' }}>
                                        #{transaction.transaction_id.toString().padStart(6, '0')}
                                    </td>
                                    <td style={{ padding: '12px', borderBottom: '1px solid var(--border-color, #E5E7EB)' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <Icon icon={getCategoryIcon(transaction.category)} width="20" />
                                            <span>{transaction.item}</span>
                                        </div>
                                    </td>
                                    <td style={{ padding: '12px', borderBottom: '1px solid var(--border-color, #E5E7EB)' }}>
                                        <span style={{
                                            padding: '4px 12px',
                                            borderRadius: '999px',
                                            fontSize: '0.875rem',
                                            backgroundColor: 'rgba(var(--badge-bg), 0.1)',
                                            color: 'var(--text-color)'
                                        }}>
                                            {transaction.category || 'Other'}
                                        </span>
                                    </td>
                                    <td style={{ padding: '12px', borderBottom: '1px solid var(--border-color, #E5E7EB)' }}>
                                        {transaction.location || 'N/A'}
                                    </td>
                                    <td style={{ padding: '12px', borderBottom: '1px solid var(--border-color, #E5E7EB)' }}>
                                        {new Date(transaction.date).toLocaleDateString('en-GB')}
                                    </td>
                                    <td style={{ padding: '12px', borderBottom: '1px solid var(--border-color, #E5E7EB)' }}>
                                        {transaction.timestamp}
                                    </td>
                                    <td style={{ padding: '12px', borderBottom: '1px solid var(--border-color, #E5E7EB)', textAlign: 'right' }}>
                                        <span style={{ color: transaction.type === 'Income' ? 'var(--success)' : 'var(--danger)' }}>
                                            {new Intl.NumberFormat('en-LK', {
                                                style: 'currency',
                                                currency: 'LKR'
                                            }).format(transaction.price)}
                                        </span>
                                    </td>
                                    <td style={{ 
                                        padding: '12px', 
                                        borderBottom: '1px solid var(--border-color, #E5E7EB)',
                                        textAlign: 'center'
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                                            <button
                                                onClick={() => {
                                                    setSelectedTransaction(transaction);
                                                    setShowEditModal(true);
                                                }}
                                                style={{
                                                    width: '32px',
                                                    height: '32px',
                                                    borderRadius: '50%',
                                                    border: 'none',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    cursor: 'pointer',
                                                    backgroundColor: 'rgba(var(--success-rgb), 0.1)',
                                                    color: 'var(--success)'
                                                }}
                                            >
                                                <Icon icon="lucide:edit" width="16" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(transaction.transaction_id)}
                                                style={{
                                                    width: '32px',
                                                    height: '32px',
                                                    borderRadius: '50%',
                                                    border: 'none',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    cursor: 'pointer',
                                                    backgroundColor: 'rgba(var(--danger-rgb), 0.1)',
                                                    color: 'var(--danger)'
                                                }}
                                            >
                                                <Icon icon="mingcute:delete-2-line" width="16" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
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
                    <Icon icon="mdi:close" width="20" />
                </button>
            </div>
            
            <form onSubmit={(e) => {
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
                                defaultValue={selectedTransaction?.category}
                                style={{
                                    width: '100%',
                                    padding: '0.5rem',
                                    border: '1px solid black',
                                    borderRadius: '4px'
                                }}
                            >
                                <option value="Food">🍔 Food</option>
                                <option value="Transport">🚗 Transport</option>
                                <option value="Bills">📑 Bills</option>
                                <option value="Shopping">🛍️ Shopping</option>
                                <option value="Healthcare">🏥 Healthcare</option>
                                <option value="Education">📚 Education</option>
                                <option value="Personal care">💅 Personal Care</option>
                                <option value="Electronics">💻 Electronics</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem' }}>Type:</label>
                    <select
                        name="type"
                        defaultValue={selectedTransaction?.type}
                        style={{
                            width: '100%',
                            padding: '0.5rem',
                            border: '1px solid black',

                            borderRadius: '4px'
                        }}
                    >
                        <option value="Income">Income</option>
                        <option value="Expense">Expense</option>
                    </select>
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


        </div>
    );
};

const getCategoryIcon = (category) => {
    const icons = {
        'Food': 'mdi:food',
        'Transport': 'mdi:car',
        'Bills': 'mdi:file-document',
        'Shopping': 'mdi:shopping',
        'Healthcare': 'mdi:medical-bag',
        'Education': 'mdi:school',
        'Income': 'mdi:cash-plus'
    };
    return icons[category] || 'mdi:help-circle';
};

export default TransactionTable;
