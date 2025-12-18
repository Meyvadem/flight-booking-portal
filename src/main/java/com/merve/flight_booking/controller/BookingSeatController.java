package com.merve.flight_booking.controller;

import com.merve.flight_booking.dto.SeatSelectRequest;
import com.merve.flight_booking.service.BookingSeatService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/bookings")
public class BookingSeatController {

    private final BookingSeatService bookingSeatService;

    public BookingSeatController(BookingSeatService bookingSeatService) {
        this.bookingSeatService = bookingSeatService;
    }

    @PutMapping("/{id}/seat")
    public void selectSeat(
            @PathVariable Long id,
            @RequestBody SeatSelectRequest request
    ) {
        bookingSeatService.selectSeat(
                id,
                request.getOptionId(),
                request.getSeatNumber()
        );
    }
}
