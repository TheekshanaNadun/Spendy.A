import pandas as pd
from statsmodels.tsa.arima.model import ARIMA
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
import numpy as np
from datetime import datetime, timedelta
import warnings
warnings.filterwarnings('ignore')

def arima_forecast(series: pd.Series, steps: int = 30) -> list:
    """
    Fit an ARIMA(1,1,1) model to the given series and forecast the next `steps` values.
    If the series is all zeros or too short, returns a fallback forecast.
    """
    if series.sum() == 0 or len(series) < 3:
        return [0.0] * steps
    try:
        model = ARIMA(series, order=(1,1,1))
        model_fit = model.fit()
        forecast = model_fit.forecast(steps=steps)
        return [float(x) for x in forecast]
    except Exception:
        # fallback: repeat last value
        return [float(series.iloc[-1])] * steps 

def detect_anomalies(transactions_df: pd.DataFrame, contamination: float = 0.1) -> dict:
    """
    Detect anomalous transactions using Isolation Forest
    """
    try:
        if len(transactions_df) < 10:
            return {'anomalies': [], 'anomaly_scores': []}
        
        # Prepare features for anomaly detection
        features = transactions_df[['price', 'day_of_week', 'hour']].fillna(0)
        
        # Standardize features
        scaler = StandardScaler()
        features_scaled = scaler.fit_transform(features)
        
        # Fit isolation forest
        iso_forest = IsolationForest(contamination=contamination, random_state=42)
        anomaly_labels = iso_forest.fit_predict(features_scaled)
        anomaly_scores = iso_forest.decision_function(features_scaled)
        
        # Get anomalous transactions
        anomalies = transactions_df[anomaly_labels == -1]
        
        return {
            'anomalies': anomalies.to_dict('records'),
            'anomaly_scores': anomaly_scores.tolist(),
            'anomaly_indices': np.where(anomaly_labels == -1)[0].tolist()
        }
    except Exception as e:
        print(f"Anomaly detection error: {e}")
        return {'anomalies': [], 'anomaly_scores': []}

def seasonal_decompose_forecast(series: pd.Series, steps: int = 30) -> dict:
    """
    Perform seasonal decomposition and forecasting
    """
    try:
        if len(series) < 30:
            return {'forecast': arima_forecast(series, steps), 'seasonality': None}
        
        from statsmodels.tsa.seasonal import seasonal_decompose
        
        # Perform seasonal decomposition
        decomposition = seasonal_decompose(series, period=7, extrapolate_trend='freq')
        
        # Forecast trend component
        trend_forecast = arima_forecast(decomposition.trend.dropna(), steps)
        
        # Use seasonal pattern for forecast
        seasonal_pattern = decomposition.seasonal[-7:].values  # Last week's pattern
        seasonal_forecast = np.tile(seasonal_pattern, (steps // 7 + 1))[:steps]
        
        # Combine trend and seasonal forecasts
        combined_forecast = [trend + seasonal for trend, seasonal in zip(trend_forecast, seasonal_forecast)]
        
        return {
            'forecast': [float(x) for x in combined_forecast],
            'seasonality': seasonal_pattern.tolist(),
            'trend': decomposition.trend.dropna().tolist()[-30:],  # Last 30 days trend
            'residual': decomposition.resid.dropna().tolist()[-30:]  # Last 30 days residuals
        }
    except Exception as e:
        print(f"Seasonal decomposition error: {e}")
        return {'forecast': arima_forecast(series, steps), 'seasonality': None}

def category_forecast(transactions_df: pd.DataFrame, category: str, steps: int = 30) -> dict:
    """
    Generate category-specific forecasts with confidence intervals
    """
    try:
        # Filter transactions for specific category
        category_data = transactions_df[transactions_df['category'] == category]
        
        if len(category_data) < 10:
            return {
                'forecast': [0.0] * steps,
                'confidence_lower': [0.0] * steps,
                'confidence_upper': [0.0] * steps,
                'volatility': 0.0
            }
        
        # Aggregate daily spending for the category
        daily_spending = category_data.groupby('date')['price'].sum().reindex(
            pd.date_range(category_data['date'].min(), category_data['date'].max()),
            fill_value=0
        )
        
        # Calculate volatility
        volatility = daily_spending.std()
        
        # Generate forecast with confidence intervals
        forecast = arima_forecast(daily_spending, steps)
        
        # Simple confidence intervals based on historical volatility
        confidence_interval = volatility * 1.96  # 95% confidence interval
        
        confidence_lower = [max(0, f - confidence_interval) for f in forecast]
        confidence_upper = [f + confidence_interval for f in forecast]
        
        return {
            'forecast': forecast,
            'confidence_lower': confidence_lower,
            'confidence_upper': confidence_upper,
            'volatility': float(volatility),
            'historical_avg': float(daily_spending.mean()),
            'historical_std': float(daily_spending.std())
        }
    except Exception as e:
        print(f"Category forecast error for {category}: {e}")
        return {
            'forecast': [0.0] * steps,
            'confidence_lower': [0.0] * steps,
            'confidence_upper': [0.0] * steps,
            'volatility': 0.0
        }

def spending_pattern_analysis(transactions_df: pd.DataFrame) -> dict:
    """
    Analyze spending patterns and provide insights
    """
    try:
        if len(transactions_df) == 0:
            return {}
        
        # Day of week analysis
        day_of_week_spending = transactions_df.groupby('day_of_week')['price'].agg(['sum', 'count', 'mean']).reset_index()
        
        # Hour of day analysis
        hour_spending = transactions_df.groupby('hour')['price'].agg(['sum', 'count', 'mean']).reset_index()
        
        # Category analysis
        category_analysis = transactions_df.groupby('category')['price'].agg(['sum', 'count', 'mean']).reset_index()
        category_analysis = category_analysis.sort_values('sum', ascending=False)
        
        # Spending velocity (amount per day)
        daily_spending = transactions_df.groupby('date')['price'].sum()
        spending_velocity = daily_spending.mean()
        
        # Identify peak spending days and hours
        peak_day = day_of_week_spending.loc[day_of_week_spending['sum'].idxmax()]
        peak_hour = hour_spending.loc[hour_spending['sum'].idxmax()]
        
        return {
            'day_of_week_patterns': day_of_week_spending.to_dict('records'),
            'hour_patterns': hour_spending.to_dict('records'),
            'category_rankings': category_analysis.to_dict('records'),
            'spending_velocity': float(spending_velocity),
            'peak_spending_day': {
                'day': int(peak_day['day_of_week']),
                'amount': float(peak_day['sum']),
                'transactions': int(peak_day['count'])
            },
            'peak_spending_hour': {
                'hour': int(peak_hour['hour']),
                'amount': float(peak_hour['sum']),
                'transactions': int(peak_hour['count'])
            }
        }
    except Exception as e:
        print(f"Spending pattern analysis error: {e}")
        return {}

def budget_optimization_suggestions(transactions_df: pd.DataFrame, budget_limits: dict) -> dict:
    """
    Generate budget optimization suggestions based on spending patterns
    """
    try:
        suggestions = []
        
        # Analyze category spending vs limits
        category_spending = transactions_df.groupby('category')['price'].sum()
        
        for category, limit in budget_limits.items():
            if category in category_spending.index:
                spent = category_spending[category]
                utilization = (spent / limit) * 100 if limit > 0 else 0
                
                if utilization > 100:
                    suggestions.append({
                        'type': 'budget_exceeded',
                        'category': category,
                        'spent': float(spent),
                        'limit': float(limit),
                        'excess': float(spent - limit),
                        'message': f"Budget exceeded by {float(spent - limit):.2f} LKR"
                    })
                elif utilization > 80:
                    suggestions.append({
                        'type': 'budget_warning',
                        'category': category,
                        'spent': float(spent),
                        'limit': float(limit),
                        'remaining': float(limit - spent),
                        'message': f"Approaching budget limit. {float(limit - spent):.2f} LKR remaining"
                    })
        
        # Find potential savings opportunities
        avg_daily_spending = transactions_df.groupby('date')['price'].sum().mean()
        if avg_daily_spending > 1000:  # Threshold for high daily spending
            suggestions.append({
                'type': 'high_daily_spending',
                'current_avg': float(avg_daily_spending),
                'message': f"High average daily spending of {avg_daily_spending:.2f} LKR. Consider daily spending limits."
            })
        
        return {
            'suggestions': suggestions,
            'total_suggestions': len(suggestions),
            'high_priority': len([s for s in suggestions if s['type'] == 'budget_exceeded'])
        }
    except Exception as e:
        print(f"Budget optimization error: {e}")
        return {'suggestions': [], 'total_suggestions': 0, 'high_priority': 0} 