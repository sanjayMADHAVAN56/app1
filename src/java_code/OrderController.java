package com.outletgadget.controller;

import com.outletgadget.dto.ApiResponse;
import com.outletgadget.dto.OrderDTO;
import com.outletgadget.service.OrderService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/orders")
@CrossOrigin(origins = "*")
public class OrderController {

    private final OrderService orderService;

    @Autowired
    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    // POST /api/orders - Create or place an order
    @PostMapping
    public ResponseEntity<ApiResponse<OrderDTO>> placeOrder(
            @RequestHeader("Authorization") String token,
            @RequestBody OrderDTO orderDTO) {
        OrderDTO createdOrder = orderService.createOrder(token, orderDTO);
        return ResponseEntity.ok(new ApiResponse<>(true, "Order placed successfully", createdOrder));
    }

    // GET /api/orders - Get user order history
    @GetMapping
    public ResponseEntity<ApiResponse<List<OrderDTO>>> getUserOrders(@RequestHeader("Authorization") String token) {
        List<OrderDTO> orderHistory = orderService.getOrdersForUser(token);
        return ResponseEntity.ok(new ApiResponse<>(true, "Order history loaded successfully", orderHistory));
    }

    // GET /api/orders/{id} - Track specific order by order number or ID
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<OrderDTO>> getOrderById(
            @RequestHeader("Authorization") String token,
            @PathVariable Long id) {
        OrderDTO order = orderService.getOrderByIdAndUser(id, token);
        return ResponseEntity.ok(new ApiResponse<>(true, "Order tracking info retrieved", order));
    }
}
