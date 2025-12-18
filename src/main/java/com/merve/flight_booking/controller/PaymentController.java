package com.merve.flight_booking.controller;

import com.merve.flight_booking.dto.PaymentResponseDTO;
import com.merve.flight_booking.entity.Payment;
import com.merve.flight_booking.service.PaymentService;
import org.springframework.web.bind.annotation.*;


@RestController
@RequestMapping("/api/bookings")
public class PaymentController {

    private final PaymentService paymentService;

    public PaymentController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    @PostMapping("/{id}/pay")
    public PaymentResponseDTO pay(@PathVariable Long id) {
        return paymentService.pay(id);
    }
}
