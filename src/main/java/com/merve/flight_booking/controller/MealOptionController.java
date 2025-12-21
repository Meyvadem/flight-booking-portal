package com.merve.flight_booking.controller;

import com.merve.flight_booking.entity.MealOption;
import com.merve.flight_booking.repository.MealOptionRepository;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/meal-options")
public class MealOptionController {

    private final MealOptionRepository repo;

    public MealOptionController(MealOptionRepository repo) {
        this.repo = repo;
    }

    @GetMapping
    public List<MealOption> getAll() {
        return repo.findAll();
    }
}
