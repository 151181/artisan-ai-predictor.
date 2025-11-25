import * as tf from '@tensorflow/tfjs';
import fs from 'fs';
import csv from 'csv-parser';
import path from 'path';

const __dirname = path.resolve();

// Path to your dataset
const DATA_PATH = path.join(__dirname, 'backend/app/ai/9e35fafe-fd2b-4ac6-ab8e-8a73f5f6dce8.csv');

// --- Utilities ---

// Convert category strings to numeric
const encodeCategories = (categories) => {
  const unique = [...new Set(categories)];
  const map = Object.fromEntries(unique.map((cat, idx) => [cat, idx]));
  return categories.map((cat) => map[cat]);
};

// Normalize numeric values (price)
const normalize = (arr) => {
  const max = Math.max(...arr);
  const min = Math.min(...arr);
  return arr.map((v) => (v - min) / (max - min));
};

// Convert text (description) to numeric vector
const textToVector = (text, vocabulary) => {
  const vector = Array(vocabulary.length).fill(0);
  text
    .toLowerCase()
    .split(/\W+/)
    .forEach((word) => {
      const index = vocabulary.indexOf(word);
      if (index !== -1) vector[index] += 1;
    });
  return vector;
};

// --- Load & preprocess dataset ---
const loadData = async () => {
  const rows = [];
  return new Promise((resolve, reject) => {
    fs.createReadStream(DATA_PATH)
      .pipe(csv())
      .on('data', (row) => rows.push(row))
      .on('end', () => {
        const categories = rows.map((r) => r.category);
        const prices = rows.map((r) => parseFloat(r.price));
        const descriptions = rows.map((r) => r.description || '');

        // Vocabulary for text
        const allWords = descriptions.flatMap((d) => d.toLowerCase().split(/\W+/));
        const vocabulary = [...new Set(allWords)].slice(0, 500); // smaller vocab for efficiency

        const encodedCategories = encodeCategories(categories);
        const normalizedPrices = normalize(prices);

        const features = descriptions.map((desc, i) => {
          const textVec = textToVector(desc, vocabulary);
          return [normalizedPrices[i], encodedCategories[i], ...textVec];
        });

        resolve({ rows, features });
      })
      .on('error', reject);
  });
};

// --- KNN Recommendation Logic ---
const recommendKNN = (targetIndex, featureTensor, k = 5) => {
  const target = featureTensor.slice([targetIndex, 0], [1, -1]);
  const distances = tf.tidy(() => {
    const diff = featureTensor.sub(target);
    const sq = diff.square().sum(1);
    return sq.sqrt();
  });

  const distanceArray = distances.arraySync();
  const sorted = distanceArray
    .map((d, i) => ({ d, i }))
    .sort((a, b) => a.d - b.d)
    .slice(1, k + 1)
    .map((x) => x.i);

  return sorted;
};

// --- Train & Save Model ---
const trainKNNModel = async () => {
  console.log('📦 Loading dataset...');
  const { rows, features } = await loadData();
  const featureTensor = tf.tensor2d(features);

  console.log('✅ Features loaded:', featureTensor.shape);

  // Example: Recommend for first product
  const recommendations = recommendKNN(0, featureTensor, 5);
  console.log(`🎨 Recommendations for: ${rows[0].name}`);
  recommendations.forEach((i) => {
    console.log(`➡️ ${rows[i].name} | ${rows[i].category} | $${rows[i].price}`);
  });

  // Save dataset + tensor info (for later use by API)
  const savePath = path.join(__dirname, 'backend/app/ai/knn_model.json');
  fs.writeFileSync(savePath, JSON.stringify({ data: rows }));
  console.log(`💾 Model saved at: ${savePath}`);
};

trainKNNModel().catch((err) => console.error('❌ Error training model:', err));
