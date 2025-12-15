package com.merve.flight_booking.entity;

import jakarta.persistence.*;

@Entity
@Table(
        name = "airline_fare_types",
        uniqueConstraints = {
                @UniqueConstraint(columnNames = {"airline_id", "fare_type_id"})
        }
)
public class AirlineFareType {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "airline_id", nullable = false)
    private Airline airline;

    @ManyToOne
    @JoinColumn(name = "fare_type_id", nullable = false)
    private FareType fareType;

    private double extraPrice;
    private int includedBaggageKg;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
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

    public FareType getFareType() {
        return fareType;
    }

    public void setFareType(FareType fareType) {
        this.fareType = fareType;
    }

    public Airline getAirline() {
        return airline;
    }

    public void setAirline(Airline airline) {
        this.airline = airline;
    }
}
