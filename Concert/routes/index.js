var express = require('express');
var router = express.Router();
const User = require('../models/userModel');
const Concert = require('../models/concertModel');
const TicketBooking = require('../models/ticketModel');

const bcrypt = require('bcrypt');
const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const JWT_SECRET = process.env.JWT_SECRET;

const authenticateRole = (allowedRoles) => {
  return (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authorization token required.' });
    }

    const token = authHeader.split(' ')[1];

    try {
      // Verify the token
      const decoded = jwt.verify(token, JWT_SECRET);

      // Check if the user's role is allowed
      if (!allowedRoles.includes(decoded.role)) {
        return res.status(403).json({ error: 'Access denied.' });
      }

      // Attach the user info to the request object
      req.user = decoded;
      next();
    } catch (error) {
      return res.status(401).json({ error: 'Invalid or expired token.' });
    }
  };
};


/* GET home page. */
router.get('/', function(req, res, next) {
  res.status(200).json({ message: 'Welcome to the Concert API' });
});

// signup route
router.post(
  '/signup',
  [
    // Validation rules
    body('name').trim().notEmpty().withMessage('Name is required.'),
    body('email')
      .isEmail()
      .withMessage('Please provide a valid email address.')
      .custom(async (email) => {
        // Check if email already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
          throw new Error('Email is already registered.');
        }
      }),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters long.'),
    body('role')
      .optional()
      .isIn(['admin', 'user'])
      .withMessage('Role must be either "admin" or "user".'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { name, email, password, role } = req.body;

      // Hash the password
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // Create a new user
      const user = new User({
        name,
        email,
        password: hashedPassword,
        role: role || 'user', // Default role is 'user'
      });

      // Save the user to the database
      await user.save();

      // Respond with the created user (excluding the password)
      const { password: _, ...userWithoutPassword } = user.toObject();
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Login route
router.post('/login',
  [
    // Validation rules
    body('email').isEmail().withMessage('Please provide a valid email address.'),
    body('password').notEmpty().withMessage('Password is required.'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { email, password } = req.body;

      // Check if the user exists
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(401).json({ error: 'Invalid email or password.' });
      }

      // Compare the password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ error: 'Invalid email or password.' });
      }

      // Generate JWT token
      const token = jwt.sign(
        { id: user._id, role: user.role },
        JWT_SECRET,
        { expiresIn: '1h' } // Token expires in 1 hour
      );

      // Respond with the token
      res.json({
        message: 'Login successful',
        token,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);
// Route to insert a new concert
router.post(
  '/concerts',authenticateRole(['admin']),
  [
    // Validation rules
    body('concertName').trim().notEmpty().withMessage('Concert name is required.'),
    body('dateTime')
      .notEmpty()
      .withMessage('Date and time are required.')
      .isISO8601()
      .withMessage('Date and time must be in a valid ISO8601 format.'),
    body('venue').trim().notEmpty().withMessage('Venue is required.'),
    body('ticketPrice')
      .isFloat({ min: 0 })
      .withMessage('Ticket price must be a positive number.'),
    body('availableTickets')
      .isInt({ min: 0 })
      .withMessage('Available tickets must be a non-negative integer.'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { concertName, dateTime, venue, ticketPrice, availableTickets } = req.body;

      // Create a new concert
      const concert = new Concert({
        concertName,
        dateTime,
        venue,
        ticketPrice,
        availableTickets,
      });
      
      // Save the concert to the database
      await concert.save();

      // Respond with the created concert
      res.status(201).json(concert);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Route to fetch all concerts
router.get('/Allconcerts', async (req, res) => {
  try {
    // Fetch all concerts, sorted by dateTime (ascending)
    const concerts = await Concert.find().sort({ dateTime: 1 });

    res.json(concerts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
// all users
router.get('/Allusers',authenticateRole(['admin']), async (req, res) => {
  try {
    // Fetch all users from the database
    const users = await User.find();

    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
// ticket booking route
router.post('/book-tickets',authenticateRole(['admin', 'user']), async (req, res) => {
  const { userId, concertId, tickets } = req.body;

  try {
    // Validate the ticket count for the current booking
    if (tickets > 3) {
      return res.status(401).json({ message: 'You cannot book more than 3 tickets at a time.' });
    }

    // Check if the user already has bookings for the same concert
    const existingBooking = await TicketBooking.findOne({ user: userId, concert: concertId });

    if (existingBooking) {
      // Calculate the total tickets including the new booking
      const totalTickets = existingBooking.ticketsBooked + tickets;

      if (totalTickets > 3) {
        return res.status(400).json({ message: 'Total tickets booked for this concert cannot exceed 3.' });
      }

      // Update the existing booking
      existingBooking.ticketsBooked = totalTickets;
      await existingBooking.save();

     const newticketcount = await Concert.findOne({ _id: concertId });
     const newticket = newticketcount.availableTickets - tickets;
     newticketcount.availableTickets = newticket;
     await newticketcount.save();

      return res.status(200).json({
        message: 'Booking updated successfully!',
        booking: existingBooking,
      });
    }

    // If no existing booking, create a new one
    const newBooking = new TicketBooking({
      user: userId,
      concert: concertId,
      ticketsBooked: tickets,
    });

    await newBooking.save();

    const newticketcount = await Concert.findOne({ _id: concertId });
    const newticket = newticketcount.availableTickets - tickets;
    newticketcount.availableTickets = newticket;
    await newticketcount.save();

    res.status(201).json({
      message: 'Tickets booked successfully!',
      booking: newBooking,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'An error occurred while booking tickets.' });
  }
});

router.get('/user-booking/:id',authenticateRole(['admin']), async (req, res) => {
  const userId = req.params.id;
  try {
    // Fetch all users from the database
    const userbooking = await TicketBooking.find({user:userId});
    if(userbooking.length === 0){
     return res.json({message: 'No booking found for this user'});
    }
    
    res.status(200).json(userbooking);
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
});
// routee to get one concert
router.get('/get-concert/:id', async (req, res) => {
  const concertId = req.params.id;
  try {
    const concert = await Concert.findById(concertId);
    if (!concert) {
      return res.status(404).json({ message: 'Concert not found.' });
    }
    res.status(200).json(concert);
  }catch (error){
    res.status(401).json({ error: error.message });
  }

})


// crud operations on concert
router.put('/update-concert/:id', async (req, res) => {
  const concertId = req.params.id;
  const { concertName, dateTime, venue, ticketPrice, availableTickets } = req.body;

  try {
    // Find the concert by ID
    const concert = await Concert.findOne({ _id: concertId });
    if (!concert) {
      return res.status(404).json({ message: 'Concert not found.' });
    }

    // Update the concert
    concert.concertName = concertName;
    concert.dateTime = dateTime;
    concert.venue = venue;
    concert.ticketPrice = ticketPrice;
    concert.availableTickets = availableTickets;

    await concert.save();

    res.status(200).json(concert);
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
});
 
// delete route

router.delete('/delete-concert/:id', async (req, res) => {
  const concertId = req.params.id;
  try {
    const concert = await Concert.findByIdAndDelete(concertId);
    if (!concert) {
      return res.status(404).json({ error: 'Concert not found' });
    }
    res.status(200).json({ message: 'Concert deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// upddate booking
router.put('/update-booking/:id', async (req, res) => {
 const userId = req.params.id;
 const { concertId , tickets} =req.body;
 const updatedticketcount = tickets;
//  console.log(userId,updatedticketcount)
 try{
  if(updatedticketcount == 0){
     return res.status(401).json({msg:"Atleast one should be booked"})
  }
   if (updatedticketcount > 3) {
     return res.status(401).json({ message: 'You cannot book more than 3 tickets at a time.' });
    }
     const existingBooking = await TicketBooking.findOne({user:userId,concert:concertId});
     if(!existingBooking){
      return res.status(404).json({ message: 'Booking not found .' });
     }
     const oldcount = existingBooking.ticketsBooked; 
     existingBooking.ticketsBooked = updatedticketcount;
     await existingBooking.save()

     
     const concert = await Concert.findOne({ _id: concertId });
     if (!concert) {
       return res.status(404).json({ message: 'Concert not found.' });
      }
      concert.availableTickets =(concert.availableTickets + oldcount)-updatedticketcount;
      await concert.save();
      res.status(200).json({"updatedtickets":updatedticketcount,"oldcount":oldcount,existingBooking,concert,message:"Ticket updated succesfully."});
  
 }
 catch(errors){
  console.error(errors);
  res.status(500).json({message:"an error occured during updating"})
 }
})

// delete booking
router.delete('/delete-booking/:id', async (req, res) => {
  const bookingId = req.params.id;
  try {
    const booking = await TicketBooking.findByIdAndDelete(bookingId);
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    res.status(200).json({ message: 'Booking deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
