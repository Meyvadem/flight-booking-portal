package com.merve.flight_booking.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "fare_types")
public class FareType {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name; // LIGHT, ECO, PLUS

    private int includedBaggageKg;

    private double extraPrice;

    // getters & setters
}
