package com.hcl.inventory_retail.controller;

import com.hcl.inventory_retail.dto.PlaceOrderRequest;
import com.hcl.inventory_retail.dto.UpdateOrderStatusRequest;
import com.hcl.inventory_retail.entity.CustomerOrder;
import com.hcl.inventory_retail.entity.OrderStatus;
import com.hcl.inventory_retail.service.OrderService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/orders")
public class OrderController {
    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    @PostMapping
    public ResponseEntity<CustomerOrder> placeOrder(@Valid @RequestBody PlaceOrderRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(orderService.placeOrder(request));
    }

    @GetMapping
    public List<CustomerOrder> findAll(@RequestParam(required = false) OrderStatus status) {
        return status == null ? orderService.findAll() : orderService.findByStatus(status);
    }

    @GetMapping("/{id}")
    public CustomerOrder findById(@PathVariable Long id) {
        return orderService.findById(id);
    }
    @PutMapping("/{id}/status")
    public CustomerOrder updateStatus(@PathVariable Long id,
                                  @Valid @RequestBody UpdateOrderStatusRequest request) {
        return orderService.updateStatus(id, request.status());
    }

    @PostMapping("/{id}/cancel")
    public CustomerOrder cancel(@PathVariable Long id) {
        return orderService.cancel(id);
    }
}