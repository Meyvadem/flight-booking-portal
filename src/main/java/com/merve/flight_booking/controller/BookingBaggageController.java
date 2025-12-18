package com.merve.flight_booking.controller;

import com.merve.flight_booking.dto.SelectOptionRequest;
import com.merve.flight_booking.service.BookingBaggageService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/bookings")
public class BookingBaggageController {

    private final BookingBaggageService bookingBaggageService;

    public BookingBaggageController(BookingBaggageService bookingBaggageService) {
        this.bookingBaggageService = bookingBaggageService;
    }

    @PutMapping("/{id}/baggage")
    public void selectBaggage(
            @PathVariable Long id,
            @RequestBody SelectOptionRequest request
    ) {
        bookingBaggageService.selectBaggage(id, request.getOptionId());
    }
}
