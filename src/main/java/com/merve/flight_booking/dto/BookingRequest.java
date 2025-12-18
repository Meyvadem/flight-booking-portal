package com.merve.flight_booking.dto;

public class BookingRequest {

    private Long flightId;
    private Long airlineFareTypeId;
    private int extraBaggageKg; // şimdilik 0 gelecek

    public Long getFlightId() {
        return flightId;
    }

    public void setFlightId(Long flightId) {
        this.flightId = flightId;
    }

    public Long getAirlineFareTypeId() {
        return airlineFareTypeId;
    }

    public void setAirlineFareTypeId(Long airlineFareTypeId) {
        this.airlineFareTypeId = airlineFareTypeId;
    }

    public int getExtraBaggageKg() {
        return extraBaggageKg;
    }

    public void setExtraBaggageKg(int extraBaggageKg) {
        this.extraBaggageKg = extraBaggageKg;
    }
}
