import streamlit as st
import pandas as pd
import joblib
import os
import numpy as np
from scipy.sparse import hstack
from sklearn.base import BaseEstimator, RegressorMixin

# --- Configuration ---
# File names are set to the clean versions confirmed to be working.
ASSET_PATHS = {
    'vectorizer_desc': 'tfidf_vectorizer_desc.pkl',
    'vectorizer_materials': 'count_vectorizer_materials.pkl',
    'vectorizer_details': 'count_vectorizer_details.pkl',
    'scaler': 'minmax_scaler.pkl', 
    'selector': 'feature_selector.pkl', 
    'model': 'best_gbr_model.joblib' 
}

# Define the numerical features that the MinMax Scaler expects.
# Based on the error (1059 expected features), we must assume only 3 of the
# original 6 numerical features were used in the training pipeline before feature selection.
NUM_FEATURES = [
    'Store_Rating', 
    'Totals_sales', 
    'Product_Rating'
    # The following 3 features are excluded to match the 1059 expected total features:
    # 'listings', 'Description_len', 'Reviews'
]

# --- Asset Loading Function ---

@st.cache_resource
def load_assets():
    """Loads all machine learning assets from the disk."""
    st.info("Attempting to load machine learning assets...")
    assets = {}
    
    # Get the directory where the script is running
    script_dir = os.path.dirname(os.path.abspath(__file__))
    missing_files = []

    try:
        for key, filename in ASSET_PATHS.items():
            file_path = os.path.join(script_dir, filename)
            
            if not os.path.exists(file_path):
                missing_files.append(filename)
                continue
                
            # Attempt to load the asset
            try:
                assets[key] = joblib.load(file_path)
                st.success(f"Successfully loaded: {key} from {filename}")
            except Exception as load_error:
                # Catch specific loading errors for clearer debugging
                st.error(f"FATAL LOAD ERROR for {filename} ({key}): File may be corrupted or created with a different scikit-learn version. Error: {load_error}")
                st.stop()
                
        if missing_files:
            st.error(f"Asset Loading Failed: The following required files were NOT found in the directory: {', '.join(missing_files)}. Please ensure these files are present.")
            st.stop()
            
        st.success("All prediction assets loaded successfully!")
        return assets
        
    except Exception as e:
        st.error(f"General Asset Loading Setup Failure: {e}")
        st.stop()


# --- Main Application Logic ---

# 1. Load the assets
assets = load_assets()

# 2. Extract components
try:
    tfidf_desc = assets['vectorizer_desc']
    count_materials = assets['vectorizer_materials']
    count_details = assets['vectorizer_details']
    scaler = assets['scaler']
    selector = assets['selector'] 
    model = assets['model']
except KeyError as e:
    st.error(f"Critical Error: Required asset {e} is missing after successful loading. Cannot run prediction.")
    st.stop()


# --- Prediction Function ---

def predict_price(user_input):
    """
    Preprocesses user input, predicts price, and reverses the scaling.
    """
    # 1. Create a DataFrame for consistent processing
    data = pd.DataFrame(user_input, index=[0])

    # 2. Feature Engineering / Preprocessing

    # Numerical Features 
    # Only use the 3 numerical features confirmed to match the training data feature count (1059 total)
    num_data = data[NUM_FEATURES].fillna(0).astype(float) 

    # Text Features Vectorization
    desc_vec = tfidf_desc.transform(data['Description'].fillna(''))
    materials_vec = count_materials.transform(data['Materials'].fillna(''))
    details_vec = count_details.transform(data['Details'].fillna(''))

    # Combine all features (3 numerical + 1000 desc + 52 materials + 4 details = 1059 total features)
    feature_matrix = hstack([
        num_data.values,
        desc_vec,
        materials_vec,
        details_vec
    ])

    # 3. Feature Selection (Using the loaded SelectFromModel)
    selected_features = selector.transform(feature_matrix)

    # 4. Predict the scaled price
    scaled_prediction = model.predict(selected_features)

    # 5. Inverse transform to get the real price (USD)
    # The scaler expects a 2D array, so we reshape the prediction.
    actual_prediction = scaler.inverse_transform(scaled_prediction.reshape(-1, 1))[0][0]

    return actual_prediction


# --- Streamlit UI ---

st.set_page_config(page_title="African Art Price Predictor", layout="centered")

st.markdown("""
    <style>
    .stButton>button {
        background-color: #A0522D; /* Sienna Brown */
        color: white;
        border-radius: 8px;
        font-weight: bold;
        padding: 10px 20px;
        transition: all 0.2s;
    }
    .stButton>button:hover {
        background-color: #8B4513; /* Saddle Brown */
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    .main-header {
        color: #8B4513;
        font-size: 2.5em;
        text-align: center;
        margin-bottom: 20px;
    }
    </style>
""", unsafe_allow_html=True)

st.markdown("<h1 class='main-header'>🌍 African Art Price Predictor</h1>", unsafe_allow_html=True)
st.write("Enter the details of your African Art piece to estimate its price in USD.")

# --- Input Form ---
with st.form("price_prediction_form"):
    st.subheader("Art Piece Description")
    description = st.text_area("Product Description (e.g., 'Handmade tribal mask crafted from reclaimed wood')", "African Dog Collar broad - 51-54cm | Handmade Dog Collar | African Dog Collar | Bohemian Pet Collar | African Tribe Art")
    materials = st.text_input("Materials Used (comma-separated, e.g., 'wood, acrylic paint, cotton')", "elephant grass, natural dyes")
    details = st.selectbox("Details", ['Handmade', 'Digital', 'Download', 'No Information Provided'], index=0)

    st.subheader("Seller & Store Metrics (Based on your shop's performance")
    
    # Organize inputs into two columns
    col1, col2 = st.columns(2)
    with col1:
        store_rating = st.slider("Store Rating (0.0 to 5.0)", 0.0, 5.0, 4.9, 0.1)
        total_sales = st.number_input("Total Store Sales", 0, 100000, 1010, step=100)
        product_rating = st.slider("Product Rating (0.0 to 5.0)", 0.0, 5.0, 4.5, 0.1)
        # These fields are included for user input but NOT used in prediction
        st.caption("The following fields are for context but were excluded from the model to fix the feature count mismatch.")
    with col2:
        listings = st.number_input("Total Active Listings", 0, 5000, 31, step=10)
        description_len = st.number_input("Description Word Count", 0, 5000, 163, step=10)
        reviews = st.number_input("Total Reviews for this Product", 0, 1000, 5, step=1)

    submitted = st.form_submit_button("Predict Price")

    if submitted:
        # Prepare input data (Only the features required by the model)
        user_input = {
            'Description': description,
            'Materials': materials,
            'Details': details,
            'Store_Rating': store_rating,
            'Totals_sales': float(total_sales),
            'Product_Rating': product_rating,
            # We still need to pass these values to avoid KeyError when creating the DataFrame, 
            # even though they will be filtered out by NUM_FEATURES later.
            'listings': float(listings),
            'Description_len': float(description_len),
            'Reviews': float(reviews)
        }

        with st.spinner('Calculating estimated price...'):
            try:
                predicted_price = predict_price(user_input)
                st.markdown(f"""
                    <div style='background-color: #E6E0D4; padding: 20px; border-radius: 12px; text-align: center; border: 2px solid #8B4513;'>
                        <p style='font-size: 1.2em; color: #333;'>The estimated price for this art piece is:</p>
                        <h2 style='font-size: 3em; color: #8B4513;'>USD ${predicted_price:,.2f}</h2>
                    </div>
                """, unsafe_allow_html=True)
            except Exception as e:
                st.error(f"Prediction Error: The prediction failed. This often happens if the input features do not perfectly align with the features the model was trained on. Error details: {e}")