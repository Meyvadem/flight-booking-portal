package com.merve.flight_booking.service;

import com.merve.flight_booking.entity.BaggageOption;
import com.merve.flight_booking.entity.Booking;
import com.merve.flight_booking.entity.BookingBaggage;
import com.merve.flight_booking.entity.BookingStatus;
import com.merve.flight_booking.repository.BaggageOptionRepository;
import com.merve.flight_booking.repository.BookingBaggageRepository;
import com.merve.flight_booking.repository.BookingRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class BookingBaggageService {

    private final BookingRepository bookingRepository;
    private final BookingBaggageRepository bookingBaggageRepository;
    private final BaggageOptionRepository baggageOptionRepository;
    private final BookingService bookingService;

    public BookingBaggageService(
            BookingRepository bookingRepository,
            BookingBaggageRepository bookingBaggageRepository,
            BaggageOptionRepository baggageOptionRepository,
            BookingService bookingService
    ) {
        this.bookingRepository = bookingRepository;
        this.bookingBaggageRepository = bookingBaggageRepository;
        this.baggageOptionRepository = baggageOptionRepository;
        this.bookingService = bookingService;
    }

    @Transactional
    public void selectBaggage(Long bookingId, Long optionId) {

        Booking booking = bookingRepository.findById(bookingId).orElseThrow();
        BaggageOption option = baggageOptionRepository.findById(optionId).orElseThrow();

        if (booking.getStatus() == BookingStatus.CONFIRMED) {
            throw new RuntimeException("Confirmed booking cannot be modified");
        }

        BookingBaggage baggage =
                bookingBaggageRepository.findByBookingId(bookingId)
                        .orElse(new BookingBaggage());

        baggage.setBooking(booking);
        baggage.setBaggageOption(option);
        baggage.setPrice(option.getPrice());

        bookingBaggageRepository.save(baggage);

        bookingService.recalcTotal(bookingId);
    }
}

