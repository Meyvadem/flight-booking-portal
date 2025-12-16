package com.merve.flight_booking.service;

import com.merve.flight_booking.dto.FareOptionResponse;
import com.merve.flight_booking.entity.AirlineFareType;
import com.merve.flight_booking.entity.Flight;
import com.merve.flight_booking.repository.AirlineFareTypeRepository;
import com.merve.flight_booking.repository.FlightRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class FareTypeService {

    private final AirlineFareTypeRepository airlineFareTypeRepository;
    private final FlightRepository flightRepository;

    public FareTypeService(
            AirlineFareTypeRepository airlineFareTypeRepository,
            FlightRepository flightRepository
    ) {
        this.airlineFareTypeRepository = airlineFareTypeRepository;
        this.flightRepository = flightRepository;
    }

    public List<FareOptionResponse> getFareOptionsForFlight(Long flightId) {

        Flight flight = flightRepository.findById(flightId)
                .orElseThrow(() -> new RuntimeException("Flight not found"));

        double basePrice = flight.getBasePrice();
        Long airlineId = flight.getAirline().getId();

        List<AirlineFareType> fareTypes =
                airlineFareTypeRepository.findByAirline_Id(airlineId);

        return fareTypes.stream().map(af -> {
            FareOptionResponse dto = new FareOptionResponse();
            dto.setFareType(af.getFareType().getName());
            dto.setIncludedBaggageKg(af.getIncludedBaggageKg());
            dto.setExtraPrice(af.getExtraPrice());
            dto.setTotalPrice(basePrice + af.getExtraPrice());
            return dto;
        }).toList();
    }
}
