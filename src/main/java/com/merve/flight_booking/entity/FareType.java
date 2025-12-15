package com.merve.flight_booking.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "fare_types")
public class FareType {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name; // LIGHT, ECO, PLUS

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }
}
