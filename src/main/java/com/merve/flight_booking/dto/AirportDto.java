package com.merve.flight_booking.dto;

public record AirportDto(
        Long id,
        String city,
        String code,
        String country,
        String name
) {}
