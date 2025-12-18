package com.merve.flight_booking.repository;

import com.merve.flight_booking.entity.BookingBaggage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface BookingBaggageRepository
        extends JpaRepository<BookingBaggage, Long> {

    Optional<BookingBaggage> findByBookingId(Long bookingId);
}

