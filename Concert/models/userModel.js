const mongoose = require('mongoose');

// Define the schema for the user
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please use a valid email address'],
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
  },
  role: {
    type: String,
    enum: ['admin', 'user'],
    default: 'user',
  },
  ticketBooked: {
    type: [String], // Array of ticket IDs or descriptions
    default: [],
  },
}, {
  timestamps: true, // Adds createdAt and updatedAt fields
});

// Export the model
const User = mongoose.model('User', userSchema);

module.exports = User;
