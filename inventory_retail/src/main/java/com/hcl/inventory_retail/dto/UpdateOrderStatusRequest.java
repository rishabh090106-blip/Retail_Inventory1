package com.hcl.inventory_retail.dto;

import com.hcl.inventory_retail.entity.OrderStatus;
import jakarta.validation.constraints.NotNull;

public record UpdateOrderStatusRequest(@NotNull OrderStatus status) {
}