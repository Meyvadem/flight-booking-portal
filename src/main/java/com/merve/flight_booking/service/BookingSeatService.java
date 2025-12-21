package com.merve.flight_booking.service;

import com.merve.flight_booking.entity.*;
import com.merve.flight_booking.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class BookingSeatService {

    private final BookingRepository bookingRepository;
    private final BookingSeatRepository bookingSeatRepository;
    private final SeatOptionRepository seatOptionRepository;
    private final BookingService bookingService;

    public BookingSeatService(
            BookingRepository bookingRepository,
            BookingSeatRepository bookingSeatRepository,
            SeatOptionRepository seatOptionRepository,
            BookingService bookingService
    ) {
        this.bookingRepository = bookingRepository;
        this.bookingSeatRepository = bookingSeatRepository;
        this.seatOptionRepository = seatOptionRepository;
        this.bookingService = bookingService;
    }

    /**
     * Seat selection
     * - Seat number opsiyonel (kontrolsüz)
     * - Aynı booking için tek seat
     */
    @Transactional
    public void selectSeat(Long bookingId, Long seatOptionId, String seatNumber) {

        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow();

        if (booking.getStatus() == BookingStatus.CONFIRMED) {
            throw new RuntimeException("Confirmed booking cannot be modified");
        }

        // ✅ seatNumber opsiyonel: null/blank ise null yap
        String normalizedSeatNumber = null;
        if (seatNumber != null && !seatNumber.isBlank()) {
            normalizedSeatNumber = seatNumber.trim();
        }

        SeatOption option = seatOptionRepository.findById(seatOptionId)
                .orElseThrow();

        BookingSeat seat = bookingSeatRepository
                .findByBookingId(bookingId)
                .orElse(new BookingSeat());

        seat.setBooking(booking);
        seat.setSeatOption(option);

        // ✅ null olabilir
        seat.setSeatNumber(normalizedSeatNumber);

        seat.setPrice(option.getPrice());

        bookingSeatRepository.save(seat);

        bookingService.recalcTotal(bookingId);
    }
}
