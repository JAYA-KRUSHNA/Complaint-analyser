"""
CiviSense AI — Classical ML Training Pipeline

Trains and evaluates 3 classifiers on complaint text:
  1. Logistic Regression (fast, interpretable baseline)
  2. Support Vector Machine (strong for text classification)
  3. Random Forest (ensemble, handles noise)

Pipeline:
  1. Generate/load training data
  2. TF-IDF vectorization (unigrams + bigrams, max 5000 features)
  3. Train each model with cross-validation
  4. Evaluate: accuracy, precision, recall, F1 per class
  5. Save best model + vectorizer to disk
  6. Generate comparison report
"""

import os
import json
import time
import joblib  # type: ignore
import numpy as np  # type: ignore
from pathlib import Path
from typing import Dict, List, Optional, Tuple

from sklearn.feature_extraction.text import TfidfVectorizer  # type: ignore
from sklearn.linear_model import LogisticRegression  # type: ignore
from sklearn.svm import LinearSVC  # type: ignore
from sklearn.ensemble import RandomForestClassifier  # type: ignore
from sklearn.model_selection import cross_val_score, train_test_split  # type: ignore
from sklearn.metrics import (  # type: ignore
    accuracy_score,
    classification_report,
    confusion_matrix,
    f1_score,
)
from sklearn.pipeline import Pipeline  # type: ignore

from app.services.ml.training_data import generate_training_data  # type: ignore

# ─── Configuration ─────────────────────────────────────────────

MODEL_DIR = Path(__file__).parent / "saved_models"
MODEL_DIR.mkdir(exist_ok=True)

TFIDF_CONFIG = {
    "max_features": 5000,
    "ngram_range": (1, 2),       # Unigrams + bigrams
    "min_df": 2,                  # Ignore terms in < 2 documents
    "max_df": 0.95,               # Ignore terms in > 95% of documents
    "sublinear_tf": True,         # Apply log normalization
    "strip_accents": "unicode",
}

MODELS = {
    "logistic_regression": {
        "class": LogisticRegression,
        "params": {
            "C": 1.0,
            "max_iter": 1000,
            "solver": "lbfgs",
            "random_state": 42,
        },
        "display_name": "Logistic Regression",
    },
    "svm": {
        "class": LinearSVC,
        "params": {
            "C": 1.0,
            "max_iter": 2000,
            "random_state": 42,
        },
        "display_name": "Support Vector Machine (Linear)",
    },
    "random_forest": {
        "class": RandomForestClassifier,
        "params": {
            "n_estimators": 100,
            "max_depth": 30,
            "random_state": 42,
            "n_jobs": -1,
        },
        "display_name": "Random Forest",
    },
}


class MLTrainingPipeline:
    """
    Trains, evaluates, and persists ML classifiers for complaint text.
    
    Usage:
        pipeline = MLTrainingPipeline()
        results = pipeline.train_all()
        pipeline.save_best_model()
    """

    def __init__(self, samples_per_category: int = 50):
        self.samples_per_category = samples_per_category
        self.vectorizer: Optional[TfidfVectorizer] = None
        self.models: Dict[str, object] = {}
        self.results: Dict[str, Dict] = {}
        self.best_model_name: Optional[str] = None
        self.classes: Optional[np.ndarray] = None

    def train_all(self) -> Dict[str, Dict]:
        """
        Train all models and return comparison results.
        
        Returns:
            Dict mapping model_name -> evaluation metrics.
        """
        print("=" * 60)
        print("CiviSense AI — ML Training Pipeline")
        print("=" * 60)

        # ── Step 1: Generate training data ─────────────────
        print("\n📊 Generating training data...")
        data = generate_training_data(self.samples_per_category)
        texts = [d[0] for d in data]
        labels = [d[1] for d in data]
        print(f"   Generated {len(texts)} samples across {len(set(labels))} categories")

        # ── Step 2: Train/test split ───────────────────────
        X_train, X_test, y_train, y_test = train_test_split(
            texts, labels, test_size=0.2, random_state=42, stratify=labels
        )
        print(f"   Train: {len(X_train)}, Test: {len(X_test)}")

        # ── Step 3: TF-IDF Vectorization ───────────────────
        print("\n📝 Building TF-IDF features...")
        self.vectorizer = TfidfVectorizer(**TFIDF_CONFIG)
        X_train_tfidf = self.vectorizer.fit_transform(X_train)
        X_test_tfidf = self.vectorizer.transform(X_test)
        print(f"   Vocabulary size: {len(self.vectorizer.vocabulary_)}")
        print(f"   Feature matrix: {X_train_tfidf.shape}")

        self.classes = np.array(sorted(set(labels)))

        # ── Step 4: Train & Evaluate each model ────────────
        best_f1 = 0.0

        for model_name, config in MODELS.items():
            print(f"\n🔧 Training: {config['display_name']}...")
            start_time = time.time()

            # Create model
            model = config["class"](**config["params"])

            # Cross-validation
            cv_scores = cross_val_score(
                model, X_train_tfidf, y_train, cv=5, scoring="f1_weighted"
            )

            # Train on full training set
            model.fit(X_train_tfidf, y_train)
            train_time = time.time() - start_time

            # Predict
            y_pred = model.predict(X_test_tfidf)

            # Metrics
            accuracy = accuracy_score(y_test, y_pred)
            f1_weighted = f1_score(y_test, y_pred, average="weighted")
            report = classification_report(y_test, y_pred, output_dict=True)
            cm = confusion_matrix(y_test, y_pred, labels=self.classes)

            self.models[model_name] = model
            self.results[model_name] = {
                "display_name": config["display_name"],
                "accuracy": round(accuracy, 4),
                "f1_weighted": round(f1_weighted, 4),
                "cv_mean": round(cv_scores.mean(), 4),
                "cv_std": round(cv_scores.std(), 4),
                "train_time_seconds": round(train_time, 3),
                "classification_report": report,
                "confusion_matrix": cm.tolist(),
                "sample_count": len(texts),
                "train_count": len(X_train),
                "test_count": len(X_test),
            }

            print(f"   Accuracy:  {accuracy:.4f}")
            print(f"   F1 Score:  {f1_weighted:.4f}")
            print(f"   CV Mean:   {cv_scores.mean():.4f} ± {cv_scores.std():.4f}")
            print(f"   Time:      {train_time:.3f}s")

            if f1_weighted > best_f1:
                best_f1 = f1_weighted
                self.best_model_name = model_name

        # ── Summary ────────────────────────────────────────
        print(f"\n{'=' * 60}")
        print(f"🏆 Best Model: {MODELS[self.best_model_name]['display_name']}")
        print(f"   F1 Score:  {best_f1:.4f}")
        print(f"{'=' * 60}")

        return self.results

    def save_best_model(self) -> str:
        """Save all models, best model, and vectorizer to disk."""
        if not self.best_model_name or not self.vectorizer:
            raise ValueError("Must call train_all() first")

        # Save all individual models so multi-model playground can serve them
        for m_name, m_obj in self.models.items():
            joblib.dump(m_obj, MODEL_DIR / f"{m_name}.joblib")

        best_model = self.models[self.best_model_name]
        model_path = MODEL_DIR / "best_classifier.joblib"
        vectorizer_path = MODEL_DIR / "tfidf_vectorizer.joblib"
        metadata_path = MODEL_DIR / "model_metadata.json"

        # Save best model + vectorizer
        joblib.dump(best_model, model_path)
        joblib.dump(self.vectorizer, vectorizer_path)

        # Save metadata
        metadata = {
            "model_name": self.best_model_name,
            "display_name": MODELS[self.best_model_name]["display_name"],
            "model_version": f"tfidf_{self.best_model_name}_v1.0",
            "accuracy": self.results[self.best_model_name]["accuracy"],
            "f1_weighted": self.results[self.best_model_name]["f1_weighted"],
            "classes": self.classes.tolist() if self.classes is not None else [],
            "tfidf_features": len(self.vectorizer.vocabulary_),
            "sample_count": self.results[self.best_model_name]["sample_count"],
        }
        with open(metadata_path, "w") as f:
            json.dump(metadata, f, indent=2)

        print(f"\n💾 Saved all models & vectorizer to {MODEL_DIR}/")
        print(f"   Best Model: {model_path.name}")
        print(f"   Vectorizer: {vectorizer_path.name}")
        print(f"   Metadata:   {metadata_path.name}")

        return str(model_path)

    def save_comparison_report(self) -> str:
        """Save full comparison report with confusion matrix & per-class metrics."""
        report_path = MODEL_DIR / "comparison_report.json"

        report = {
            "best_model": self.best_model_name,
            "classes": self.classes.tolist() if self.classes is not None else [],
            "models": {},
        }
        for name, result in self.results.items():
            clean = dict(result)
            if "classification_report" in clean:
                cr = clean["classification_report"]
                clean["per_class_metrics"] = {
                    k: {
                        "precision": round(v.get("precision", 0), 4),
                        "recall": round(v.get("recall", 0), 4),
                        "f1": round(v.get("f1-score", 0), 4),
                        "support": v.get("support", 0),
                    }
                    for k, v in cr.items()
                    if isinstance(v, dict) and "f1-score" in v
                }
                clean["per_class_f1"] = {
                    k: round(v["f1-score"], 4)
                    for k, v in cr.items()
                    if isinstance(v, dict) and "f1-score" in v
                }
                del clean["classification_report"]
            report["models"][name] = clean

        with open(report_path, "w") as f:
            json.dump(report, f, indent=2)

        return str(report_path)


def train_and_save() -> Dict:
    """Convenience function: train all models and save the best one."""
    pipeline = MLTrainingPipeline(samples_per_category=50)
    results = pipeline.train_all()
    pipeline.save_best_model()
    pipeline.save_comparison_report()
    return results


if __name__ == "__main__":
    train_and_save()
