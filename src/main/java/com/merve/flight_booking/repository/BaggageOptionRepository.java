package com.merve.flight_booking.repository;

import com.merve.flight_booking.entity.BaggageOption;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BaggageOptionRepository
        extends JpaRepository<BaggageOption, Long> {}

