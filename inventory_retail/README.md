# Retail Inventory Management API

Spring Boot REST backend for product catalog, supplier, warehouse inventory, order fulfillment, and stock management.

## Requirements and setup

- Java 17 or newer
- MySQL 8 or newer, running locally

Create a MySQL account or update `src/main/resources/application.properties` with your credentials. The default configuration connects as `root` with password `your_password` and creates `inventory_retail_db` if needed. Keep real credentials out of source control; override the password with `SPRING_DATASOURCE_PASSWORD` in other environments.

Start the application from the project root:

```powershell
.\mvnw.cmd spring-boot:run
```

The API listens on `http://localhost:8080`. Hibernate updates the schema automatically, and the first startup seeds sample suppliers, products, a warehouse, and inventory if the tables are empty.

## API endpoints

All request and response bodies use JSON. Product creation and updates accept a `supplier` object containing its `id`.

| Method | Path | Description |
| --- | --- | --- |
| GET | `/api/suppliers` | List suppliers |
| GET | `/api/suppliers/{id}` | Get a supplier |
| POST | `/api/suppliers` | Create a supplier |
| PUT | `/api/suppliers/{id}` | Update a supplier |
| DELETE | `/api/suppliers/{id}` | Delete a supplier |
| GET | `/api/products` | List products; optional `category` or `sku` query filter |
| GET | `/api/products/{id}` | Get a product |
| POST | `/api/products` | Create a product |
| PUT | `/api/products/{id}` | Update a product |
| DELETE | `/api/products/{id}` | Delete a product |
| GET | `/api/warehouses` | List warehouses |
| GET | `/api/warehouses/{id}` | Get a warehouse |
| POST | `/api/warehouses` | Create a warehouse |
| PUT | `/api/warehouses/{id}` | Update a warehouse |
| DELETE | `/api/warehouses/{id}` | Delete a warehouse |
| POST | `/api/inventory/add` | Add stock (`productId`, `warehouseId`, `quantity`) |
| POST | `/api/inventory/reduce` | Reduce stock (`productId`, `warehouseId`, `quantity`) |
| POST | `/api/inventory/transfer` | Transfer stock (`productId`, `sourceWarehouseId`, `destinationWarehouseId`, `quantity`) |
| GET | `/api/inventory/low-stock` | List items below their product reorder level |
| GET | `/api/inventory/warehouse/{warehouseId}` | List inventory in a warehouse |
| POST | `/api/orders` | Place an order (`customerName`, `productId`, `warehouseId`, `quantity`) |
| GET | `/api/orders` | List orders; optional `status` filter |
| GET | `/api/orders/{id}` | Get an order |
| PUT | `/api/orders/{id}/status` | Set status (`PENDING`, `CONFIRMED`, `SHIPPED`, `DELIVERED`, `CANCELLED`) |
| POST | `/api/orders/{id}/cancel` | Cancel an order and restore its stock |

Create endpoints return `201 Created`; deletes return `204 No Content`. Validation errors return `400`, missing resources return `404`, and stock or uniqueness conflicts return `409`. CORS is enabled for `http://localhost:3000` and `http://localhost:4200`.