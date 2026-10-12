CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`masterKey` text NOT NULL,
	`authKey` text,
	`bio` text DEFAULT 'No bio yet' NOT NULL
);
