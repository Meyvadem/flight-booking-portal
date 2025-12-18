package com.merve.flight_booking.repository;

import com.merve.flight_booking.entity.MealOption;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MealOptionRepository
        extends JpaRepository<MealOption, Long> {}
