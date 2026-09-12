"""
CiviSense AI — ML-Based Text Classifier

Phase 2 implementation of TextClassificationService.
Uses a trained TF-IDF + classifier model loaded from disk.

Falls back to rule-based classifier if no trained model exists.
"""

import json
import time
from pathlib import Path
from typing import Optional, Dict, Any

import joblib  # type: ignore
import numpy as np  # type: ignore

from app.services.interfaces.text_classification import (  # type: ignore
    ClassificationResult,
    TextClassificationService,
)

MODEL_DIR = Path(__file__).parent / "saved_models"


class MLClassifier(TextClassificationService):
    """
    ML-based text classifier using TF-IDF + trained sklearn model.

    Loads the best model saved by the training pipeline.
    If prediction confidence is below a threshold, includes
    top-N alternatives for transparency.
    """

    def __init__(self):
        self.model = None
        self.vectorizer = None
        self.metadata: dict = {}
        self.model_version = "ml_classifier_not_loaded"
        self._load_model()

    def _load_model(self):
        """Load the trained model and vectorizer from disk."""
        model_path = MODEL_DIR / "best_classifier.joblib"
        vectorizer_path = MODEL_DIR / "tfidf_vectorizer.joblib"
        metadata_path = MODEL_DIR / "model_metadata.json"

        if not model_path.exists() or not vectorizer_path.exists():
            print("⚠️ ML model not found. Run training pipeline first.")
            return

        self.model = joblib.load(model_path)
        self.vectorizer = joblib.load(vectorizer_path)

        if metadata_path.exists():
            with open(metadata_path) as f:
                self.metadata = json.load(f)
            self.model_version = self.metadata.get(
                "model_version", "tfidf_ml_v1.0"
            )

        print(f"✅ ML model loaded: {self.model_version}")

    def is_loaded(self) -> bool:
        """Check if a model is available."""
        return self.model is not None and self.vectorizer is not None

    async def predict(self, text: str, language: str = "en") -> ClassificationResult:
        """Predict category using the trained ML model."""
        if not self.is_loaded():
            raise RuntimeError("ML model not loaded. Run training pipeline first.")

        # Vectorize input
        X = self.vectorizer.transform([text])

        # Predict
        predicted_category = self.model.predict(X)[0]

        # Get confidence via decision function or predict_proba
        confidence = 0.5
        alternatives = []

        if hasattr(self.model, "predict_proba"):
            # Logistic Regression, Random Forest
            proba = self.model.predict_proba(X)[0]
            classes = self.model.classes_
            confidence = float(np.max(proba))

            # Top alternatives
            sorted_indices = np.argsort(proba)[::-1]
            alternatives = [
                {
                    "category": str(classes[idx]),
                    "score": round(float(proba[idx]), 4),
                }
                for idx in sorted_indices[1:4]
                if proba[idx] > 0.01
            ]

        elif hasattr(self.model, "decision_function"):
            # SVM — normalize decision function to pseudo-probability
            decision = self.model.decision_function(X)[0]
            # Softmax-like normalization
            exp_scores = np.exp(decision - np.max(decision))
            proba = exp_scores / exp_scores.sum()
            classes = self.model.classes_
            confidence = float(np.max(proba))

            sorted_indices = np.argsort(proba)[::-1]
            alternatives = [
                {
                    "category": str(classes[idx]),
                    "score": round(float(proba[idx]), 4),
                }
                for idx in sorted_indices[1:4]
                if proba[idx] > 0.01
            ]

        return ClassificationResult(
            category=str(predicted_category),
            confidence=round(confidence, 3),
            model_version=self.model_version,
            alternatives=alternatives,
        )

    def get_model_version(self) -> str:
        return self.model_version

    def predict_all_models(self, text: str) -> Dict[str, Any]:
        """
        Run inference across all trained models (Logistic Regression, SVM, Random Forest)
        and return their individual predictions, confidences, and latencies.
        """
        if not self.vectorizer:
            vectorizer_path = MODEL_DIR / "tfidf_vectorizer.joblib"
            if vectorizer_path.exists():
                self.vectorizer = joblib.load(vectorizer_path)
            else:
                return {"error": "TF-IDF Vectorizer not found on disk"}

        X = self.vectorizer.transform([text])
        results: Dict[str, Any] = {}

        model_files = [
            ("logistic_regression", "Logistic Regression", MODEL_DIR / "logistic_regression.joblib"),
            ("svm", "Support Vector Machine", MODEL_DIR / "svm.joblib"),
            ("random_forest", "Random Forest", MODEL_DIR / "random_forest.joblib"),
        ]

        feature_names = self.vectorizer.get_feature_names_out()
        nonzero_indices = X.nonzero()[1]
        active_tokens = [str(feature_names[i]) for i in nonzero_indices]

        for m_key, display_name, path in model_files:
            if not path.exists():
                continue
            try:
                t0 = time.perf_counter()
                model = joblib.load(path)
                pred = model.predict(X)[0]
                conf = 0.85

                if hasattr(model, "predict_proba"):
                    proba = model.predict_proba(X)[0]
                    conf = float(np.max(proba))
                elif hasattr(model, "decision_function"):
                    decision = model.decision_function(X)[0]
                    exp_s = np.exp(decision - np.max(decision))
                    proba = exp_s / exp_s.sum()
                    conf = float(np.max(proba))

                latency_ms = round((time.perf_counter() - t0) * 1000, 2)

                results[m_key] = {
                    "name": display_name,
                    "category": str(pred),
                    "confidence": round(conf, 3),
                    "latency_ms": max(latency_ms, 0.1),
                }
            except Exception as ex:
                results[m_key] = {"error": str(ex)}

        return {
            "models": results,
            "active_tokens": active_tokens[:10],
        }

