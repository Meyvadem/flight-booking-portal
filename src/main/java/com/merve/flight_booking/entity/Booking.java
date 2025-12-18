package com.merve.flight_booking.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "bookings")
public class Booking {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // ---------------- CORE RELATIONS ----------------

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne
    @JoinColumn(name = "flight_id", nullable = false)
    private Flight flight;

    @ManyToOne
    @JoinColumn(name = "airline_fare_type_id", nullable = false)
    private AirlineFareType airlineFareType;

    // ---------------- ANCILLARIES ----------------

    @OneToOne(mappedBy = "booking", cascade = CascadeType.ALL, orphanRemoval = true)
    private BookingBaggage baggage;

    @OneToOne(mappedBy = "booking", cascade = CascadeType.ALL, orphanRemoval = true)
    private BookingMeal meal;

    @OneToOne(mappedBy = "booking", cascade = CascadeType.ALL, orphanRemoval = true)
    private BookingSeat seat;

    // ---------------- BOOKING INFO ----------------

    private double totalPrice;

    @Enumerated(EnumType.STRING)
    private BookingStatus status;

    private LocalDateTime bookingDate = LocalDateTime.now();

    // ---------------- GETTERS / SETTERS ----------------

    public Long getId() {
        return id;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
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

    public double getTotalPrice() {
        return totalPrice;
    }

    public void setTotalPrice(double totalPrice) {
        this.totalPrice = totalPrice;
    }

    public BookingStatus getStatus() {
        return status;
    }

    public void setStatus(BookingStatus status) {
        this.status = status;
    }

    public LocalDateTime getBookingDate() {
        return bookingDate;
    }
}
