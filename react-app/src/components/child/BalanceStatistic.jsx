import React, { useState, useEffect } from "react";
import useReactApexChart from "../../hook/useReactApexChart";
import ReactApexChart from "react-apexcharts";

const BalanceStatistic = () => {
  const [timeFrame, setTimeFrame] = useState('Today');
  const [statistics, setStatistics] = useState({
    income: 0,
    expense: 0,
    chartData: []
  });
  
  let { balanceStatisticsOptions, balanceStatisticsSeries } = useReactApexChart();

  useEffect(() => {
    fetchStatistics(timeFrame);
  }, [timeFrame]);

  const fetchStatistics = async (period) => {
    try {
      const response = await fetch(`/api/statistics?period=${period}`);
      const data = await response.json();
      
      setStatistics(data);
      
      // Update chart series with new data
      balanceStatisticsSeries = [
        {
          name: 'Income',
          data: data.chartData.income
        },
        {
          name: 'Expense',
          data: data.chartData.expense
        }
      ];
    } catch (error) {
      console.error('Error fetching statistics:', error);
    }
  };

  const handlePeriodChange = (e) => {
    setTimeFrame(e.target.value);
  };

  return (
    <div className='col-12'>
      <div className='card h-100'>
        <div className='card-body'>
          <div className='d-flex align-items-center flex-wrap gap-2 justify-content-between'>
            <h6 className='mb-2 fw-bold text-lg mb-0'>Balance Statistic</h6>
            <select 
              className='form-select form-select-sm w-auto bg-base border text-secondary-light'
              value={timeFrame}
              onChange={handlePeriodChange}
            >
              <option>Today</option>
              <option>Weekly</option>
              <option>Monthly</option>
              <option>Yearly</option>
            </select>
          </div>
          <ul className='d-flex flex-wrap align-items-center justify-content-center mt-3 gap-3'>
            <li className='d-flex align-items-center gap-2'>
              <span className='w-12-px h-12-px rounded-circle bg-primary-600' />
              <span className='text-secondary-light text-sm fw-semibold'>
                Income:
                <span className='text-primary-light fw-bold'>
                  {statistics.income}
                </span>
              </span>
            </li>
            <li className='d-flex align-items-center gap-2'>
              <span className='w-12-px h-12-px rounded-circle bg-yellow' />
              <span className='text-secondary-light text-sm fw-semibold'>
                Expense:
                <span className='text-primary-light fw-bold'>
                  {statistics.expense}
                </span>
              </span>
            </li>
          </ul>
          <div className='mt-40'>
            <div id='balanceStatistics'>
              <ReactApexChart
                options={balanceStatisticsOptions}
                series={balanceStatisticsSeries}
                type='bar'
                height={250}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BalanceStatistic;
