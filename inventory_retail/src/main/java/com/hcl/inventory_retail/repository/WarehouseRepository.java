package com.hcl.inventory_retail.repository;

import com.hcl.inventory_retail.entity.Warehouse;
import org.springframework.data.jpa.repository.JpaRepository;

public interface WarehouseRepository extends JpaRepository<Warehouse, Long> {
}