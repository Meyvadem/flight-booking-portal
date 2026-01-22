package com.merve.flight_booking.security;

import java.util.Arrays;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.provisioning.InMemoryUserDetailsManager;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

@Configuration
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;

    public SecurityConfig(JwtAuthFilter jwtAuthFilter) {
        this.jwtAuthFilter = jwtAuthFilter;
    }

    // AWS EC2 üzerinde export ADMIN_PASSWORD="..."
    private String env(String key, String def) {
        String v = System.getenv(key);
        return (v == null || v.isBlank()) ? def : v;
    }


    @Bean("adminUsers")
    public UserDetailsService adminUsers(PasswordEncoder encoder) {
        String adminUser = env("ADMIN_USERNAME", "admin");
        String adminPass = env("ADMIN_PASSWORD", "ChangeMeAdminPassword!");

        return new InMemoryUserDetailsManager(
                User.withUsername(adminUser)
                        .password(encoder.encode(adminPass))
                        .roles("ADMIN")
                        .build()
        );
    }

    // CORS config
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        // Örn: export FRONTEND_ORIGIN="http://ec2-54-226-202-155.compute-1.amazonaws.com:3000"
        String feOrigin = env("FRONTEND_ORIGIN", "").trim();

        CorsConfiguration configuration = new CorsConfiguration();

        // Local + (varsa) prod origin
        if (feOrigin.isBlank()) {
            configuration.setAllowedOrigins(Arrays.asList(
                    "http://localhost:3000",
                    "http://localhost:5173"
            ));
        } else {
            configuration.setAllowedOrigins(Arrays.asList(
                    "http://localhost:3000",
                    "http://localhost:5173",
                    feOrigin
            ));
        }

        configuration.setAllowedMethods(Arrays.asList(
                "GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"
        ));

        // '*' + credentials bazen sorun çıkarabiliyor; en güvenlisi header listesini açık vermek
        configuration.setAllowedHeaders(Arrays.asList(
                "Authorization",
                "Content-Type",
                "Accept",
                "Origin",
                "X-Requested-With"
        ));

        // İstersen response header’larını da expose edebilirsin
        configuration.setExposedHeaders(Arrays.asList(
                "Authorization"
        ));

        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }


    // /admin/** -> session + form login
    @Bean
    @Order(1)
    public SecurityFilterChain adminChain(
            HttpSecurity http,
            @Qualifier("adminUsers") UserDetailsService adminUsers
    ) throws Exception {

        return http
                .securityMatcher("/admin/**")
                .csrf(csrf -> csrf.disable())
                .userDetailsService(adminUsers)
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/admin/login").permitAll()
                        .anyRequest().hasRole("ADMIN")
                )
                .formLogin(form -> form
                        .loginPage("/admin/login")
                        .loginProcessingUrl("/admin/login")
                        .defaultSuccessUrl("/admin", true)
                        .permitAll()
                )
                .logout(logout -> logout
                        .logoutUrl("/admin/logout")
                        .logoutSuccessUrl("/admin/login?logout")
                )
                .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED))
                .build();
    }

    // /api/** -> stateless + JWT
    @Bean
    @Order(2)
    public SecurityFilterChain apiChain(HttpSecurity http) throws Exception {
        return http
                .securityMatcher("/api/**")
                .cors(cors -> cors.configurationSource(corsConfigurationSource())) // ✅ EKLENDI
                .csrf(csrf -> csrf.disable())
                .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(HttpMethod.GET,
                                "/api/baggage-options",
                                "/api/meal-options",
                                "/api/seat-options"
                        ).permitAll()
                        .requestMatchers(
                                "/api/auth/**",
                                "/api/flights/**",
                                "/api/airports/**",
                                "/error"
                        ).permitAll()
                        .anyRequest().authenticated()
                )
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class)
                .build();
    }

    // SPA / React routes -> permitAll
    @Bean
    @Order(3)
    public SecurityFilterChain spaChain(HttpSecurity http) throws Exception {
        return http
                .csrf(csrf -> csrf.disable())
                .authorizeHttpRequests(auth -> auth.anyRequest().permitAll())
                .build();
    }
}
