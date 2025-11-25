import streamlit as st
import joblib
import numpy as np
import pandas as pd
from scipy.sparse import hstack

# --- CONFIGURATION ---
MODEL_PATH = 'best_gbr_model.joblib'
SCALER_PATH = 'minmax_scaler.pkl'
SELECTOR_PATH = 'feature_selector.pkl'
TFIDF_DESC_PATH = 'tfidf_vectorizer_desc.pkl'
COUNT_DETAILS_PATH = 'count_vectorizer_details.pkl'
COUNT_MATERIALS_PATH = 'count_vectorizer_materials.pkl'

# --- MODEL LOADING (Cached for performance) ---

@st.cache_resource
def load_assets():
    """Loads all models, transformers, and scalers once."""
    try:
        # 1. Main Model
        model = joblib.load(MODEL_PATH)
        st.success("Successfully loaded best_gbr_model.joblib")

        # 2. Scaler
        scaler = joblib.load(SCALER_PATH)
        st.success("Successfully loaded minmax_scaler.pkl")

        # 3. Feature Selector (SelectKBest)
        selector = joblib.load(SELECTOR_PATH)
        st.success("Successfully loaded feature_selector.pkl")

        # 4. Text Vectorizers
        tfidf_vectorizer_desc = joblib.load(TFIDF_DESC_PATH)
        st.success("Successfully loaded tfidf_vectorizer_desc.pkl")
        
        count_vectorizer_details = joblib.load(COUNT_DETAILS_PATH)
        st.success("Successfully loaded count_vectorizer_details.pkl")
        
        count_vectorizer_materials = joblib.load(COUNT_MATERIALS_PATH)
        st.success("Successfully loaded count_vectorizer_materials.pkl")
        
        return model, scaler, selector, tfidf_vectorizer_desc, count_vectorizer_details, count_vectorizer_materials
    
    except FileNotFoundError as e:
        st.error(f"Error: Required model asset not found: {e.filename}. Make sure all files are in the correct directory.")
        return None, None, None, None, None, None
    except Exception as e:
        st.error(f"An error occurred during asset loading: {e}")
        return None, None, None, None, None, None

model, minmax_scaler, feature_selector, tfidf_vectorizer_desc, count_vectorizer_details, count_vectorizer_materials = load_assets()

# --- STREAMLIT APP LAYOUT ---

st.title("Artisan Product Price Predictor (GBR)")
st.write("Enter the characteristics of the handmade product to predict its selling price.")

if model is None:
    st.stop() # Stop execution if models failed to load

# --- Input Fields ---
with st.form(key='price_form'):
    st.subheader("Product Attributes")

    # Text Inputs
    product_description = st.text_area("Product Description", "A hand-knitted woolen scarf, extra long.", height=100)
    product_details = st.text_area("Product Details/Features (e.g., color, size)", "Deep red, 180cm x 30cm, soft merino wool.", height=70)
    materials_used = st.text_area("Materials Used", "100% Merino Wool, natural dye.", height=70)

    # Numerical Inputs
    production_time = st.number_input("Production Time (hours)", min_value=0.5, value=1.0, step=0.5, format="%.1f")
    
    # Categorical Input
    market_segments = ["Luxury", "Mid-Range", "Budget"]
    target_market = st.selectbox("Target Market Segment", market_segments, index=0)

    predict_button = st.form_submit_button(label='Predict Selling Price')


# --- PREDICTION LOGIC ---

if predict_button:
    
    # 1. Feature Encoding (Numerical/Categorical)
    
    # Define the mapping used during model training
    # IMPORTANT: These values must match the encoding used when the model was trained.
    market_segment_encoding = {
        "Luxury": 0,
        "Mid-Range": 1,
        "Budget": 2
    }
    
    market_segment_encoded = market_segment_encoding.get(target_market, 1) # Default to Mid-Range if somehow missing

    # **FIX:** Combine both numerical features into a 2D array for the scaler
    # The scaler expects the shape (n_samples, n_features). We provide 1 sample and 2 features.
    numerical_features = np.array([[production_time, market_segment_encoded]]) 
    
    # 2. Scaling Numerical Features
    try:
        scaled_numerical_features = minmax_scaler.transform(numerical_features)
    except Exception as e:
        st.error(f"Scaling Error (Feature Count Mismatch): The scaler expected 2 features but received {numerical_features.shape[1]}. Please ensure the model assets are correct. Full error: {e}")
        st.stop()


    # 3. Text Feature Vectorization
    
    # Create pandas Series for vectorizers (they often expect this format)
    df_single = pd.DataFrame({
        'Product Description': [product_description],
        'Product Details/Features': [product_details],
        'Materials Used': [materials_used]
    })

    desc_features = tfidf_vectorizer_desc.transform(df_single['Product Description'])
    details_features = count_vectorizer_details.transform(df_single['Product Details/Features'])
    materials_features = count_vectorizer_materials.transform(df_single['Materials Used'])

    # 4. Combining Features
    
    # Convert scaled numerical features back to a sparse matrix for concatenation
    scaled_numerical_sparse = scaled_numerical_features
    
    # Horizontally stack all features (Sparse Matrix + Sparse Matrix + Sparse Matrix + Dense Array)
    all_features = hstack([
        scaled_numerical_sparse, 
        desc_features, 
        details_features, 
        materials_features
    ]).tocsr()
    
    # 5. Feature Selection (Using SelectKBest mask)
    final_features = all_features[:, feature_selector.get_support()]

    # 6. Prediction
    predicted_price_log = model.predict(final_features)
    
    # Inverse Transform (assuming the target was log-transformed)
    predicted_price = np.expm1(predicted_price_log)[0]

    # 7. Display Result
    st.subheader("💵 Predicted Selling Price")
    st.balloons()
    st.success(f"Based on your inputs, the optimal selling price for your product is:")
    st.markdown(f"**<h1>{predicted_price:,.2f} USD</h1>**")

    # Add a note about the market segment encoding used for clarity
    st.caption(f"*Market segment '{target_market}' was internally encoded as '{market_segment_encoded}'.*")