import mongoose from 'mongoose';

const waypointSchema = new mongoose.Schema({
  vname: {
    type: String,
    required: true,
  },
  dttime: {
    type: Date,
    required: true,
  },
  lat: {
    type: Number,
    required: true,
  },
  lngt: {
    type: Number,
    required: true,
  },
  Haltinghours: {
    type: Number,
    default: 0,
  },
  name: String,
  address: String,
}, {
  timestamps: true,
});

// Create indexes for better query performance
waypointSchema.index({ vname: 1, dttime: -1 });

const Waypoint = mongoose.models.Waypoint || mongoose.model('Waypoint', waypointSchema);

export default Waypoint; 