package com.merve.flight_booking.controller;

import com.merve.flight_booking.dto.AirportDto;
import com.merve.flight_booking.service.AirportService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/airports")
@CrossOrigin(origins = "http://localhost:5173") // dev
public class AirportController {

    private final AirportService airportService;

    public AirportController(AirportService airportService) {
        this.airportService = airportService;
    }

    // Hepsini listele
    @GetMapping
    public List<AirportDto> list(@RequestParam(value = "q", required = false) String q) {
        // q verilirse search, verilmezse listAll
        if (q == null || q.isBlank()) return airportService.listAll();
        return airportService.search(q);
    }

    // From: kalkışı olan havalimanları
    @GetMapping("/from")
    public List<AirportDto> fromAirports() {
        return airportService.listFromAirports();
    }

    // To: seçilen fromId’ye göre gidilebilen havalimanları
    @GetMapping("/to")
    public List<AirportDto> toAirports(@RequestParam Long fromId) {
        return airportService.listToAirports(fromId);
    }
}
