package com.merve.flight_booking.service;

import com.merve.flight_booking.dto.BookingRequest;
import com.merve.flight_booking.entity.*;
import com.merve.flight_booking.repository.*;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

@Service
public class BookingService {

    private final BookingRepository bookingRepository;
    private final UserRepository userRepository;
    private final FlightRepository flightRepository;
    private final AirlineFareTypeRepository airlineFareTypeRepository;

    public BookingService(
            BookingRepository bookingRepository,
            UserRepository userRepository,
            FlightRepository flightRepository,
            AirlineFareTypeRepository airlineFareTypeRepository
    ) {
        this.bookingRepository = bookingRepository;
        this.userRepository = userRepository;
        this.flightRepository = flightRepository;
        this.airlineFareTypeRepository = airlineFareTypeRepository;
    }

    public Booking createBooking(BookingRequest req) {

        String email = SecurityContextHolder.getContext()
                .getAuthentication()
                .getName();

        User user = userRepository.findByEmail(email)
                .orElseThrow();

        Flight flight = flightRepository.findById(req.getFlightId())
                .orElseThrow();

        AirlineFareType aft = airlineFareTypeRepository
                .findById(req.getAirlineFareTypeId())
                .orElseThrow();

        Booking booking = new Booking();
        booking.setUser(user);
        booking.setFlight(flight);
        booking.setAirlineFareType(aft);
        booking.setExtraBaggageKg(req.getExtraBaggageKg()); // şimdilik 0
        booking.setStatus(BookingStatus.PENDING);

        double totalPrice =
                flight.getBasePrice()
                        + aft.getExtraPrice();

        booking.setTotalPrice(totalPrice);

        return bookingRepository.save(booking);
    }
}
