package com.merve.flight_booking.dto;

import java.util.List;

public class RoundTripFlightResponse {

    private List<FlightSearchResponse> outboundFlights;
    private List<FlightSearchResponse> returnFlights;

    public List<FlightSearchResponse> getOutboundFlights() {
        return outboundFlights;
    }

    public void setOutboundFlights(List<FlightSearchResponse> outboundFlights) {
        this.outboundFlights = outboundFlights;
    }

    public List<FlightSearchResponse> getReturnFlights() {
        return returnFlights;
    }

    public void setReturnFlights(List<FlightSearchResponse> returnFlights) {
        this.returnFlights = returnFlights;
    }
}
