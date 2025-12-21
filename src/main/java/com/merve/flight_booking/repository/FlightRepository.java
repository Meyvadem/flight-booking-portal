package com.merve.flight_booking.repository;

import com.merve.flight_booking.entity.Flight;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface FlightRepository extends JpaRepository<Flight, Long> {

    @Query("""
        SELECT f
        FROM Flight f
        WHERE f.departureAirport.code = :from
          AND f.arrivalAirport.code = :to
          AND f.departureTime >= :start
          AND f.departureTime < :end
    """)
    List<Flight> searchFlights(
            @Param("from") String from,
            @Param("to") String to,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end
    );


    @Query("select distinct f.departureAirport.id from Flight f where f.departureAirport is not null")
    List<Long> findDistinctDepartureAirportIds();


    @Query("select distinct f.arrivalAirport.id from Flight f where f.departureAirport.id = :fromId and f.arrivalAirport is not null")
    List<Long> findDistinctArrivalAirportIdsByDeparture(@Param("fromId") Long fromId);

    Optional<Flight> findByFlightNumber(String flightNumber);
    boolean existsByFlightNumber(String flightNumber);


}


