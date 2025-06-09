import mongoose from 'mongoose';

const tripSchema = new mongoose.Schema({
  vehicleNumber: {
    type: String,
    required: true,
  },
  origin: {
    name: String,
    address: String,
    coordinates: {
      lat: Number,
      lng: Number,
    },
  },
  destination: {
    name: String,
    address: String,
    coordinates: {
      lat: Number,
      lng: Number,
    },
  },
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'completed', 'cancelled'],
    default: 'pending',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Create indexes for better query performance
tripSchema.index({ vehicleNumber: 1, status: 1 });

const Trip = mongoose.models.Trip || mongoose.model('trip', tripSchema);

export default Trip; 