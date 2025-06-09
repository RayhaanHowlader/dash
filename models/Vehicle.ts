import mongoose from 'mongoose';

const vehicleSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ['SXL', 'MXL', 'Trailer', 'Car Carrier', '17 Feet'],
  },
  registrationNumber: {
    type: String,
    required: true,
    unique: true,
  },
  status: {
    type: String,
    required: true,
    enum: ['Active', 'Maintenance', 'Inactive'],
    default: 'Active',
  },
  lastMaintenance: {
    type: Date,
    default: Date.now,
  },
  nextMaintenance: {
    type: Date,
    required: true,
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
    },
    coordinates: {
      type: [Number],
      required: true,
    },
  },
  driver: {
    name: String,
    contact: String,
    license: String,
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

vehicleSchema.index({ location: '2dsphere' });

export default mongoose.models.Vehicle || mongoose.model('Vehicle', vehicleSchema); 