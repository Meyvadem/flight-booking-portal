package com.merve.flight_booking.controller;

import com.merve.flight_booking.dto.FareOptionResponse;
import com.merve.flight_booking.entity.AirlineFareType;
import com.merve.flight_booking.service.FareTypeService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/flights")
public class FareTypeController {

    private final FareTypeService fareTypeService;

    public FareTypeController(FareTypeService fareTypeService) {
        this.fareTypeService = fareTypeService;
    }

    @GetMapping("/{flightId}/fare-options")
    public List<FareOptionResponse> getFareOptions(
            @PathVariable Long flightId
    ) {
        return fareTypeService.getFareOptionsForFlight(flightId);
    }
}

