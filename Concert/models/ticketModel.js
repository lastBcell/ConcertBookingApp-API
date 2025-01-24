const mongoose = require('mongoose');

const ticketBookingSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // Reference to the User model
      required: true,
    },
    concert: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Concert', // Reference to the Concert model
      required: true,
    },
    ticketsBooked: {
      type: Number,
      required: true,
      min: 1, // At least one ticket should be booked
    },
    bookingDate: {
      type: Date,
      default: Date.now, // Automatically set to current date
    },
  },
  { timestamps: true }
);

// Create the TicketBooking model
const TicketBooking = mongoose.model('TicketBooking', ticketBookingSchema);

module.exports = TicketBooking;
