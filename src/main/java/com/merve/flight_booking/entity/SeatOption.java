package com.merve.flight_booking.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "seat_options")
public class SeatOption {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "seat_type")
    private String seatType;

    private double price;

    // getters & setters
    public Long getId() {
        return id;
    }

    public String getSeatType() {
        return seatType;
    }

    public void setSeatType(String seatType) {
        this.seatType = seatType;
    }

    public double getPrice() {
        return price;
    }

    public void setPrice(double price) {
        this.price = price;
    }
}
