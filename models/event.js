// models/event.js
const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
    title: { type: String, required: true },
    subtitle: { type: String },
    description: { type: String },
    date: { type: Date, required: true },
    time: { type: String, required: true },
    icon: { type: String, default: '⚽' },
    category: { type: String, enum: ['sports', 'concert', 'championship'], default: 'sports' },
    prices: {
        regular: { type: Number, required: true },
        premium: { type: Number, required: true },
        vip: { type: Number, required: true }
    },
    capacity: {
        regular: { rows: Number, seatsPerRow: Number },
        premium: { rows: Number, seatsPerRow: Number },
        vip: { rows: Number, seatsPerRow: Number }
    },
    status: { type: String, enum: ['upcoming', 'ongoing', 'completed', 'cancelled'], default: 'upcoming' }
});

module.exports = mongoose.model('Event', eventSchema);