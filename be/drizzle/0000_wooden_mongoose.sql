CREATE TABLE `categories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	CONSTRAINT `categories_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` int AUTO_INCREMENT NOT NULL,
	`category_id` int,
	`sku` varchar(50) NOT NULL,
	`name` varchar(255) NOT NULL,
	`stock` int NOT NULL DEFAULT 0,
	`min_stock` int NOT NULL DEFAULT 5,
	`buy_price` decimal(12,2) NOT NULL,
	`sell_price` decimal(12,2) NOT NULL,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `products_id` PRIMARY KEY(`id`),
	CONSTRAINT `products_sku_unique` UNIQUE(`sku`)
);
--> statement-breakpoint
CREATE TABLE `stock_tx_details` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tx_id` int,
	`product_id` int,
	`quantity` int NOT NULL,
	`unit_price` decimal(12,2) NOT NULL,
	CONSTRAINT `stock_tx_details_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `stock_txs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int,
	`tx_code` varchar(100) NOT NULL,
	`type` enum('IN','OUT','ADJUSTMENT') NOT NULL,
	`notes` varchar(255),
	`tx_date` timestamp DEFAULT (now()),
	CONSTRAINT `stock_txs_id` PRIMARY KEY(`id`),
	CONSTRAINT `stock_txs_tx_code_unique` UNIQUE(`tx_code`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`email` varchar(150) NOT NULL,
	`password` varchar(255) NOT NULL,
	`role` enum('ADMIN','STAFF') NOT NULL DEFAULT 'STAFF',
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
ALTER TABLE `products` ADD CONSTRAINT `products_category_id_categories_id_fk` FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `stock_tx_details` ADD CONSTRAINT `stock_tx_details_tx_id_stock_txs_id_fk` FOREIGN KEY (`tx_id`) REFERENCES `stock_txs`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `stock_tx_details` ADD CONSTRAINT `stock_tx_details_product_id_products_id_fk` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `stock_txs` ADD CONSTRAINT `stock_txs_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;