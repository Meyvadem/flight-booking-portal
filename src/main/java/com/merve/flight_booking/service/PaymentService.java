package com.merve.flight_booking.service;

import com.merve.flight_booking.dto.PaymentResponseDTO;
import com.merve.flight_booking.entity.Booking;
import com.merve.flight_booking.entity.BookingStatus;
import com.merve.flight_booking.entity.Payment;
import com.merve.flight_booking.entity.PaymentStatus;
import com.merve.flight_booking.repository.BookingRepository;
import com.merve.flight_booking.repository.PaymentRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PaymentService {

    private final BookingRepository bookingRepository;
    private final PaymentRepository paymentRepository;

    public PaymentService(BookingRepository bookingRepository,
                          PaymentRepository paymentRepository) {
        this.bookingRepository = bookingRepository;
        this.paymentRepository = paymentRepository;
    }

    @Transactional
    public PaymentResponseDTO pay(Long bookingId) {

        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));

        if (booking.getStatus() != BookingStatus.PENDING) {
            throw new RuntimeException("Booking already paid");
        }

        if (paymentRepository.existsByBookingId(bookingId)) {
            throw new RuntimeException("Payment already exists");
        }

        Payment payment = new Payment();
        payment.setBooking(booking);
        payment.setAmount(booking.getTotalPrice());
        payment.setPaymentStatus(PaymentStatus.SUCCESS);

        booking.setStatus(BookingStatus.CONFIRMED);

        bookingRepository.save(booking);
        paymentRepository.save(payment);

        // 🎯 DTO map
        PaymentResponseDTO dto = new PaymentResponseDTO();
        dto.setPaymentId(payment.getId());
        dto.setAmount(payment.getAmount());
        dto.setStatus(payment.getPaymentStatus().name());
        dto.setPaymentDate(payment.getPaymentDate().toString());
        dto.setBookingId(booking.getId());
        dto.setBookingStatus(booking.getStatus().name());

        return dto;
    }

}
