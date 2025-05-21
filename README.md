# INFO310 - SharedSpace

## Files / Folders:
`mysql-data/` - Holds all the mysql and DB files\
`node_modules/` - Contains modules used by node\
`sql/` - Stores the necessary sql files for setting up the DB\
`views/` - Contains the page views that display data to the app\
`sql/db_setup.sql` - Responsible for creating the tables in the database

## Instruction on Website Usage:
>### Starting:
>1. Open Docker -> Delete any other images/containers (Not required but if its not building correctly it may be because a previous image/container is causing problems)
>
>2. Go to project file directory
>
>3. Open Terminal of your choosing (e.g. git bash, terminal, etc)
>
>4. Run following commands: docker-compose up --build           
>   - If it throws an error try running these first (In git bash)
>       - docker-compose down -v
>       - rm -rf ./mysql-data
>
>5. Go to: http://localhost:3000/
>
>6. Navagate through the website. We have descriptions on each sections below. Please read description before using the website
>
>
>### Login and Group Creation
> Sign up to a new account using the credentials ask for. 
> 
> When logging in you can use either username or email
>
> Create a new or group or to join a prepopulated group use the group code ABCD
>
> ### Home
> Shows the following:
>   - Events happening in the next 7 days
>   - Incomplete Chores sorted by priority
>   - Bills in the next 7 days or overdue bills
>   - Groceries
>
> All blue arrow buttons (>) will send you to the respective pages, or you can use the nav bar
>
> ### Events
> **How to Use:**
> 1. Schedule an Event:
>    - Click the blue plus button in the corner
>    - Enter details of the event
>    - Submit the even which be saved and displayed on the calendar
>
> 2. Editing an Event:
>    - Click the blue button with a pen icon, here you can see all events scheduled for your flat
>    - Click the red trash icon to delete an event
>    - Click the edit button to edit the details of an event, here you can edit the details of a pre-existing event
>
> **Notes:**
> This page uses an external calendar component the repo can be found here: [Schedule-X-Calendar](https://github.com/schedule-x/schedule-x)
>
> ### Chores
> **How to Use:**
> 1. Add a new chore:
>    - Fill in the title (required)
>    - Add description (optional)
>    - Select priority level (Urgent/Not So Urgent/Low Urgency)
>    - Click 'Add' button
>
> 2. Manage chores:
>    - View chores organized by priority sections
>    - Check the box next to a chore to mark it as complete
>    - Click 'X' button to remove chores
>
> Note: Chores are shared with all flatmates in your group
>
> ### Groceries
>    - Add groceries
>    - Tick items that have been purchased
>    - Clear selected items if not all items purchased
>    - Clear all items if all purchased
>
> ### Bills
>   - Add Bills
>   - Delete Bills
>   - Pay for bills
>   - Automatically split between users in a group
>   - Have Reoccuring bills for that repeat after a certain amount of days
>   - Bills Coloured red if overdue
>   - Can Filter upcoming bills (Monthly or Weekly)
>
>
> ### Log-out
> Press the log out button on Nav Bar to log out of your account. This will redirect you back to the login/signup page

## Project Documentation:
[Shared Document](https://docs.google.com/document/d/1dsslKUIoFYGAVsMLgXbK1OL8lQxgPu3Gu_5K1Iog1M0/edit?usp=sharing)

[Feasibility Study](https://docs.google.com/document/d/1JaLbUw4ipO6lABDCIq8vzGexEP9u_air5N-dcGxHvC8/edit?usp=sharing)

[SCRUM Spreadsheet](https://otagouni-my.sharepoint.com/:x:/r/personal/shofe999_student_otago_ac_nz/Documents/INFO310_Project_Management_SharedSpace.xlsm?d=w6ef4d4d876d34f4487d256dcabb2cecc&csf=1&web=1&e=T4PMRQ)

[Test cases](https://otagouni-my.sharepoint.com/:x:/r/personal/shofe999_student_otago_ac_nz/_layouts/15/Doc.aspx?sourcedoc=%7B119FB2AC-A535-43A1-8EF4-ADB2F2B0830F%7D&file=TestCases_template.xlsx&fromShare=true&action=default&mobileredirect=true)

[Milestone Presentation](https://otagouni-my.sharepoint.com/:p:/r/personal/gorma749_student_otago_ac_nz/Documents/Milestone.pptx?d=w434e1499660e404ab87cfafbfc58066e&csf=1&web=1&e=UFEolp)

[Risk Management](https://otagouni-my.sharepoint.com/:x:/r/personal/gorma749_student_otago_ac_nz/_layouts/15/Doc.aspx?sourcedoc=%7B3BD40AD4-CA69-4BC9-B2ED-45D73C4C531F%7D&file=Risk%20Management.xlsx&action=default&mobileredirect=true&DefaultItemOpen=1&ct=1746232799650&wdOrigin=OFFICECOM-WEB.START.EDGEWORTH&cid=d71edbd5-d6b3-4e4e-b612-faa8bf0a0cdd&wdPreviousSessionSrc=HarmonyWeb&wdPreviousSession=a52b87e3-7d08-415a-89a6-128d68be09f5)

[Final Presentation](https://otagouni-my.sharepoint.com/:p:/g/personal/gorma749_student_otago_ac_nz/Eez1TqdMSfpOto813CxZ7w8BBCNBDe3Ei8BW-ZRqo8IZAg?e=fTiLfN)
