package com.merve.flight_booking.service;

import com.merve.flight_booking.dto.BookingRequest;
import com.merve.flight_booking.entity.*;
import com.merve.flight_booking.repository.*;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class BookingService {

    private final BookingRepository bookingRepository;
    private final BookingBaggageRepository bookingBaggageRepository;
    private final BookingMealRepository bookingMealRepository;
    private final BookingSeatRepository bookingSeatRepository;

    private final UserRepository userRepository;
    private final FlightRepository flightRepository;
    private final AirlineFareTypeRepository airlineFareTypeRepository;

    public BookingService(
            BookingRepository bookingRepository,
            BookingBaggageRepository bookingBaggageRepository,
            BookingMealRepository bookingMealRepository,
            BookingSeatRepository bookingSeatRepository,
            UserRepository userRepository,
            FlightRepository flightRepository,
            AirlineFareTypeRepository airlineFareTypeRepository
    ) {
        this.bookingRepository = bookingRepository;
        this.bookingBaggageRepository = bookingBaggageRepository;
        this.bookingMealRepository = bookingMealRepository;
        this.bookingSeatRepository = bookingSeatRepository;
        this.userRepository = userRepository;
        this.flightRepository = flightRepository;
        this.airlineFareTypeRepository = airlineFareTypeRepository;
    }

    /* ================= CREATE BOOKING ================= */

    public Booking createBooking(BookingRequest req) {
        String email = SecurityContextHolder.getContext()
                .getAuthentication()
                .getName();

        User user = userRepository.findByEmail(email).orElseThrow();

        Flight flight = flightRepository.findById(req.getFlightId()).orElseThrow();
        AirlineFareType aft = airlineFareTypeRepository.findById(req.getAirlineFareTypeId()).orElseThrow();

        Booking booking = new Booking();
        booking.setUser(user);
        booking.setFlight(flight);
        booking.setAirlineFareType(aft);
        booking.setStatus(BookingStatus.PENDING);

        booking.setTotalPrice(
                flight.getBasePrice() + aft.getExtraPrice()
        );

        return bookingRepository.save(booking);
    }

    /* ================= TOTAL CALCULATION ================= */

    public void recalcTotal(Long bookingId) {

        Booking booking = bookingRepository.findById(bookingId).orElseThrow();

        double total =
                booking.getFlight().getBasePrice()
                        + booking.getAirlineFareType().getExtraPrice();

        BookingBaggage baggage =
                bookingBaggageRepository.findByBookingId(bookingId).orElse(null);
        if (baggage != null) {
            total += baggage.getPrice();
        }

        BookingMeal meal =
                bookingMealRepository.findByBookingId(bookingId).orElse(null);
        if (meal != null) {
            total += meal.getPrice();
        }

        BookingSeat seat =
                bookingSeatRepository.findByBookingId(bookingId).orElse(null);
        if (seat != null) {
            total += seat.getPrice();
        }

        booking.setTotalPrice(total);
        bookingRepository.save(booking);
    }

    public Booking getBookingDetail(Long bookingId) {
        return bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));
    }

    @Transactional
    public void cancelBooking(Long bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));

        String email = org.springframework.security.core.context.SecurityContextHolder
                .getContext().getAuthentication().getName();

        if (booking.getUser() == null || booking.getUser().getEmail() == null ||
                !booking.getUser().getEmail().equals(email)) {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.FORBIDDEN,
                    "You can only cancel your own booking"
            );
        }

        if (booking.getStatus() == BookingStatus.CONFIRMED) {
            throw new RuntimeException("Confirmed booking cannot be cancelled");
        }

        booking.setStatus(BookingStatus.CANCELLED);
        bookingRepository.save(booking);
    }

    public List<Booking> getMyBookings() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();

        if (email == null || email.isBlank()) {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.UNAUTHORIZED,
                    "Unauthorized"
            );
        }

        return bookingRepository.findByUser_EmailOrderByBookingDateDesc(email);
    }

}
