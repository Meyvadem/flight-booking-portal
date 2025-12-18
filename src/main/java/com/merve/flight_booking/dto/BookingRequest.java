package com.merve.flight_booking.dto;

public class BookingRequest {

    private Long flightId;
    private Long airlineFareTypeId;


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

}
