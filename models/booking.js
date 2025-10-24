// models/booking.js
const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    seats: [{ section: String, row: Number, number: Number, price: Number }],
    totalAmount: { type: Number, required: true },
    status: { type: String, enum: ['pending', 'confirmed', 'cancelled'], default: 'pending' },
    paymentMethod: { type: String },
    paymentReference: { type: String }, // Add this field
    bookingDate: { type: Date, default: Date.now },
    bookingReference: { type: String, unique: true }
});

bookingSchema.pre('save', function(next) {
    if (!this.bookingReference) {
        this.bookingReference = 'BK' + Date.now() + Math.random().toString(36).substr(2, 9).toUpperCase();
    }
    next();
});

module.exports = mongoose.model('Booking', bookingSchema);

