package com.merve.flight_booking.controller;

import com.merve.flight_booking.entity.SeatOption;
import com.merve.flight_booking.repository.SeatOptionRepository;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/seat-options")
public class SeatOptionController {

    private final SeatOptionRepository repo;

    public SeatOptionController(SeatOptionRepository repo) {
        this.repo = repo;
    }

    @GetMapping
    public List<SeatOption> getAll() {
        return repo.findAll();
    }
}
