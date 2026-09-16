"""
Local runner for GYMTRACE experimental results (LR + Random Forest).
"""

from __future__ import annotations

from pathlib import Path

import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler

ML_ROOT = Path(__file__).resolve().parents[1]
CSV = ML_ROOT / "data" / "processed" / "gym_crowdedness_clean.csv"
PROOF = ML_ROOT / "proof_ml"
PROOF.mkdir(parents=True, exist_ok=True)

FEATURES = [
    "timestamp",
    "day_of_week",
    "is_weekend",
    "is_holiday",
    "temperature",
    "is_start_of_semester",
    "is_during_semester",
    "month",
    "hour",
]


def metrics(y_true, y_pred):
    mae = mean_absolute_error(y_true, y_pred)
    rmse = mean_squared_error(y_true, y_pred) ** 0.5
    r2 = r2_score(y_true, y_pred)
    mape = np.mean(np.abs((y_true - y_pred) / np.maximum(np.abs(y_true), 1))) * 100
    return {"MAE": mae, "RMSE": rmse, "R2": r2, "MAPE_%": mape}


def main() -> None:
    df = pd.read_csv(CSV)
    X = df[FEATURES]
    y = df["number_people"]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )
    scaler = StandardScaler()
    X_train_s = scaler.fit_transform(X_train)
    X_test_s = scaler.transform(X_test)

    lr = LinearRegression()
    lr.fit(X_train_s, y_train)
    pred_lr = lr.predict(X_test_s)

    rf = RandomForestRegressor(
        n_estimators=100, max_depth=16, random_state=42, n_jobs=2
    )
    rf.fit(X_train_s, y_train)
    pred_rf = rf.predict(X_test_s)

    results = pd.DataFrame(
        {
            "Linear Regression": metrics(y_test, pred_lr),
            "Random Forest": metrics(y_test, pred_rf),
        }
    ).T.round(3)
    results.to_csv(PROOF / "metrics_table.csv")
    print(results)
    print("Best by R2:", results["R2"].idxmax())

    # Metrics chart
    fig, ax = plt.subplots(figsize=(8, 4))
    x = np.arange(len(results.index))
    width = 0.25
    ax.bar(x - width, results["MAE"], width, label="MAE")
    ax.bar(x, results["RMSE"], width, label="RMSE")
    ax.bar(x + width, results["R2"], width, label="R2")
    ax.set_xticks(x)
    ax.set_xticklabels(results.index)
    ax.set_title("Model comparison (test set)")
    ax.legend()
    plt.tight_layout()
    fig.savefig(PROOF / "01_metrics_comparison.png", dpi=150)
    plt.close(fig)

    # Actual vs predicted
    fig, axes = plt.subplots(1, 2, figsize=(11, 4))
    axes[0].scatter(y_test, pred_lr, alpha=0.2, s=8, color="steelblue")
    lim0 = [0, max(y_test.max(), pred_lr.max())]
    axes[0].plot(lim0, lim0, color="black", linewidth=1)
    axes[0].set_title("Linear Regression: actual vs predicted")
    axes[0].set_xlabel("Actual")
    axes[0].set_ylabel("Predicted")
    axes[1].scatter(y_test, pred_rf, alpha=0.2, s=8, color="teal")
    lim1 = [0, max(y_test.max(), pred_rf.max())]
    axes[1].plot(lim1, lim1, color="black", linewidth=1)
    axes[1].set_title("Random Forest: actual vs predicted")
    axes[1].set_xlabel("Actual")
    axes[1].set_ylabel("Predicted")
    plt.tight_layout()
    fig.savefig(PROOF / "02_actual_vs_predicted.png", dpi=150)
    plt.close(fig)

    # Residuals
    fig, axes = plt.subplots(1, 2, figsize=(11, 4))
    axes[0].hist(y_test - pred_lr, bins=40, color="steelblue", edgecolor="white")
    axes[0].set_title("Linear Regression residuals")
    axes[0].set_xlabel("Actual - Predicted")
    axes[1].hist(y_test - pred_rf, bins=40, color="teal", edgecolor="white")
    axes[1].set_title("Random Forest residuals")
    axes[1].set_xlabel("Actual - Predicted")
    plt.tight_layout()
    fig.savefig(PROOF / "03_residuals.png", dpi=150)
    plt.close(fig)

    # Feature importance
    imp = pd.Series(rf.feature_importances_, index=FEATURES).sort_values()
    fig, ax = plt.subplots(figsize=(8, 4))
    imp.plot(kind="barh", ax=ax, color="teal")
    ax.set_title("Random Forest feature importance")
    ax.set_xlabel("Importance")
    plt.tight_layout()
    fig.savefig(PROOF / "04_feature_importance.png", dpi=150)
    plt.close(fig)

    print("Saved figures to", PROOF)


if __name__ == "__main__":
    main()
