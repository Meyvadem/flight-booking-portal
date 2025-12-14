package com.merve.flight_booking.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "airlines")
public class Airline {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String code;
    private String name;
    private String country;

    public Long getId() { return id; }
    public String getCode() { return code; }
    public String getName() { return name; }
    public String getCountry() { return country; }
}

