package com.merve.flight_booking.service;

import com.merve.flight_booking.entity.Booking;
import com.merve.flight_booking.entity.BookingMeal;
import com.merve.flight_booking.entity.BookingStatus;
import com.merve.flight_booking.entity.MealOption;
import com.merve.flight_booking.repository.BookingMealRepository;
import com.merve.flight_booking.repository.BookingRepository;
import com.merve.flight_booking.repository.MealOptionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class BookingMealService {

    private final BookingRepository bookingRepository;
    private final BookingMealRepository bookingMealRepository;
    private final MealOptionRepository mealOptionRepository;
    private final BookingService bookingService;

    public BookingMealService(
            BookingRepository bookingRepository,
            BookingMealRepository bookingMealRepository,
            MealOptionRepository mealOptionRepository,
            BookingService bookingService
    ) {
        this.bookingRepository = bookingRepository;
        this.bookingMealRepository = bookingMealRepository;
        this.mealOptionRepository = mealOptionRepository;
        this.bookingService = bookingService;
    }

    @Transactional
    public void selectMeal(Long bookingId, Long optionId) {

        Booking booking = bookingRepository.findById(bookingId).orElseThrow();
        MealOption option = mealOptionRepository.findById(optionId).orElseThrow();

        if (booking.getStatus() == BookingStatus.CONFIRMED) {
            throw new RuntimeException("Confirmed booking cannot be modified");
        }
        BookingMeal meal =
                bookingMealRepository.findByBookingId(bookingId)
                        .orElse(new BookingMeal());

        meal.setBooking(booking);
        meal.setMealOption(option);
        meal.setPrice(option.getPrice());

        bookingMealRepository.save(meal);

        bookingService.recalcTotal(bookingId);
    }
}

