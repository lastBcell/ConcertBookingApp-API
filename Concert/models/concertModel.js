const mongoose = require('mongoose');

// Define the schema for a concert booking
const concertSchema = new mongoose.Schema({
  concertName: {
    type: String,
    required: true,
    trim: true,
  },
  dateTime: {
    type: Date,
    required: true,
  },
  venue: {
    type: String,
    required: true,
    trim: true,
  },
  ticketPrice: {
    type: Number,
    required: true,
    min: 0,
  },
  availableTickets: {
    type: Number,
    required: true,
    min: 0,
  },
}, {
  timestamps: true, // Adds createdAt and updatedAt fields
});

// Export the model
const Concert = mongoose.model('Concert', concertSchema);

module.exports = Concert;
