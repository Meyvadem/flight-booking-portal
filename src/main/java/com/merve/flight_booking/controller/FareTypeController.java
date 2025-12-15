package com.merve.flight_booking.controller;

import com.merve.flight_booking.entity.AirlineFareType;
import com.merve.flight_booking.service.FareTypeService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/fare-types")
public class FareTypeController {

    private final FareTypeService fareTypeService;

    public FareTypeController(FareTypeService fareTypeService) {
        this.fareTypeService = fareTypeService;
    }

    @GetMapping("/airline/{airlineId}")
    public List<AirlineFareType> getFareTypes(
            @PathVariable Long airlineId
    ) {
        return fareTypeService.getFareTypesForAirline(airlineId);
    }
}

