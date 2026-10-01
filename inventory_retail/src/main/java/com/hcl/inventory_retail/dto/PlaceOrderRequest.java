package com.hcl.inventory_retail.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record PlaceOrderRequest(@NotBlank String customerName,
                                @NotNull Long productId,
                                @NotNull Long warehouseId,
                                @Positive int quantity) {
}