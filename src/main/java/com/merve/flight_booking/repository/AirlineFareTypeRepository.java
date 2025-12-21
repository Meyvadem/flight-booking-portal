package com.merve.flight_booking.repository;

import com.merve.flight_booking.entity.AirlineFareType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AirlineFareTypeRepository
        extends JpaRepository<AirlineFareType, Long> {

    List<AirlineFareType> findByAirline_Id(Long airlineId);

    boolean existsByAirline_IdAndFareType_Id(Long airlineId, Long fareTypeId);
}
