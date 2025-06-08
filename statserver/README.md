# Stats Server

A simple analytics server for collecting anonymous usage statistics from the 8labs Testlab application. 

In order to keep track of the application and how it's used, we wanted to keep track of stats. However, we didn't want to collect any personal information and we wanted everyone to know exactly what we collect. You can see this in the code of the app itself, but it was also decided to include the source of the stat tracking API so everyone can see exactly what's collected and how it's processed.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the project root with the following content:
```bash
# Server Configuration
PORT=3000

# Database Configuration
DB_USER=postgres
DB_HOST=localhost
DB_NAME=eightlabs_stats_db
DB_PASSWORD=your_password_here
DB_PORT=5432
```

3. Update the `.env` file with your database credentials.

4. Create the database:
```sql
CREATE DATABASE eightlabs_stats_db;
```

5. Run the schema:
```bash
psql -d eightlabs_stats_db -f src/schema.sql
```

## Running the Server

Development mode:
```bash
npm run dev
```

Production mode:
```bash
npm start
```

## API Endpoints

### Register User
```
POST /stats/register
Content-Type: application/json

{
    "id": "UUID",
    "platform": "darwin",
    "app_version": "0.0.5"
}
```

### Record Event
```
POST /stats/event
Content-Type: application/json

{
    "id": "UUID",
    "event_type": "app_opened",
    "details": {
        "app_version": "0.0.5",
        "total_tests": 5
    }
}
```

## Database Schema

### Users Table
- `id` (UUID): Primary key
- `platform` (VARCHAR): Operating system platform
- `app_version` (VARCHAR): Application version
- `first_seen` (TIMESTAMP): First registration timestamp
- `last_seen` (TIMESTAMP): Last activity timestamp

### Events Table
- `id` (SERIAL): Primary key
- `user_id` (UUID): Foreign key to users table
- `event_type` (VARCHAR): Type of event
- `details` (JSONB): Event-specific details
- `app_version` (VARCHAR): Application version at time of event
- `created_at` (TIMESTAMP): Event timestamp 