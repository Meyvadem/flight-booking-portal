package com.merve.flight_booking.repository;
import com.merve.flight_booking.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PaymentRepository extends JpaRepository<Payment, Long> {
    boolean existsByBookingId(Long bookingId);
}