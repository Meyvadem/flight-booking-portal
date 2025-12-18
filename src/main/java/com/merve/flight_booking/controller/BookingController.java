package com.merve.flight_booking.controller;

import com.merve.flight_booking.dto.BookingRequest;
import com.merve.flight_booking.entity.Booking;
import com.merve.flight_booking.service.BookingService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/bookings")
public class BookingController {

    private final BookingService bookingService;

    public BookingController(BookingService bookingService) {
        this.bookingService = bookingService;
    }

    @PostMapping
    public Booking createBooking(@RequestBody BookingRequest request) {
        return bookingService.createBooking(request);
    }
}


