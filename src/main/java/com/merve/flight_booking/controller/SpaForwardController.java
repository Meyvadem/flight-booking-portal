package com.merve.flight_booking.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
public class SpaForwardController {

    // /api/** ve /admin/** hariç her route'u index.html'e forward et
    @RequestMapping(value = {
            "/{path:^(?!api|admin).*$}",
            "/**/{path:^(?!api|admin).*$}"
    })
    public String forward() {
        return "forward:/index.html";
    }
}
