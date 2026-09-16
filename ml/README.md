# GYMTRACE Machine Learning

## Dataset Cleaning & Pre-Processing assessment

1. Raw data: [`data/raw/data.csv`](data/raw/data.csv) (Kaggle — Crowdedness at the Campus Gym)
2. **Google Colab notebook (recommended):** [`notebooks/01_cleaning_preprocessing_colab.ipynb`](notebooks/01_cleaning_preprocessing_colab.ipynb)
3. Local notebook: [`notebooks/01_cleaning_preprocessing.ipynb`](notebooks/01_cleaning_preprocessing.ipynb)
4. Discussion draft: [`CLEANING_DISCUSSION.md`](CLEANING_DISCUSSION.md)
5. Proof screenshots / figures: [`proof/`](proof/)

### Run in Google Colab

1. Go to [https://colab.research.google.com/](https://colab.research.google.com/)
2. **File → Upload notebook** → `ml/notebooks/01_cleaning_preprocessing_colab.ipynb`
3. Run the upload cell and choose your **Kaggle zip** or **data.csv**
4. Run the remaining cells
5. At the end, download the proof zip (includes missing-values chart + before/after head tables)

### Run locally

```bash
cd ml
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python scripts/run_cleaning_proof.py
```

## Experimental Results (ML Algorithm)

1. **Google Colab notebook:** [`notebooks/02_experimental_results_colab.ipynb`](notebooks/02_experimental_results_colab.ipynb)
2. Discussion draft: [`EXPERIMENTAL_RESULTS_DISCUSSION.md`](EXPERIMENTAL_RESULTS_DISCUSSION.md)
3. Proof figures: [`proof_ml/`](proof_ml/)
4. Local runner: `python scripts/run_experimental_results.py`

### Run in Google Colab

1. Upload `02_experimental_results_colab.ipynb`
2. Upload `gym_crowdedness_clean.csv` from the cleaning step
3. Runtime → Run all
4. Screenshot metrics + charts; download the proof zip at the end
