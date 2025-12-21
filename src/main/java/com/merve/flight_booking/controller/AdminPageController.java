package com.merve.flight_booking.controller;

import java.time.ZonedDateTime;

import org.springframework.core.env.Environment;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class AdminPageController {

    private final Environment env;

    public AdminPageController(Environment env) {
        this.env = env;
    }

    @GetMapping("/admin")
    public String admin(Model model) {
        model.addAttribute("serverTime", ZonedDateTime.now().toString());

        String appName = env.getProperty("spring.application.name", "FlyAway");
        model.addAttribute("appName", appName);

        String[] profiles = env.getActiveProfiles();
        model.addAttribute("profile", profiles.length > 0 ? String.join(",", profiles) : "default");

        return "admin"; // templates/admin.html
    }

    @GetMapping("/admin/login")
    public String adminLogin() {
        return "admin-login";
    }
}
