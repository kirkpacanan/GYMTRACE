"""
Run GYMTRACE dataset cleaning + export proof figures for the assessment.
Usage (from repo root or ml/):
  ml/.venv/bin/python ml/scripts/run_cleaning_proof.py
"""

from __future__ import annotations

from pathlib import Path

import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler

ML_ROOT = Path(__file__).resolve().parents[1]
RAW = ML_ROOT / "data" / "raw" / "data.csv"
PROCESSED_DIR = ML_ROOT / "data" / "processed"
PROOF_DIR = ML_ROOT / "proof"
PROCESSED_DIR.mkdir(parents=True, exist_ok=True)
PROOF_DIR.mkdir(parents=True, exist_ok=True)


def iqr_bounds(series: pd.Series) -> tuple[float, float]:
    q1, q3 = series.quantile(0.25), series.quantile(0.75)
    iqr = q3 - q1
    return float(q1 - 1.5 * iqr), float(q3 + 1.5 * iqr)


def main() -> None:
    lines: list[str] = []
    def log(msg: str = "") -> None:
        print(msg)
        lines.append(msg)

    log("GYMTRACE — Dataset Cleaning & Pre-Processing Proof Log")
    log("=" * 60)

    # BEFORE
    df = pd.read_csv(RAW)
    log("\n[BEFORE] Raw shape: " + str(df.shape))
    log("[BEFORE] Columns: " + ", ".join(df.columns.astype(str)))
    log("\n[BEFORE] head():\n" + df.head(10).to_string())
    log("\n[BEFORE] describe():\n" + df.describe().to_string())

    fig, axes = plt.subplots(1, 2, figsize=(10, 4))
    axes[0].hist(df["number_people"], bins=40, color="#2a9d8f", edgecolor="white")
    axes[0].set_title("BEFORE: number_people distribution")
    axes[0].set_xlabel("people")
    axes[1].boxplot(df["number_people"], vert=True)
    axes[1].set_title("BEFORE: number_people boxplot")
    plt.tight_layout()
    p1 = PROOF_DIR / "01_before_target_distribution.png"
    fig.savefig(p1, dpi=140)
    plt.close(fig)
    log(f"\nSaved figure: {p1}")

    # DURING
    missing = df.isna().sum().sort_values(ascending=False)
    dup_count = int(df.duplicated().sum())
    log("\n[DURING] Missing values:\n" + missing.to_string())
    log(f"[DURING] Total missing cells: {int(missing.sum())}")
    log(f"[DURING] Duplicate rows: {dup_count}")
    log("\n[DURING] Dtypes:\n" + df.dtypes.to_string())

    for col in ["number_people", "temperature"]:
        lo, hi = iqr_bounds(df[col])
        n_out = int(((df[col] < lo) | (df[col] > hi)).sum())
        log(f"[DURING] {col} IQR [{lo:.2f}, {hi:.2f}] outliers={n_out}")

    fig, ax = plt.subplots(figsize=(8, 4))
    missing.plot(kind="bar", ax=ax, color="#e9c46a")
    ax.set_title("DURING: Missing values per column")
    ax.set_ylabel("count")
    plt.xticks(rotation=45, ha="right")
    plt.tight_layout()
    p_miss = PROOF_DIR / "01b_during_missing_values.png"
    fig.savefig(p_miss, dpi=140)
    plt.close(fig)
    log(f"Saved figure: {p_miss}")

    # CLEAN
    df_clean = df.copy()
    before_rows = len(df_clean)
    df_clean["date"] = pd.to_datetime(df_clean["date"], utc=True, errors="coerce")
    df_clean = df_clean.drop_duplicates()
    for c in [
        "is_weekend",
        "is_holiday",
        "is_start_of_semester",
        "is_during_semester",
    ]:
        df_clean[c] = df_clean[c].astype(int)

    num_cols = df_clean.select_dtypes(include=[np.number]).columns
    for c in num_cols:
        if df_clean[c].isna().any():
            df_clean[c] = df_clean[c].fillna(df_clean[c].median())

    lo, hi = iqr_bounds(df_clean["number_people"])
    n_capped = int(((df_clean["number_people"] < lo) | (df_clean["number_people"] > hi)).sum())
    df_clean["number_people"] = df_clean["number_people"].clip(
        lower=max(0, lo), upper=hi
    )
    df_clean["temperature"] = df_clean["temperature"].clip(lower=20, upper=110)
    df_clean = df_clean.dropna(subset=["date"])
    after_rows = len(df_clean)

    log("\n[CLEAN] Rows before: " + str(before_rows))
    log("[CLEAN] Rows after:  " + str(after_rows))
    log("[CLEAN] Rows removed: " + str(before_rows - after_rows))
    log("[CLEAN] Target values capped (IQR): " + str(n_capped))
    log("[CLEAN] Remaining missing: " + str(int(df_clean.isna().sum().sum())))

    # PREPROCESS
    feature_cols = [
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
    X = df_clean[feature_cols]
    y = df_clean["number_people"]
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )
    scaler = StandardScaler()
    X_train_scaled = pd.DataFrame(
        scaler.fit_transform(X_train), columns=feature_cols, index=X_train.index
    )
    log("\n[PREPROCESS] Train size: " + str(X_train.shape))
    log("[PREPROCESS] Test size:  " + str(X_test.shape))
    log("\n[PREPROCESS] Scaled train sample:\n" + X_train_scaled.head().to_string())

    # AFTER
    log("\n[AFTER] Cleaned shape: " + str(df_clean.shape))
    log("\n[AFTER] head():\n" + df_clean.head(10).to_string())
    log("\n[AFTER] describe():\n" + df_clean.describe().to_string())

    fig, axes = plt.subplots(1, 2, figsize=(10, 4))
    axes[0].hist(df["number_people"], bins=40, alpha=0.55, label="before", color="#e76f51")
    axes[0].hist(
        df_clean["number_people"], bins=40, alpha=0.7, label="after", color="#2a9d8f"
    )
    axes[0].set_title("BEFORE vs AFTER: number_people")
    axes[0].legend()
    axes[1].bar(["before", "after"], [len(df), len(df_clean)], color=["#e76f51", "#2a9d8f"])
    axes[1].set_title("Row count before vs after")
    plt.tight_layout()
    p2 = PROOF_DIR / "02_after_vs_before.png"
    fig.savefig(p2, dpi=140)
    plt.close(fig)
    log(f"Saved figure: {p2}")

    # Table screenshots as images
    def save_table_image(frame: pd.DataFrame, title: str, path: Path) -> None:
        fig, ax = plt.subplots(figsize=(12, 3.2))
        ax.axis("off")
        ax.set_title(title, loc="left", fontsize=12, pad=10)
        table = ax.table(
            cellText=frame.values,
            colLabels=frame.columns,
            loc="center",
            cellLoc="center",
        )
        table.auto_set_font_size(False)
        table.set_fontsize(8)
        table.scale(1, 1.3)
        plt.tight_layout()
        fig.savefig(path, dpi=140, bbox_inches="tight")
        plt.close(fig)
        log(f"Saved figure: {path}")

    save_table_image(
        df.head(8).round(2),
        "BEFORE: raw data sample (first 8 rows)",
        PROOF_DIR / "03_before_head_table.png",
    )
    save_table_image(
        df_clean.head(8).round(2),
        "AFTER: cleaned data sample (first 8 rows)",
        PROOF_DIR / "04_after_head_table.png",
    )

    out_csv = PROCESSED_DIR / "gym_crowdedness_clean.csv"
    df_clean.to_csv(out_csv, index=False)
    log(f"\nSaved cleaned CSV: {out_csv}")

    log_path = PROOF_DIR / "cleaning_process_log.txt"
    log_path.write_text("\n".join(lines), encoding="utf-8")
    log(f"Saved process log: {log_path}")
    log("\nDone. Use PNGs in ml/proof/ as assessment screenshots.")


if __name__ == "__main__":
    main()
