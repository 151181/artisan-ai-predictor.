import streamlit as st
import joblib
import pandas as pd
import numpy as np
from scipy.sparse import hstack, csr_matrix

# --- Configuration ---
# CRITICAL PATH FIX: This prefix ensures the app can find the assets 
# when executed by the cloud deployment environment (relative to the repository root).
# We use the full folder name based on the directory path you provided.
MODEL_PATH_PREFIX = "price_prediction_app/" 

# --- Helper Functions for Loading Models ---
@st.cache_resource
def load_model(filename):
    """Loads a joblib/pkl model from the specified path."""
    full_path = MODEL_PATH_PREFIX + filename
    try:
        model = joblib.load(full_path)
        st.success(f"Successfully loaded {filename}")
        return model
    except FileNotFoundError:
        st.error(f"Error: Model file not found at {full_path}. Please ensure the file is committed to your repository inside the '{MODEL_PATH_PREFIX}' folder.")
        st.stop()
    except Exception as e:
        st.error(f"Error loading {filename}: {e}")
        st.stop()

# --- Load ALL ML Assets (Matching your file listing) ---
# Main Model
gbr_model = load_model("best_gbr_model.joblib")
# Preprocessing Tools
minmax_scaler = load_model("minmax_scaler.pkl")
feature_selector = load_model("feature_selector.pkl")
# Text Vectorizers (Three distinct text features)
desc_vectorizer = load_model("tfidf_vectorizer_desc.pkl")
details_vectorizer = load_model("count_vectorizer_details.pkl")
materials_vectorizer = load_model("count_vectorizer_materials.pkl")


# Ensure all models are loaded before proceeding
if any(m is None for m in [gbr_model, minmax_scaler, feature_selector, desc_vectorizer, details_vectorizer, materials_vectorizer]):
    st.warning("One or more ML assets failed to load. Please check file names and paths.")
    st.stop()


# --- Streamlit Application Logic ---

st.title("Artisan Product Price Predictor (GBR)")
st.markdown("Enter the characteristics of the handmade product to predict its selling price.")

# --- Input Fields ---

# Text Inputs
description_input = st.text_area("Product Description", "A finely crafted, hand-painted ceramic vase with a unique floral design.")
details_input = st.text_input("Product Details/Features (e.g., color, size)", "Blue and white, 12 inches tall, glazed finish")
materials_input = st.text_input("Materials Used", "Ceramic clay, lead-free paint, high-gloss glaze")

# Numerical/Categorical Inputs (Example features—adjust these to match your model's non-text features)
handmade_status = st.checkbox("Is the item 100% Handmade?", value=True)
production_time = st.slider("Production Time (hours)", 1, 100, 10)
market_segment = st.selectbox("Target Market Segment", ["Luxury", "Mid-Range", "Budget"])


# --- Prediction Logic ---

if st.button("Calculate Predicted Price"):
    
    # 1. Text Feature Transformation
    # Transform each text input using its corresponding vectorizer
    desc_vec = desc_vectorizer.transform([description_input])
    details_vec = details_vectorizer.transform([details_input])
    materials_vec = materials_vectorizer.transform([materials_input])
    
    # Concatenate all sparse text features horizontally
    sparse_features = hstack([desc_vec, details_vec, materials_vec])

    # 2. Non-Text Feature Transformation
    # Map categorical data to numerical (assuming 1, 2, 3 for these segments)
    market_map = {"Luxury": 3, "Mid-Range": 2, "Budget": 1}
    market_num = market_map.get(market_segment, 0)
    
    # Create the non-text feature matrix (ensure order matches your training data)
    numerical_features = np.array([
        1 if handmade_status else 0, # is_handmade
        production_time,             # production_time
        market_num                   # market_segment
        # Add any other non-text features here...
    ]).reshape(1, -1)
    
    # Apply MinMax Scaler to the numerical features
    scaled_numerical_features = minmax_scaler.transform(numerical_features)
    
    # 3. Combine All Features
    # Convert numerical features to a sparse matrix for concatenation
    sparse_numerical = csr_matrix(scaled_numerical_features)
    
    # Combine sparse text features and sparse numerical features
    full_feature_matrix = hstack([sparse_features, sparse_numerical])
    
    # 4. Feature Selection
    # Apply the feature selector (e.g., SelectKBest) to the combined matrix
    selected_features = feature_selector.transform(full_feature_matrix)

    # 5. Prediction (GBR model)
    try:
        predicted_price_log = gbr_model.predict(selected_features)
        
        # NOTE: If your model predicts the log of the price, use np.expm1()
        predicted_price = np.expm1(predicted_price_log[0])
        
        # 6. Display Result
        st.metric(label="Predicted Selling Price", value=f"KES {predicted_price:,.2f}")
        st.balloons()
        
    except Exception as e:
        st.error(f"Prediction failed. Check that your feature structure matches the training data. Error: {e}")


st.sidebar.info("Model assets successfully loaded from the 'price_prediction_app/' directory.")