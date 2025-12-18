package com.merve.flight_booking.repository;

import com.merve.flight_booking.entity.BookingMeal;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface BookingMealRepository
        extends JpaRepository<BookingMeal, Long> {

    Optional<BookingMeal> findByBookingId(Long bookingId);
}

