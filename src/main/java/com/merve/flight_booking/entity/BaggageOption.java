package com.merve.flight_booking.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "baggage_options")
public class BaggageOption {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private int weightKg;
    private double price;

    // getters & setters
}
