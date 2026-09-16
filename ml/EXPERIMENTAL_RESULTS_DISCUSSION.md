# Experimental Results — Discussion Draft
## GYMTRACE: Campus Gym Crowdedness Prediction

**Course activity:** M1|S2 Experimental Result (ML Algorithm)  
**Project:** GYMTRACE — occupancy prediction for automated gym operations  
**Dataset:** Crowdedness at the Campus Gym (Kaggle — nsrose7224), cleaned in the previous activity  
**Target variable:** `number_people`

---

### 1. Dataset and goal

This experiment uses the cleaned Campus Gym Crowdedness table (`gym_crowdedness_clean.csv`). Each row is a gym occupancy reading with time, weather, and semester-related features. The goal is to **predict `number_people`** so GYMTRACE can forecast how busy the gym will be.

**Features used:** `timestamp`, `day_of_week`, `is_weekend`, `is_holiday`, `temperature`, `is_start_of_semester`, `is_during_semester`, `month`, `hour`.

---

### 2. Algorithms chosen (and why)

We compared two regression models from scikit-learn:

| Model | Role | Why we chose it |
|---|---|---|
| **Linear Regression** | Baseline | Simple, fast, easy to interpret; shows how far a straight-line model can go |
| **Random Forest Regressor** | Stronger model | Ensemble of decision trees; can capture non-linear patterns (hour peaks, weekends, semester effects) |

These two give a clear “simple vs ensemble” comparison that fits the assessment and runs in Google Colab without extra installs.

---

### 3. Experiment setup

| Setting | Choice |
|---|---|
| Train / test split | 80% / 20%, `random_state=42` |
| Scaling | `StandardScaler` fit on train only, applied to both models |
| Linear Regression | Default `LinearRegression()` |
| Random Forest | `n_estimators=100`, `max_depth=16`, `random_state=42` |
| Metrics (test set) | MAE, RMSE, R², and MAPE |

Scaling was applied to both models so the comparison uses the same feature pipeline. The scaler was fit only on the training set to avoid leakage.

---

### 4. Results (test set)

| Model | MAE | RMSE | R² | MAPE (%) |
|---|---:|---:|---:|---:|
| Linear Regression | 12.039 | 15.676 | 0.518 | 297.435 |
| **Random Forest** | **5.423** | **8.188** | **0.869** | **41.146** |

**Winner: Random Forest** — lower error (MAE / RMSE / MAPE) and higher R² on the held-out test set.

---

### 5. Interpretation

Linear Regression explains only about half of the variance (R² ≈ 0.52). Occupancy is not a simple linear function of the features: busy hours, weekends, and semester timing interact in ways a straight line cannot capture well.

Random Forest clearly outperforms the baseline (R² ≈ 0.87). Tree splits can model those non-linear and interaction effects, so predictions stay closer to the true counts. The actual-vs-predicted scatter for Random Forest sits nearer the diagonal, and its residual histogram is more concentrated around zero.

Feature importance from the forest typically highlights time-related drivers (for example `hour`, `timestamp`, or semester flags), which matches gym usage patterns: more people at peak hours and during the semester.

MAPE is high for Linear Regression partly because many rows have low or zero occupancy; percentage error blows up when the true count is near zero. Even so, MAE and RMSE already show Random Forest is the better practical choice for GYMTRACE occupancy forecasts.

---

### 6. What each proof figure shows

**Figure 1 — Metrics comparison (`01_metrics_comparison.png`)**  
Grouped bar chart of test-set **MAE**, **RMSE**, and **R²** for both models. Lower MAE/RMSE means smaller average prediction error; higher R² means the model explains more of the occupancy variance. Random Forest has roughly half the error of Linear Regression and a much higher R², so this chart is the quick visual proof that the ensemble wins.

**Figure 2 — Actual vs predicted (`02_actual_vs_predicted.png`)**  
Two scatter plots: x-axis = real `number_people`, y-axis = model prediction. The black diagonal is a perfect prediction. Points close to that line are good forecasts. Linear Regression spreads widely, sometimes predicts negative occupancy (impossible in a gym), and under-predicts very busy times. Random Forest hugs the diagonal more tightly and stays in a realistic range — visual proof that its predictions match reality better.

**Figure 3 — Residuals (`03_residuals.png`)**  
Histograms of **Actual − Predicted**. A strong model piles most errors near zero (narrow, tall peak). Linear Regression has a wide bell (many misses of ±20–40 people). Random Forest is sharply peaked at zero with a smaller error range, showing fewer large mistakes.

**Figure 4 — Feature importance (`04_feature_importance.png`)**  
Horizontal bars showing how much each input contributed to Random Forest predictions. **`timestamp`** dominates, then **`temperature`** and **`is_during_semester`**, followed by month and day-of-week. Holiday and hour rank low (hour is partly already inside `timestamp`). This explains *why* the model works: gym crowdedness is driven mainly by when it is, weather, and whether school is in session.

**Figure 5 — Metrics table (notebook output / `metrics_table.csv`)**  
Printed MAE, RMSE, R², and MAPE numbers for both models — the numeric companion to Figure 1 for the write-up.

---

### 7. Reflection (short paragraph you can submit)

For the experimental results activity, we trained Linear Regression and Random Forest on the cleaned Campus Gym Crowdedness dataset to predict `number_people`. Using an 80/20 split and shared scaling, Random Forest performed better on every reported metric (MAE, RMSE, R², MAPE). This supports using a non-linear ensemble for GYMTRACE occupancy prediction, while Linear Regression remains a useful baseline to show the gain from a stronger model.

---

### How to reproduce

**Google Colab:**
1. Upload `ml/notebooks/02_experimental_results_colab.ipynb`
2. Upload `gym_crowdedness_clean.csv` from the cleaning step
3. Runtime → Run all
4. Screenshot the metrics table and charts; download the proof zip at the end

**Local:**
```bash
ml/.venv/bin/python ml/scripts/run_experimental_results.py
```
Figures are written to `ml/proof_ml/`.
