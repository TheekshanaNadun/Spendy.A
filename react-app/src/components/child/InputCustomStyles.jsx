import { Icon } from '@iconify/react/dist/iconify.js';
import React from 'react';

const TransactionForm = () => {
    return (
        <div className="col-lg-12">
            <div className="card">
                <div className="card-header">
                    <h5 className="card-title mb-0">Transaction Record</h5>
                </div>
                <div className="card-body">
                    <form className="row gy-3 needs-validation" noValidate="">
                        <div className="col-md-6">
                            <label className="form-label">Item</label>
                            <input
                                type="text"
                                className="form-control"
                                placeholder="Enter item name"
                                required
                            />
                            <div className="invalid-feedback">Please enter an item</div>
                        </div>

                        <div className="col-md-3">
                            <label className="form-label">Price</label>
                            <input
                                type="number"
                                className="form-control"
                                placeholder="Amount"
                                required
                            />
                            <div className="invalid-feedback">Please enter price</div>
                        </div>

                        <div className="col-md-3">
                            <label className="form-label">Date</label>
                            <input
                                type="date"
                                className="form-control"
                                required
                            />
                        </div>

                        <div className="col-md-4">
                            <label className="form-label">Category</label>
                            <select className="form-select" required>
                                <option value="">Select Category</option>
                                <option value="Food">Food</option>
                                <option value="Bills">Bills</option>
                                <option value="Income">Income</option>
                                <option value="Transportation">Transportation</option>
                            </select>
                        </div>

                        <div className="col-md-4">
                            <label className="form-label">Type</label>
                            <select className="form-select" required>
                                <option value="">Select Type</option>
                                <option value="Income">Income</option>
                                <option value="Expense">Expense</option>
                            </select>
                        </div>

                        <div className="col-md-4">
                            <label className="form-label">Time</label>
                            <input
                                type="time"
                                className="form-control"
                            />
                        </div>

                        <div className="col-md-12">
                            <label className="form-label">Location</label>
                            <input
                                type="text"
                                className="form-control"
                                placeholder="Enter location"
                            />
                        </div>

                        <div className="col-12">
                            <button className="btn btn-primary-600" type="submit">
                                Submit Transaction
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default TransactionForm;
