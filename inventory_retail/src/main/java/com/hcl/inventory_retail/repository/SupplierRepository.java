package com.hcl.inventory_retail.repository;

import com.hcl.inventory_retail.entity.Supplier;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SupplierRepository extends JpaRepository<Supplier, Long> {
}