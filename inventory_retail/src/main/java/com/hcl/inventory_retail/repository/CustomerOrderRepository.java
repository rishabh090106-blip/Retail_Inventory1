package com.hcl.inventory_retail.repository;

import com.hcl.inventory_retail.entity.CustomerOrder;
import com.hcl.inventory_retail.entity.OrderStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CustomerOrderRepository extends JpaRepository<CustomerOrder, Long> {
    List<CustomerOrder> findByStatus(OrderStatus status);
}