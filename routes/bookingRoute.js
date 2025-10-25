const express = require('express');
const router = express.Router();
const Booking = require('../models/booking');
const Event = require('../models/event');
const Users = require('../models/users');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// Middleware to check authentication
const requireAuth = (req, res, next) => {
    if (!req.session.userId) return res.redirect('/auth/login');
    next();
};

// Events listing page
router.get('/events', async (req, res) => {
    const events = await Event.find().lean();
    const user = req.session.userId ? await Users.findById(req.session.userId) : null;
    console.log(events)
    res.render('events', { events, user });
});

// Booking page for specific event
router.get('/events/:id/book', requireAuth, async (req, res) => {
    const event = await Event.findById(req.params.id);
    const bookedSeats = await Booking.find({ eventId: req.params.id, status: 'confirmed' }).select('seats');
    const occupiedSeats = bookedSeats.flatMap(b => b.seats);
    const user = await Users.findById(req.session.userId);
    res.render('booking', { event, occupiedSeats: JSON.stringify(occupiedSeats), user });
});

// Create booking (reserve seats)
router.post('/bookings/create', requireAuth, async (req, res) => {
    const { eventId, seats, totalAmount } = req.body;
    const booking = await Booking.create({
        userId: req.session.userId,
        eventId,
        seats,
        totalAmount,
        status: 'pending',
        bookingDate: new Date()
    });
    res.json({ success: true, bookingId: booking._id });
});

// Confirm payment
// In your routes file
router.post('/bookings/:id/confirm', requireAuth, async (req, res) => {
    const { paymentMethod, paymentReference } = req.body;
    
    const booking = await Booking.findByIdAndUpdate(
        req.params.id, 
        { 
            status: 'confirmed', 
            paymentMethod,
            paymentReference // Store Paystack reference
        },
        { new: true }
    );
    
    res.json({ success: true, booking });
});

// User dashboard
router.get('/dashboard', requireAuth, async (req, res) => {
    const bookings = await Booking.find({ userId: req.session.userId }).populate('eventId').sort({ bookingDate: -1 });
    const user = await Users.findById(req.session.userId);
    res.render('dashboard', { bookings, user });
});

// Cancel booking
router.post('/bookings/:id/cancel', requireAuth, async (req, res) => {
    await Booking.findByIdAndUpdate(req.params.id, { status: 'cancelled' });
    res.json({ success: true });
});

router.get('/bookings/:id/ticket.pdf', requireAuth, async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id)
            .populate('eventId')
            .populate('userId');
        
        if (!booking) {
            return res.status(404).send('Booking not found');
        }
        
        // Check if user owns this booking
        if (booking.userId._id.toString() !== req.session.userId) {
            return res.status(403).send('Unauthorized');
        }
        
        // Only allow download for confirmed bookings
        if (booking.status !== 'confirmed') {
            return res.status(400).send('Ticket only available for confirmed bookings');
        }

        // Create PDF document
        const doc = new PDFDocument({ 
            size: 'A4',
            margins: { top: 50, bottom: 50, left: 50, right: 50 }
        });

        // Set response headers
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=ticket-${booking.bookingReference}.pdf`);

        // Pipe PDF to response
        doc.pipe(res);

        // Header with logo/title area
        doc.rect(0, 0, doc.page.width, 150).fill('#20c997');
        
        doc.fillColor('#ffffff')
           .fontSize(32)
           .font('Helvetica-Bold')
           .text('GUMEL STADIUM', 50, 40, { align: 'center' });
        
        doc.fontSize(16)
           .font('Helvetica')
           .text('Event Ticket', 50, 80, { align: 'center' });

        // Ticket border
        doc.rect(40, 170, doc.page.width - 80, doc.page.height - 240)
           .strokeColor('#20c997')
           .lineWidth(3)
           .stroke();

        // Event details section
        doc.fillColor('#000000')
           .fontSize(24)
           .font('Helvetica-Bold')
           .text(booking.eventId.title, 70, 200, { width: doc.page.width - 140 });

        doc.fontSize(14)
           .font('Helvetica')
           .fillColor('#666666')
           .text(booking.eventId.subtitle || '', 70, 235, { width: doc.page.width - 140 });

        // Divider line
        doc.moveTo(70, 270)
           .lineTo(doc.page.width - 70, 270)
           .strokeColor('#e0e0e0')
           .stroke();

        // Event date and time
        doc.fillColor('#000000')
           .fontSize(12)
           .font('Helvetica-Bold')
           .text('EVENT DATE & TIME', 70, 290);

        doc.fontSize(16)
           .font('Helvetica')
           .text(new Date(booking.eventId.date).toLocaleDateString('en-NG', {
               weekday: 'long',
               year: 'numeric',
               month: 'long',
               day: 'numeric'
           }), 70, 310);

        doc.fontSize(16)
           .text(booking.eventId.time, 70, 335);

        // Booking reference
        doc.fontSize(12)
           .font('Helvetica-Bold')
           .text('BOOKING REFERENCE', doc.page.width - 270, 290);

        doc.fontSize(18)
           .font('Helvetica-Bold')
           .fillColor('#20c997')
           .text(booking.bookingReference, doc.page.width - 270, 310);

        // Seats section
        doc.fillColor('#000000')
           .fontSize(12)
           .font('Helvetica-Bold')
           .text('YOUR SEATS', 70, 380);

        let yPos = 405;
        booking.seats.forEach((seat, index) => {
            if (index > 0 && index % 8 === 0) {
                yPos += 30;
            }
            
            doc.rect(70 + (index % 8) * 62, yPos, 55, 40)
               .fillAndStroke('#f8f9fa', '#20c997');
            
            doc.fillColor('#000000')
               .fontSize(10)
               .font('Helvetica-Bold')
               .text(seat.section.toUpperCase(), 70 + (index % 8) * 62, yPos + 5, {
                   width: 55,
                   align: 'center'
               });
            
            doc.fontSize(12)
               .text(`R${seat.row}S${seat.number}`, 70 + (index % 8) * 62, yPos + 20, {
                   width: 55,
                   align: 'center'
               });
        });

        // Calculate final yPos after seats
        const seatRows = Math.ceil(booking.seats.length / 8);
        yPos += (seatRows * 30) + 40;

        // Customer details
        doc.fontSize(12)
           .font('Helvetica-Bold')
           .fillColor('#000000')
           .text('CUSTOMER DETAILS', 70, yPos);

        doc.fontSize(11)
           .font('Helvetica')
           .text(`Name: ${booking.userId.firstName} ${booking.userId.lastName}`, 70, yPos + 25);

        doc.text(`Email: ${booking.userId.email}`, 70, yPos + 45);

        if (booking.userId.phone) {
            doc.text(`Phone: ${booking.userId.phone}`, 70, yPos + 65);
        }

        // Payment details
        doc.fontSize(12)
           .font('Helvetica-Bold')
           .text('PAYMENT DETAILS', doc.page.width - 270, yPos);

        doc.fontSize(11)
           .font('Helvetica')
           .text(`Total Amount: ₦${booking.totalAmount.toLocaleString()}`, doc.page.width - 270, yPos + 25);

        doc.text(`Payment Method: ${booking.paymentMethod || 'N/A'}`, doc.page.width - 270, yPos + 45);

        doc.text(`Booking Date: ${new Date(booking.bookingDate).toLocaleDateString('en-NG')}`, doc.page.width - 270, yPos + 65);

        // Footer section
        const footerY = doc.page.height - 100;
        
        doc.moveTo(70, footerY - 20)
           .lineTo(doc.page.width - 70, footerY - 20)
           .strokeColor('#e0e0e0')
           .stroke();

        doc.fontSize(10)
           .font('Helvetica')
           .fillColor('#666666')
           .text('Please present this ticket at the venue entrance', 70, footerY, {
               width: doc.page.width - 140,
               align: 'center'
           });

        doc.fontSize(8)
           .text('For inquiries, contact: support@gumelstadium.com', 70, footerY + 20, {
               width: doc.page.width - 140,
               align: 'center'
           });

        // Barcode area (placeholder - you can integrate a real barcode library)
        doc.rect(doc.page.width / 2 - 75, footerY + 40, 150, 30)
           .strokeColor('#000000')
           .lineWidth(1)
           .stroke();

        doc.fontSize(8)
           .fillColor('#000000')
           .text(booking.bookingReference, doc.page.width / 2 - 75, footerY + 48, {
               width: 150,
               align: 'center'
           });

        // Finalize PDF
        doc.end();

    } catch (error) {
        console.error('PDF generation error:', error);
        res.status(500).send('Error generating ticket');
    }
});

module.exports = router;