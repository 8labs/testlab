-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY,
    platform VARCHAR(50) NOT NULL,
    app_version VARCHAR(50) NOT NULL,
    first_seen TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create events table
CREATE TABLE IF NOT EXISTS events (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id),
    event_type VARCHAR(50) NOT NULL,
    details JSONB NOT NULL,
    app_version VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_events_user_id ON events(user_id);

-- Create index on event_type for faster filtering
CREATE INDEX IF NOT EXISTS idx_events_event_type ON events(event_type);

-- Create index on created_at for time-based queries
CREATE INDEX IF NOT EXISTS idx_events_created_at ON events(created_at); 