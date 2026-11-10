const petModel = require('../models/petModel');
const serviceModel = require('../models/serviceModel');
const serviceBookingModel = require('../models/serviceBookingModel');

const BOOKING_SUCCESS = 'Booking created. Payment is pending; no payment has been processed.';
const BOOKING_VALIDATION_ERROR = 'Choose a pet, service, and valid booking date.';
const BOOKING_UNAVAILABLE_ERROR = 'That pet or service is unavailable for booking.';
const BOOKING_DATABASE_ERROR = 'Unable to create the booking. Please try again.';

function getLocalDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parsePositiveInteger(value) {
  if (typeof value !== 'string' && typeof value !== 'number') return null;
  const text = String(value);
  if (!/^\d+$/.test(text)) return null;

  const parsed = Number(text);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
}

function isValidBookingDate(value, today) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const [year, month, day] = value.split('-').map(Number);
  const parsedDate = new Date(0);
  parsedDate.setHours(0, 0, 0, 0);
  parsedDate.setFullYear(year, month - 1, day);

  return parsedDate.getFullYear() === year
    && parsedDate.getMonth() === month - 1
    && parsedDate.getDate() === day
    && value >= today;
}

function listServices(req, res) {
  const ownerId = req.session.user.id;

  petModel.getPetsByOwner(ownerId, (petError, pets) => {
    if (petError) {
      console.error('Error loading pets for service booking:', petError);
      return res.status(500).send('Unable to load pets.');
    }

    serviceModel.getActiveServices((serviceError, services) => {
      if (serviceError) {
        console.error('Error loading active services:', serviceError);
        return res.status(500).send('Unable to load services.');
      }

      const requestedPetId = String(req.query.petId || '');
      const selectedPet = pets.find((pet) => String(pet.id) === requestedPetId);
      return res.render('services', {
        pets,
        services,
        selectedPetId: selectedPet ? String(selectedPet.id) : '',
        today: getLocalDateString(),
        messages: req.flash('success'),
        errors: req.flash('error'),
        session: req.session
      });
    });
  });
}

function createBooking(req, res) {
  const petId = parsePositiveInteger(req.body.petId);
  const serviceId = parsePositiveInteger(req.body.serviceId);
  const bookingDate = req.body.bookingDate;
  const today = getLocalDateString();

  if (!petId || !serviceId || !isValidBookingDate(bookingDate, today)) {
    req.flash('error', BOOKING_VALIDATION_ERROR);
    return res.redirect('/services');
  }

  serviceBookingModel.createPendingBooking(
    req.session.user.id,
    petId,
    serviceId,
    bookingDate,
    (error, booking) => {
      if (error) {
        console.error('Error creating service booking:', error);
        req.flash('error', BOOKING_DATABASE_ERROR);
        return res.redirect(`/services?petId=${encodeURIComponent(String(petId))}`);
      }

      if (!booking) {
        req.flash('error', BOOKING_UNAVAILABLE_ERROR);
        return res.redirect('/services');
      }

      req.flash('success', BOOKING_SUCCESS);
      return res.redirect('/bookings');
    }
  );
}

function listBookings(req, res) {
  serviceBookingModel.getBookingsByOwner(req.session.user.id, (error, bookings) => {
    if (error) {
      console.error('Error loading booking history:', error);
      return res.status(500).send('Unable to load booking history.');
    }

    return res.render('bookings', {
      bookings,
      messages: req.flash('success'),
      errors: req.flash('error'),
      session: req.session
    });
  });
}

module.exports = { listServices, createBooking, listBookings };
