package com.hcl.inventory_retail.repository;

import com.hcl.inventory_retail.entity.Inventory;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface InventoryRepository extends JpaRepository<Inventory, Long> {
    Optional<Inventory> findByProductIdAndWarehouseId(Long productId, Long warehouseId);

    List<Inventory> findByWarehouseId(Long warehouseId);

    @Query("select inventory from Inventory inventory where inventory.quantity < inventory.product.reorderLevel")
    List<Inventory> findLowStockItems();

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select inventory from Inventory inventory where inventory.product.id = :productId and inventory.warehouse.id = :warehouseId")
    Optional<Inventory> findForUpdateByProductAndWarehouse(@Param("productId") Long productId,
                                                           @Param("warehouseId") Long warehouseId);
}