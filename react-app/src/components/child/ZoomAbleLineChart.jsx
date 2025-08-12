import React from 'react'
import ReactApexChart from 'react-apexcharts'
import useReactApexChart from '../../hook/useReactApexChart'
import { useDashboardData } from '../DashboardDataProvider'

const ZoomAbleLineChart = () => {
    const { dashboardData, loading, error } = useDashboardData();
    let { zoomAbleLineChartSeries, zoomAbleLineChartOptions } = useReactApexChart()

    if (loading) return <div className="text-center py-4">Loading...</div>;
    if (error) return <div className="text-danger">{error}</div>;
    if (!dashboardData) return <div className="text-secondary">No data available.</div>;

    // Get real data from dashboard
    const { months = [], monthlyIncome = [] } = dashboardData;
    
    // Create real series data - Monthly Income Trend
    const realSeries = [
        {
            name: "Monthly Income",
            data: monthlyIncome || []
        }
    ];

    // Update chart options with real data and LKR currency
    const updatedChartOptions = {
        ...zoomAbleLineChartOptions,
        xaxis: {
            ...zoomAbleLineChartOptions.xaxis,
            categories: months || []
        },
        tooltip: {
            enabled: true,
            x: {
                format: "MMM yyyy",
            },
            y: {
                formatter: function (value) {
                    return "LKR " + value.toLocaleString();
                },
            },
        },
        legend: {
            show: true,
            position: 'top',
            horizontalAlign: 'right',
            fontSize: '12px',
        },
    };

    return (
        <div className="col-md-6">
            <div className="card h-100 p-0">
                <div className="card-header border-bottom bg-base py-16 px-24">
                    <h6 className="text-lg fw-semibold mb-0">Monthly Income Trend</h6>
                </div>
                <div className="card-body p-24">
                    {realSeries[0].data.length > 0 ? (
                        <ReactApexChart 
                            id="zoomAbleLineChart" 
                            options={updatedChartOptions} 
                            series={realSeries} 
                            type="area"
                            height={264} 
                        />
                    ) : (
                        <div className="text-center py-4">
                            <div className="mb-3">
                                <i className="ri-line-chart-line text-3xl text-secondary-light"></i>
                            </div>
                            <h6 className="text-sm text-secondary-light mb-2">No Income Data</h6>
                            <p className="text-xs text-secondary-light mb-3">
                                Start adding income sources to see your monthly earning trends.
                            </p>
                            <button className="btn btn-outline-success btn-sm">
                                <i className="ri-add-line me-2"></i>Add Income
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default ZoomAbleLineChart