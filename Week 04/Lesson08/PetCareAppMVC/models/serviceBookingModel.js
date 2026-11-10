const connection = require('../config/db');

function createPendingBooking(ownerId, petId, serviceId, bookingDate, callback) {
  connection.getConnection((connectionError, transactionConnection) => {
    if (connectionError) return callback(connectionError);

    let finished = false;
    const finish = (error, result) => {
      if (finished) return;
      finished = true;
      transactionConnection.release();
      callback(error, result);
    };

    transactionConnection.beginTransaction((beginError) => {
      if (beginError) return finish(beginError);

      const bookingSql = `
        INSERT INTO service_bookings
          (pet_id, service_id, booking_status, booked_price, booking_date)
        SELECT pets.id, services.id, 'pending', services.price, ?
        FROM pets
        JOIN services ON services.id = ?
        WHERE pets.id = ?
          AND pets.owner_id = ?
          AND services.is_active = 1
      `;

      transactionConnection.query(
        bookingSql,
        [bookingDate, serviceId, petId, ownerId],
        (bookingError, bookingResult) => {
          if (bookingError) return rollbackAndFinish(bookingError);
          if (bookingResult.affectedRows !== 1) {
            return rollbackAndFinish(null, null);
          }

          const bookingId = bookingResult.insertId;
          const paymentSql = `
            INSERT INTO payments (booking_id, amount, payment_status)
            SELECT id, booked_price, 'pending'
            FROM service_bookings
            WHERE id = ?
          `;

          transactionConnection.query(
            paymentSql,
            [bookingId],
            (paymentError, paymentResult) => {
              if (paymentError) return rollbackAndFinish(paymentError);
              if (paymentResult.affectedRows !== 1) {
                return rollbackAndFinish(
                  new Error('Pending payment insert did not create exactly one row.')
                );
              }

              const paymentId = paymentResult.insertId;
              transactionConnection.commit((commitError) => {
                if (commitError) return rollbackAndFinish(commitError);
                finish(null, { bookingId, paymentId });
              });
            }
          );
        }
      );
    });

    function rollbackAndFinish(error, result) {
      transactionConnection.rollback((rollbackError) => {
        if (rollbackError) {
          if (error) {
            error.rollbackError = rollbackError;
            return finish(error);
          }
          return finish(rollbackError);
        }
        finish(error, result);
      });
    }
  });
}

function getBookingsByOwner(ownerId, callback) {
  const sql = `
    SELECT
      service_bookings.id AS booking_id,
      DATE_FORMAT(service_bookings.booking_date, '%Y-%m-%d') AS booking_date,
      pets.name AS pet_name,
      services.name AS service_name,
      service_bookings.booked_price,
      service_bookings.booking_status,
      payments.payment_status
    FROM service_bookings
    JOIN pets ON pets.id = service_bookings.pet_id
    JOIN services ON services.id = service_bookings.service_id
    LEFT JOIN payments ON payments.booking_id = service_bookings.id
    WHERE pets.owner_id = ?
    ORDER BY service_bookings.created_at DESC, service_bookings.id DESC
  `;
  connection.query(sql, [ownerId], callback);
}

module.exports = {
  createPendingBooking,
  getBookingsByOwner
};
