package com.merve.flight_booking.repository;

import com.merve.flight_booking.entity.Airport;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AirportRepository extends JpaRepository<Airport, Long> {


    List<Airport> findTop20ByCodeContainingIgnoreCaseOrCityContainingIgnoreCaseOrNameContainingIgnoreCase(
            String code, String city, String name
    );

    List<Airport> findByIdIn(List<Long> ids);
}
