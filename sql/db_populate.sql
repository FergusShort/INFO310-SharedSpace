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
('ABCD', 'Flat Party', 'Weekend party for all', '2025-04-10 18:00:00', '2025-04-10 23:00:00'),
('WXYZ', 'Cleaning Day', 'Flat cleaning and organization', '2025-04-15 09:00:00', '2025-04-15 12:00:00'),
('ABCD', 'Game Night', 'Board games and snacks!', '2025-04-17 19:00:00', '2025-04-17 22:00:00'),
('WXYZ', 'Roommate Meeting', 'Discuss bills and groceries', '2025-04-12 18:30:00', '2025-04-12 19:30:00'),
('ABCD', 'Movie Marathon', 'Lord of the Rings + Pizza', '2025-04-20 16:00:00', '2025-04-20 23:59:00');

-- Insert Bills
INSERT INTO Bills (Flat_ID, Initial_Amount, Amount_Left, Due_Date, Payment_Status, Title, Recurring, Time_period, Overdue, Description) VALUES
('ABCD', 200.00, 150.00, '2025-04-20',  'P', 'Electricity', TRUE, 30, FALSE, 'Monthly electricity bill'),
('ABCD', 150.00, 75.00, '2025-04-22', 'P', 'Internet', FALSE, NULL, FALSE, 'Internet service provider bill');

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


