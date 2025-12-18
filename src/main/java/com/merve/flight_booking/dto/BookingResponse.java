package com.merve.flight_booking.dto;

import com.merve.flight_booking.entity.*;

public class BookingResponse {

    private Long id;
    private String status;
    private double totalPrice;
    private String bookingDate;

    private Flight flight;
    private AirlineFareType airlineFareType;

    private BookingBaggage baggage;
    private BookingMeal meal;
    private BookingSeat seat;

    // getters / setters

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public double getTotalPrice() {
        return totalPrice;
    }

    public void setTotalPrice(double totalPrice) {
        this.totalPrice = totalPrice;
    }

    public String getBookingDate() {
        return bookingDate;
    }

    public void setBookingDate(String bookingDate) {
        this.bookingDate = bookingDate;
    }

    public Flight getFlight() {
        return flight;
    }

    public void setFlight(Flight flight) {
        this.flight = flight;
    }

    public AirlineFareType getAirlineFareType() {
        return airlineFareType;
    }

    public void setAirlineFareType(AirlineFareType airlineFareType) {
        this.airlineFareType = airlineFareType;
    }

    public BookingBaggage getBaggage() {
        return baggage;
    }

    public void setBaggage(BookingBaggage baggage) {
        this.baggage = baggage;
    }

    public BookingMeal getMeal() {
        return meal;
    }

    public void setMeal(BookingMeal meal) {
        this.meal = meal;
    }

    public BookingSeat getSeat() {
        return seat;
    }

    public void setSeat(BookingSeat seat) {
        this.seat = seat;
    }
}