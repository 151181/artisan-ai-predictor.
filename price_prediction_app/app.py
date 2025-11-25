import streamlit as st
import joblib
import pandas as pd
import numpy as np

# --- Configuration ---
st.set_page_config(layout="wide", page_title="African Art Price Predictor")

# --- Function to load all assets ---
@st.cache_resource
def load_assets():
    """Loads all machine learning assets (model, vectorizers, scaler, selector)"""
    try:
        # Load Vectorizers
        vectorizer_desc = joblib.load('tfidf_vectorizer_desc.pkl')
        vectorizer_materials = joblib.load('count_vectorizer_materials.pkl')
        vectorizer_details = joblib.load('count_vectorizer_details.pkl')
        
        # Load Preprocessing Tools
        scaler = joblib.load('minmax_scaler.pkl')
        selector = joblib.load('feature_selector.pkl')
        
        # Load Model
        model = joblib.load('best_gbr_model.joblib')
        
        st.success("All prediction assets loaded successfully!")
        return vectorizer_desc, vectorizer_materials, vectorizer_details, scaler, selector, model
    except Exception as e:
        st.error(f"Failed to load machine learning assets. Please ensure all .pkl and .joblib files are in the repository: {e}")
        return None, None, None, None, None, None

# Load the assets
vectorizer_desc, vectorizer_materials, vectorizer_details, scaler, selector, model = load_assets()

if model is None:
    st.stop() # Stop execution if assets failed to load

# --- Prediction Logic ---
def predict_price(description, materials, details, store_rating, total_sales, product_rating, assets):
    
    vectorizer_desc, vectorizer_materials, vectorizer_details, scaler, selector, model = assets

    # 1. Feature Engineering (Match training process)
    # Convert inputs to DataFrame row for consistent processing
    data = {
        'Product_Description': [description],
        'Materials_Used': [materials],
        'Details': [details],
        'Store_Rating': [store_rating],
        'Total_Store_Sales': [total_sales],
        'Product_Rating': [product_rating]
    }
    input_df = pd.DataFrame(data)
    
    # 2. Vectorize Text Features
    X_desc = vectorizer_desc.transform(input_df['Product_Description'])
    X_materials = vectorizer_materials.transform(input_df['Materials_Used'])
    X_details = vectorizer_details.transform(input_df['Details'])

    # 3. Combine Text and Numeric Features
    # Note: Numeric columns must be scaled *after* vectorization
    X_text = pd.concat([
        pd.DataFrame(X_desc.toarray(), columns=[f'desc_{i}' for i in range(X_desc.shape[1])]),
        pd.DataFrame(X_materials.toarray(), columns=[f'materials_{i}' for i in range(X_materials.shape[1])]),
        pd.DataFrame(X_details.toarray(), columns=[f'details_{i}' for i in range(X_details.shape[1])])
    ], axis=1)

    # 4. Handle Numeric Features
    X_numeric = input_df[['Store_Rating', 'Total_Store_Sales', 'Product_Rating']].values
    
    # 5. Scale Numeric Features (MUST be done before combining)
    X_numeric_scaled = scaler.transform(X_numeric)
    X_numeric_scaled_df = pd.DataFrame(X_numeric_scaled, columns=['Store_Rating_scaled', 'Total_Store_Sales_scaled', 'Product_Rating_scaled'])

    # Final Feature Matrix
    X_final = pd.concat([X_text, X_numeric_scaled_df], axis=1)

    # 6. Apply Feature Selection (Critical step to match model input)
    # We select features based on the selector mask saved during training
    X_selected = X_final.iloc[:, selector.get_support()]

    # 7. Prediction (Model expects log-transformed price, so we anti-log the result)
    log_price_pred = model.predict(X_selected)[0]
    
    # Anti-log transform (assuming training used np.log1p)
    predicted_price = np.expm1(log_price_pred) 
    
    return max(1.0, predicted_price) # Ensure price is at least $1.00

# --- Streamlit UI ---
st.title("🌍 African Art Price Predictor")
st.markdown("Enter the details of your African Art piece to estimate its price in USD.")

# Using a form to group inputs and handle submission
with st.form("price_prediction_form"):
    st.subheader("Art Piece Details")
    
    # Text Inputs
    description = st.text_area("Product Description", placeholder="e.g., 'Handmade tribal mask crafted from reclaimed wood'", height=100)
    materials = st.text_input("Materials Used (comma-separated)", placeholder="e.g., 'wood, acrylic paint, cotton'")
    details = st.text_input("Details", placeholder="e.g., 'Handmade, Traditional, Vintage'")

    st.subheader("Seller & Store Metrics")
    
    # Numeric Inputs (using sliders for easy input)
    col1, col2, col3 = st.columns(3)
    
    with col1:
        store_rating = st.slider("Store Rating (0.0 to 5.0)", min_value=0.0, max_value=5.0, value=4.5, step=0.1)

    with col2:
        # Use a number input for sales, as the range can be huge
        total_sales = st.number_input("Total Store Sales", min_value=0, value=500, step=10)

    with col3:
        product_rating = st.slider("Product Rating (0.0 to 5.0)", min_value=0.0, max_value=5.0, value=4.8, step=0.1)

    # Submission Button
    submitted = st.form_submit_button("💰 Estimate Price in USD")

    if submitted:
        if not description or not materials:
            st.error("Please fill in the Product Description and Materials Used fields.")
        else:
            # Pass all assets needed for the prediction pipeline
            assets = (vectorizer_desc, vectorizer_materials, vectorizer_details, scaler, selector, model)
            
            # Run Prediction
            with st.spinner('Calculating estimated price...'):
                estimated_price = predict_price(
                    description, materials, details, 
                    store_rating, total_sales, product_rating, 
                    assets
                )
            
            # Display Result
            st.success("✅ Prediction Complete")
            st.markdown(f"""
                <div style='background-color: #e6f7ff; padding: 20px; border-radius: 10px; border-left: 5px solid #007bff;'>
                    <h3 style='margin-top: 0;'>Estimated Market Price</h3>
                    <p style='font-size: 2.5em; color: #007bff; font-weight: bold;'>
                        ${estimated_price:,.2f}
                    </p>
                    <p>Based on the current market trends and model analysis.</p>
                </div>
            """, unsafe_allow_html=True)