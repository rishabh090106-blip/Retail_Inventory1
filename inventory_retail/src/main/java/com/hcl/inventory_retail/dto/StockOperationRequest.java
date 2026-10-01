package com.hcl.inventory_retail.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record StockOperationRequest(@NotNull Long productId,
                                    @NotNull Long warehouseId,
                                    @Positive int quantity) {
}