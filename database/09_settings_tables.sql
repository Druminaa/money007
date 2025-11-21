-- Create user_settings table
CREATE TABLE IF NOT EXISTS user_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    currency VARCHAR(10) DEFAULT 'INR' NOT NULL,
    language VARCHAR(10) DEFAULT 'en' NOT NULL,
    date_format VARCHAR(20) DEFAULT 'dd-mm-yyyy' NOT NULL,
    theme VARCHAR(20) DEFAULT 'light' NOT NULL,
    email_notifications BOOLEAN DEFAULT true NOT NULL,
    push_notifications BOOLEAN DEFAULT true NOT NULL,
    budget_alerts BOOLEAN DEFAULT true NOT NULL,
    goal_reminders BOOLEAN DEFAULT true NOT NULL,
    weekly_reports BOOLEAN DEFAULT false NOT NULL,
    two_factor_auth BOOLEAN DEFAULT false NOT NULL,
    login_alerts BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    UNIQUE(user_id)
);

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    location VARCHAR(255),
    date_of_birth DATE,
    bio TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    UNIQUE(user_id)
);

-- Enable RLS (Row Level Security)
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_settings
CREATE POLICY "Users can view own settings" ON user_settings
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings" ON user_settings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own settings" ON user_settings
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own settings" ON user_settings
    FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for user_profiles
CREATE POLICY "Users can view own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON user_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own profile" ON user_profiles
    FOR DELETE USING (auth.uid() = user_id);

-- Create triggers for updated_at
CREATE TRIGGER update_user_settings_updated_at 
    BEFORE UPDATE ON user_settings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at 
    BEFORE UPDATE ON user_profiles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);