package com.merve.flight_booking.service;

import com.merve.flight_booking.entity.AirlineFareType;
import com.merve.flight_booking.repository.AirlineFareTypeRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class FareTypeService {

    private final AirlineFareTypeRepository repository;

    public FareTypeService(AirlineFareTypeRepository repository) {
        this.repository = repository;
    }

    public List<AirlineFareType> getFareTypesForAirline(Long airlineId) {
        return repository.findByAirline_Id(airlineId);
    }
}
