select * from products;

select * from productvariants;

show create table users;
show create table cartitems;
show create table carts;
show create table orders;

show create table addresses;
show create table categories;
show create table orderitems;
show create table products;
show create table productvariants;
show create table reviews;

CREATE TABLE `brands` (
   `id` int NOT NULL AUTO_INCREMENT,
   `name` varchar(100) NOT NULL,
   `description` text,
   `logo_url` varchar(255),
   `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
   `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
   PRIMARY KEY (`id`),
   UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


ALTER TABLE `products`
DROP COLUMN `brand`,
ADD COLUMN `brand_id` int,
ADD CONSTRAINT `fk_product_brand` FOREIGN KEY (`brand_id`) REFERENCES `brands` (`id`);



select * from products;