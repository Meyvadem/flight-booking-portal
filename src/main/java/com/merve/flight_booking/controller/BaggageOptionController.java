package com.merve.flight_booking.controller;

import com.merve.flight_booking.entity.BaggageOption;
import com.merve.flight_booking.repository.BaggageOptionRepository;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/baggage-options")
public class BaggageOptionController {

    private final BaggageOptionRepository repo;

    public BaggageOptionController(BaggageOptionRepository repo) {
        this.repo = repo;
    }

    @GetMapping
    public List<BaggageOption> getAll() {
        return repo.findAll();
    }
}
