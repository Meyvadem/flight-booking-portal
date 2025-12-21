package com.merve.flight_booking.dto;

public class FareOptionResponse {

    private String fareType;          // LIGHT, ECO, PLUS
    private int includedBaggageKg;
    private double extraPrice;
    private double totalPrice;
    private Long airlineFareTypeId;

    public Long getAirlineFareTypeId() { return airlineFareTypeId; }
    public void setAirlineFareTypeId(Long airlineFareTypeId) { this.airlineFareTypeId = airlineFareTypeId; }


    public String getFareType() {
        return fareType;
    }

    public void setFareType(String fareType) {
        this.fareType = fareType;
    }

    public int getIncludedBaggageKg() {
        return includedBaggageKg;
    }

    public void setIncludedBaggageKg(int includedBaggageKg) {
        this.includedBaggageKg = includedBaggageKg;
    }

    public double getExtraPrice() {
        return extraPrice;
    }

    public void setExtraPrice(double extraPrice) {
        this.extraPrice = extraPrice;
    }

    public double getTotalPrice() {
        return totalPrice;
    }

    public void setTotalPrice(double totalPrice) {
        this.totalPrice = totalPrice;
    }
}
