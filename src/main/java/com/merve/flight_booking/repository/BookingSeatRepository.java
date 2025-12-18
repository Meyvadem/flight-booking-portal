package com.merve.flight_booking.repository;

import com.merve.flight_booking.entity.BookingSeat;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface BookingSeatRepository
        extends JpaRepository<BookingSeat, Long> {

    Optional<BookingSeat> findByBookingId(Long bookingId);
}
