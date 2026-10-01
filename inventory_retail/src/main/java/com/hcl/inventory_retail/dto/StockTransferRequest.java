package com.hcl.inventory_retail.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record StockTransferRequest(@NotNull Long productId,
                                   @NotNull Long sourceWarehouseId,
                                   @NotNull Long destinationWarehouseId,
                                   @Positive int quantity) {
}