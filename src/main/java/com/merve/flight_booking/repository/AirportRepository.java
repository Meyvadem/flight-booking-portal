package com.merve.flight_booking.repository;

import com.merve.flight_booking.entity.Airport;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AirportRepository extends JpaRepository<Airport, Long> {

    // ✅ Autocomplete için (senin mevcut methodun)
    List<Airport> findTop20ByCodeContainingIgnoreCaseOrCityContainingIgnoreCaseOrNameContainingIgnoreCase(
            String code, String city, String name
    );

    // ✅ Yeni ekleyeceğimiz: ID listesine göre airportları getirir
    List<Airport> findByIdIn(List<Long> ids);
}
