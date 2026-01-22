package com.merve.flight_booking.controller;

import com.merve.flight_booking.dto.FlightSearchResponse;
import com.merve.flight_booking.dto.RoundTripFlightResponse;
import com.merve.flight_booking.service.FlightService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/flights")
public class FlightController {

    private final FlightService flightService;

    public FlightController(FlightService flightService) {
        this.flightService = flightService;
    }

    @GetMapping("/search")
    public RoundTripFlightResponse searchFlights(
            @RequestParam String from,
            @RequestParam String to,
            @RequestParam
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate departureDate,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate returnDate
    ) {
        return flightService.searchFlights(from, to, departureDate, returnDate);
    }

}
