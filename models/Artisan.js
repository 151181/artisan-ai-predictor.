import mongoose from 'mongoose';

const artisanSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phoneNumber: { type: String },
    location: { type: String },
    createdAt: { type: Date, default: Date.now }
});

const Artisan = mongoose.model('Artisan', artisanSchema);
export default Artisan;
