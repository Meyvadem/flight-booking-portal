package com.merve.flight_booking.dto;

import java.time.LocalDateTime;

public class FlightSearchResponse {

    private Long flightId;
    private String flightNumber;

    private String airlineCode;
    private String airlineName;

    private String from;
    private String to;

    private LocalDateTime departureTime;
    private LocalDateTime arrivalTime;

    private double basePrice;

    // ===== GETTERS =====
    public Long getFlightId() {
        return flightId;
    }

    public String getFlightNumber() {
        return flightNumber;
    }

    public String getAirlineCode() {
        return airlineCode;
    }

    public String getAirlineName() {
        return airlineName;
    }

    public String getFrom() {
        return from;
    }

    public String getTo() {
        return to;
    }

    public LocalDateTime getDepartureTime() {
        return departureTime;
    }

    public LocalDateTime getArrivalTime() {
        return arrivalTime;
    }

    public double getBasePrice() {
        return basePrice;
    }

    // ===== SETTERS =====
    public void setFlightId(Long flightId) {
        this.flightId = flightId;
    }

    public void setFlightNumber(String flightNumber) {
        this.flightNumber = flightNumber;
    }

    public void setAirlineCode(String airlineCode) {
        this.airlineCode = airlineCode;
    }

    public void setAirlineName(String airlineName) {
        this.airlineName = airlineName;
    }

    public void setFrom(String from) {
        this.from = from;
    }

    public void setTo(String to) {
        this.to = to;
    }

    public void setDepartureTime(LocalDateTime departureTime) {
        this.departureTime = departureTime;
    }

    public void setArrivalTime(LocalDateTime arrivalTime) {
        this.arrivalTime = arrivalTime;
    }

    public void setBasePrice(double basePrice) {
        this.basePrice = basePrice;
    }
}
