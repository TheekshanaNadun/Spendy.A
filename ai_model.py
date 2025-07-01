import pandas as pd
from statsmodels.tsa.arima.model import ARIMA

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