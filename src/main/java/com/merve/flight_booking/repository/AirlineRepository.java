package com.merve.flight_booking.repository;

import com.merve.flight_booking.entity.Airline;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AirlineRepository extends JpaRepository<Airline, Long> {}