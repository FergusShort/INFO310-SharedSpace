-- Tweaked CHATGPT Generated example inserts / data from giving it
-- db_setup.sql file with prompt 'from this schema produce
-- insert statements that will fill all tables with "2 flats"' 

-- Insert Flats
INSERT INTO Flat (Flat_ID, GroupName) VALUES
('ABCD', '123 Main Street'),
('1', '123 Main Street'),
('WXYZ', '456 Oak Avenue');

-- Insert Events (DATETIME-based)
INSERT INTO Events (Flat_ID, Title, Description, Start_Time, End_Time) VALUES
('ABCD', 'Flat Party', 'Weekend party for all', '2025-05-24 18:00:00', '2025-05-24 23:00:00'),
('WXYZ', 'Cleaning Day', 'Flat cleaning and organization', '2025-05-15 09:00:00', '2025-05-15 12:00:00'),
('ABCD', 'Game Night', 'Board games and snacks!', '2025-05-17 19:00:00', '2025-05-17 22:00:00'),
('WXYZ', 'Roommate Meeting', 'Discuss bills and groceries', '2025-05-12 18:30:00', '2025-05-12 19:30:00'),
('ABCD', 'Movie Marathon', 'Lord of the Rings + Pizza', '2025-05-20 16:00:00', '2025-05-20 23:59:00');

-- Insert Bills
INSERT INTO Bills (Flat_ID, Initial_Amount, Amount_Left, Due_Date, Payment_Status, Title, Recurring, Time_period, Overdue, Description) VALUES
('ABCD', 200.00, 200.00, '2025-04-20',  'U', 'Electricity', TRUE, 30, TRUE, 'Monthly electricity bill'),
('ABCD', 100.00, 100.00, '2025-07-20', 'U', 'Flat Dinner', FALSE, NULL, FALSE, 'Flat Went out for Dinner'),
('ABCD', 50.00, 50.00, '2025-06-12', 'U', 'Fuel To CHCH', FALSE,NULL, FALSE, 'Drove to CHCH'),
('ABCD', 150.00, 150.00, '2025-04-22', 'U', 'Internet', FALSE, NULL, TRUE, 'Internet service provider bill');

-- Insert Groceries
INSERT INTO Groceries (Flat_ID, Item, Price, Quantity) VALUES
('ABCD', 'Milk', 3.50, 2),
('ABCD', 'Bread', 2.00, 1),
('WXYZ', 'Eggs', 4.00, 12),
('WXYZ', 'Rice', 5.50, 1);

-- Insert Chores
INSERT INTO Chores (Flat_ID, Priority, Title, Description) VALUES
('ABCD', 'urgent', 'Vacuum Living Room', 'Vacuum and clean the living room'),
('ABCD', 'not-so-urgent', 'Wash Dishes', 'Wash all dishes from the sink');


