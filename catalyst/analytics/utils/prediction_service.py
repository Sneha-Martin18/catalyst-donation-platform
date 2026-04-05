import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from django.db.models import Sum, Count
from django.utils import timezone
from sklearn.linear_model import LinearRegression
from receiver.models import ItemRequest
from analytics.models import DemandPrediction

class DemandPredictor:
    """
    Predicts future demand for donation categories using simple linear regression.
    """

    def __init__(self):
        self.model = LinearRegression()

    def get_historical_data(self):
        """
        Extracts historical request data from the database.
        Returns a Pandas DataFrame with [date, category, quantity].
        """
        requests = ItemRequest.objects.all().values(
            'created_at', 'category', 'quantity'
        )
        
        if not requests:
            return pd.DataFrame()

        df = pd.DataFrame(list(requests))
        
        # Convert created_at to date (month level for time series)
        df['created_at'] = pd.to_datetime(df['created_at'])
        df['month'] = df['created_at'].dt.to_period('M')
        
        # Aggregate by month and category
        monthly_demand = df.groupby(['month', 'category'])['quantity'].sum().reset_index()
        
        # Convert period back to timestamp for ML
        monthly_demand['month_timestamp'] = monthly_demand['month'].dt.to_timestamp()
        
        return monthly_demand

    def train_and_predict(self):
        """
        Trains a model for each category and stores predictions in the database.
        """
        data = self.get_historical_data()
        
        if data.empty:
            print("No historical data found to train model.")
            return False

        # Clear old predictions for the current run
        DemandPrediction.objects.all().delete()

        categories = [cat for cat in data['category'].unique() if cat.lower() != 'food']
        next_month = (timezone.now().replace(day=1) + timedelta(days=32)).replace(day=1)
        target_month_str = next_month.strftime("%B %Y")
        
        predictions_created = 0

        for cat in categories:
            cat_data = data[data['category'] == cat].copy()
            
            # Need at least 2 data points for regression
            if len(cat_data) < 2:
                # Fallback to simple average or current value if not enough data
                avg_val = cat_data['quantity'].mean()
                DemandPrediction.objects.create(
                    category=cat,
                    predicted_quantity=round(avg_val),
                    confidence_score=0.0,
                    target_month=target_month_str
                )
                predictions_created += 1
                continue

            # Feature: Month index (0, 1, 2...)
            cat_data['month_idx'] = np.arange(len(cat_data))
            
            X = cat_data[['month_idx']]
            y = cat_data['quantity']

            self.model.fit(X, y)
            
            # Predict next month (current length index)
            next_idx = np.array([[len(cat_data)]])
            prediction = self.model.predict(next_idx)[0]
            
            # R-squared as confidence score
            score = self.model.score(X, y)

            # Ensure prediction isn't negative
            final_pred = max(0, round(prediction))

            DemandPrediction.objects.create(
                category=cat,
                predicted_quantity=final_pred,
                confidence_score=max(0, float(score)),
                target_month=target_month_str
            )
            predictions_created += 1

        print(f"Prediction run complete. Generated {predictions_created} category predictions.")
        return True

predictor = DemandPredictor()
