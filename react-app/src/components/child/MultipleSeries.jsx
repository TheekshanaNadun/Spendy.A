import React from 'react'
import ReactApexChart from 'react-apexcharts'
import { useDashboardData } from '../DashboardDataProvider'

const MultipleSeries = () => {
    const { dashboardData, loading, error } = useDashboardData();
    if (loading) return <div className="text-center py-4">Loading...</div>;
    if (error) return <div className="text-danger">{error}</div>;
    if (!dashboardData) return <div className="text-secondary">No data available.</div>;

    const { months, netProfit, monthlyIncome, monthlyExpense } = dashboardData;
    const chartOptions = {
        chart: { type: 'polarArea', height: 264 },
        labels: ['Net Profit', 'Income', 'Expense'],
        stroke: { colors: ['#fff'] },
        fill: { opacity: 0.8 },
        yaxis: { show: true },
        legend: { show: true, position: 'bottom' },
        plotOptions: { polarArea: { rings: { strokeWidth: 0 }, spokes: { strokeWidth: 0 } } },
    };
    const chartSeries = [
        netProfit.reduce((a, b) => a + b, 0),
        monthlyIncome.reduce((a, b) => a + b, 0),
        monthlyExpense.reduce((a, b) => a + b, 0)
    ];
    return (
        <div className="col-md-6">
            <div className="card h-100 p-0">
                <div className="card-header border-bottom bg-base py-16 px-24">
                    <h6 className="text-lg fw-semibold mb-0">Multiple series</h6>
                </div>
                <div className="card-body p-24 text-center">
                    <ReactApexChart id="multipleSeriesChart"
                        className="square-marker check-marker series-gap-24 d-flex justify-content-center" options={chartOptions} series={chartSeries} type="polarArea"
                        height={264} />
                </div>
            </div>
        </div>
    )
}

export default MultipleSeries