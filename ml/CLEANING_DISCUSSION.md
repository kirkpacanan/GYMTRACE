# Dataset Cleaning and Pre-Processing — Discussion Draft
## GYMTRACE: Campus Gym Crowdedness Dataset

**Course activity:** Dataset Cleaning and Pre-Processing  
**Project:** GYMTRACE — occupancy prediction for automated gym operations  
**Dataset:** Crowdedness at the Campus Gym (Kaggle — nsrose7224)  
**Target variable:** `number_people`

---

### 1. Dataset overview

For GYMTRACE’s machine-learning module, we use the public **Crowdedness at the Campus Gym** dataset. It contains people counts recorded about every 10 minutes, plus time, weather, and semester-related features. The label we want to predict is `number_people`, which matches our project goal: forecast how crowded the gym will be so members and staff can plan better.

Typical features include: `date`, `timestamp`, `day_of_week`, `is_weekend`, `is_holiday`, `temperature`, `is_start_of_semester`, `is_during_semester`, `month`, and `hour`.

---

### 2. Problems found (during inspection)

After loading the raw CSV, we inspected shape, column types, missing values, duplicates, and outliers.

- **Structure check:** Confirmed columns and dtypes; `date` was stored as text and needed parsing.
- **Missing values:** Counted nulls per column to see if imputation or dropping was required.
- **Duplicates:** Checked for exact duplicate rows that could bias training.
- **Outliers:** Used IQR bounds and plots on `number_people` and `temperature` to find extreme values that could hurt regression models.

*(Attach screenshots: raw `head()` / `info()` / missing-value counts / outlier plot.)*

---

### 3. Cleaning and pre-processing actions (and why)

| Activity | What we did | Why it matters |
|---|---|---|
| Inspect raw data | `shape`, `head()`, `info()`, `describe()` | Understand quality before modeling |
| Parse dates | Converted `date` to datetime | Correct time handling for features |
| Remove duplicates | `drop_duplicates()` | Prevent the model from over-learning repeated rows |
| Fix flag types | Cast weekend/holiday/semester flags to 0/1 ints | Consistent numeric features for ML |
| Impute missing numerics | Median fill where needed | Keep usable rows without extreme invented values |
| Cap target outliers | IQR clip on `number_people` | Reduce impact of rare extreme spikes |
| Domain clip temperature | Clip to a realistic °F range | Remove impossible weather values |
| Feature selection | Kept time/weather/semester predictors | Align features with occupancy drivers |
| Train/test split | 80% train / 20% test, `random_state=42` | Fair evaluation later |
| Scaling | `StandardScaler` fit on train only | Help scale-sensitive models; avoid leakage |

---

### 4. Results after processing

- Raw dataset was inspected and quality issues were documented.
- Cleaned table was exported to `ml/data/processed/gym_crowdedness_clean.csv`.
- Train/test matrices and scaled features were prepared for the next modeling stage (Linear Regression, Random Forest, Gradient Boosting).

*(Attach screenshots: cleaned `head()`, cleaned `describe()`, before-vs-after histogram / row counts, saved file confirmation.)*

---

### 5. What each proof figure shows

**Figure A — Raw data sample (`03_before_head_table.png`)**  
Table of the first rows from the raw Kaggle CSV. It shows the starting columns (`number_people`, `date`, time/weather/semester flags, etc.) before we cleaned anything. Use this as the “before” snapshot of what the dataset looked like when we loaded it.

**Figure B — Target distribution before cleaning (`01_before_target_distribution.png`)**  
Left: histogram of `number_people`. Right: boxplot of the same column. The histogram is right-skewed with a big spike near zero (many empty/quiet times). The boxplot shows a dense cloud of high outliers above the upper whisker (roughly past ~95 people, up toward 145). This image justifies why we checked and capped extreme occupancy values.

**Figure C — Missing values check (`01b_during_missing_values.png`)**  
Bar chart of null counts per column during quality checks. Every bar is at zero — the Campus Gym Crowdedness file already had **no missing values**. Together with the process log (0 duplicate rows), this shows the raw data was already mostly clean; our main quality work was outlier control and type/date prep, not heavy imputation.

**Figure D — Before vs after (`02_after_vs_before.png`)**  
Left: overlaid histograms of `number_people` before vs after cleaning (extreme high counts were IQR-capped, so the far right tail is reduced). Right: row counts before vs after — both bars are essentially the same height (~62,184 rows). That means we **did not drop rows**; we adjusted outlier values in place and kept the full sample for modeling.

**Figure E — Cleaned data sample (`04_after_head_table.png`)**  
Table of the first rows after cleaning/pre-processing. Columns are ready for ML (parsed dates, consistent 0/1 flags, cleaned target). Compare with Figure A to show the pipeline produced a usable training table (`gym_crowdedness_clean.csv`).

**Process log (`cleaning_process_log.txt`)**  
Text proof of shapes, missing/duplicate counts, outlier capping, and export confirmation — companion to the figures above.

---

### 6. Reflection (short paragraph you can submit)

Dataset cleaning and pre-processing was an important step for GYMTRACE because occupancy prediction depends on reliable historical counts. By inspecting the Kaggle campus gym dataset, fixing types, handling duplicates/missing values, and controlling outliers, we prepared a cleaner training table. Scaling and train/test splitting also set up fair model experiments. The processed data is now ready for the experimental results part of our machine-learning work.

---

### How to reproduce

**Google Colab:**
1. Open [Google Colab](https://colab.research.google.com/)
2. File → Upload notebook → `ml/notebooks/01_cleaning_preprocessing_colab.ipynb`
3. Run the first code cell and upload your Kaggle zip or `data.csv`
4. Run the rest of the notebook
5. Download the proof zip at the end (`01b_during_missing_values.png`, `03_before_head_table.png`, `04_after_head_table.png`, and the other figures)

**Local:**

```bash
cd ml
source .venv/bin/activate
python scripts/run_cleaning_proof.py
```
