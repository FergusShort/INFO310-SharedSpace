-- Tweaked CHATGPT Generated example inserts / data from giving it
-- db_setup.sql file with prompt 'from this schema produce
-- insert statements that will fill all tables with "2 flats"' 

-- Insert Flats
INSERT INTO Flat (Flat_ID, GroupName) VALUES
('ABCD', '123 Main Street'),
('1', '123 Main Street'),
('WXYZ', '456 Oak Avenue');

-- Insert Users
INSERT INTO User (Email, Username, Password, Flat_ID) VALUES
('alice@example.com', 'Alice', 'password123', 'ABCD'),
('bob@example.com', 'Bob', 'password123', 'ABCD'),
('charlie@example.com', 'Charlie', 'password123', 'WXYZ'),
('dana@example.com', 'Dana', 'password123', 'WXYZ');

-- Insert Events
INSERT INTO Events (Flat_ID, Title, Description, Event_Date, Start_Time, End_Time) VALUES
('ABCD', 'Flat Party', 'Weekend party for all', '2025-04-10', '18:00:00', '23:00:00'),
('WXYZ', 'Cleaning Day', 'Flat cleaning and organization', '2025-04-15', '09:00:00', '12:00:00');

-- Insert Bills
INSERT INTO Bills (Flat_ID, Initial_Amount, Amount_Left, Amount_Paid, Due_Date, Payment_Status, Title, Recurring, Time_period, Overdue, Description) VALUES
('1', 200.00, 150.00, 50.00, '2025-04-20',  'P', 'Electricity', TRUE, 30, FALSE, 'Monthly electricity bill'),
('1', 150.00, 75.00, 75.00, '2025-04-22', 'P', 'Internet', FALSE, NULL, FALSE, 'Internet service provider bill');

-- Insert Groceries
INSERT INTO Groceries (Flat_ID, Item, Price, Quantity) VALUES
('ABCD', 'Milk', 3.50, 2),
('ABCD', 'Bread', 2.00, 1),
('WXYZ', 'Eggs', 4.00, 12),
('WXYZ', 'Rice', 5.50, 1);

-- Insert Chores
INSERT INTO Chores (Flat_ID, Priority, Title, Description) VALUES
('ABCD', 'High', 'Vacuum Living Room', 'Vacuum and clean the living room'),
('WXYZ', 'Medium', 'Wash Dishes', 'Wash all dishes from the sink');

-- Insert Chore Assignments
INSERT INTO Chore_Assignment (User_ID, Chore_ID) VALUES
(1, 1), -- Alice assigned to vacuuming
(3, 2); -- Charlie assigned to dishwashing

-- Insert Users_Events
INSERT INTO Users_Events (User_ID, Event_ID) VALUES
(1, 1), -- Alice attending Flat Party
(2, 1), -- Bob attending Flat Party
(3, 2), -- Charlie attending Cleaning Day
(4, 2); -- Dana attending Cleaning Day
