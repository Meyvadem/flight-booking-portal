package com.merve.flight_booking.repository;

import com.merve.flight_booking.entity.SeatOption;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SeatOptionRepository
        extends JpaRepository<SeatOption, Long> {}
