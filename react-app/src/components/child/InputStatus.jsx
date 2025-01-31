import { Icon } from '@iconify/react/dist/iconify.js';
import React from 'react';

const BudgetThresholdForm = () => {
    return (
        <div className="col-lg-12">
            <div className="card">
                <div className="card-header">
                    <h5 className="card-title mb-0">Budget Threshold Settings</h5>
                </div>
                <div className="card-body">
                    <form className="row gy-3 needs-validation" noValidate="">
                        {/* Monthly Expense Limit */}
                        <div className="col-md-6">
                            <label className="form-label">Monthly Expense Limit</label>
                            <div className="icon-field has-validation">
                                <span className="icon">
                                    <Icon icon="ph:currency-dollar-bold" />
                                </span>
                                <input
                                    type="number"
                                    className="form-control"
                                    placeholder="Monthly budget cap"
                                    required
                                />
                                <div className="invalid-feedback">
                                    Required monthly limit
                                </div>
                            </div>
                        </div>

                        {/* Add New Category Threshold */}
                        <div className="col-md-6">
                            <label className="form-label">Add New Threshold</label>
                            <div className="input-group has-validation">
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Category name"
                                    required
                                />
                                <input
                                    type="number"
                                    className="form-control"
                                    placeholder="Limit value"
                                    required
                                />
                                <button 
                                    type="button" 
                                    className="btn btn-primary-600"
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
                                            <th>Expense Type</th>
                                            <th>Limit</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td>
                                                <Icon 
                                                    icon="fluent:food-24-regular" 
                                                    className="text-primary" 
                                                    width={24}
                                                />
                                            </td>
                                            <td>Food</td>
                                            <td>$500</td>
                                            <td>
                                                <button className="btn btn-sm btn-link">
                                                    <Icon icon="mdi:pencil-outline" />
                                                </button>
                                                <button className="btn btn-sm btn-link text-danger">
                                                    <Icon icon="mdi:trash-can-outline" />
                                                </button>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td>
                                                <Icon 
                                                    icon="ic:round-directions-car" 
                                                    className="text-success" 
                                                    width={24}
                                                />
                                            </td>
                                            <td>Transportation</td>
                                            <td>$300</td>
                                            <td>
                                                <button className="btn btn-sm btn-link">
                                                    <Icon icon="mdi:pencil-outline" />
                                                </button>
                                                <button className="btn btn-sm btn-link text-danger">
                                                    <Icon icon="mdi:trash-can-outline" />
                                                </button>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td>
                                                <Icon 
                                                    icon="mdi:file-document-outline" 
                                                    className="text-warning" 
                                                    width={24}
                                                />
                                            </td>
                                            <td>Bills</td>
                                            <td>$1200</td>
                                            <td>
                                                <button className="btn btn-sm btn-link">
                                                    <Icon icon="mdi:pencil-outline" />
                                                </button>
                                                <button className="btn btn-sm btn-link text-danger">
                                                    <Icon icon="mdi:trash-can-outline" />
                                                </button>
                                            </td>
                                        </tr>
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

export default BudgetThresholdForm;
