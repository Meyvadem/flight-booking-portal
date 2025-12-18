package com.merve.flight_booking.controller;

import com.merve.flight_booking.dto.SelectOptionRequest;
import com.merve.flight_booking.service.BookingMealService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/bookings")
public class BookingMealController {

    private final BookingMealService bookingMealService;

    public BookingMealController(BookingMealService bookingMealService) {
        this.bookingMealService = bookingMealService;
    }

    @PutMapping("/{id}/meal")
    public void selectMeal(
            @PathVariable Long id,
            @RequestBody SelectOptionRequest request
    ) {
        bookingMealService.selectMeal(id, request.getOptionId());
    }
}
