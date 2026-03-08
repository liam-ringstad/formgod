-- FormGod AI: Initial Database Schema
-- Run this in your Supabase SQL editor or via Supabase CLI migrations

-- ============================================
-- PROFILES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  display_name TEXT,
  fitness_level TEXT CHECK (fitness_level IN ('beginner', 'intermediate', 'advanced')) DEFAULT 'beginner',
  avatar_url TEXT,
  referral_code TEXT UNIQUE,
  referred_by UUID REFERENCES public.profiles(id),
  free_analyses_used INTEGER DEFAULT 0,
  free_analyses_reset_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '1 month'),
  is_pro BOOLEAN DEFAULT FALSE,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  pro_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ANALYSES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  exercise_type TEXT NOT NULL,
  score INTEGER CHECK (score >= 0 AND score <= 100),
  joint_data JSONB DEFAULT '{}',
  tips JSONB DEFAULT '[]',
  thumbnail_url TEXT,
  reel_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- REFERRALS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  referred_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  rewarded BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- Profiles RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Allow reading any profile's referral_code for referral lookups
DROP POLICY IF EXISTS "Anyone can read referral codes" ON public.profiles;
CREATE POLICY "Anyone can read referral codes"
  ON public.profiles FOR SELECT
  USING (true);

-- Analyses RLS
ALTER TABLE public.analyses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own analyses" ON public.analyses;
CREATE POLICY "Users can read own analyses"
  ON public.analyses FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own analyses" ON public.analyses;
CREATE POLICY "Users can insert own analyses"
  ON public.analyses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own analyses" ON public.analyses;
CREATE POLICY "Users can update own analyses"
  ON public.analyses FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own analyses" ON public.analyses;
CREATE POLICY "Users can delete own analyses"
  ON public.analyses FOR DELETE
  USING (auth.uid() = user_id);

-- Referrals RLS
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own referrals" ON public.referrals;
CREATE POLICY "Users can read own referrals"
  ON public.referrals FOR SELECT
  USING (auth.uid() = referrer_id OR auth.uid() = referred_id);

DROP POLICY IF EXISTS "Users can insert referrals" ON public.referrals;
CREATE POLICY "Users can insert referrals"
  ON public.referrals FOR INSERT
  WITH CHECK (auth.uid() = referred_id);

-- ============================================
-- HELPER FUNCTION: Generate random referral code
-- ============================================
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TRIGGER: Auto-create profile on user signup
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, referral_code)
  VALUES (
    NEW.id,
    NEW.email,
    public.generate_referral_code()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- INDEXES for performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_analyses_user_id ON public.analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_analyses_created_at ON public.analyses(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_referral_code ON public.profiles(referral_code);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id ON public.referrals(referrer_id);

-- ============================================
-- STORAGE BUCKET for thumbnails & reels
-- ============================================
INSERT INTO storage.buckets (id, name, public) 
VALUES ('formgod', 'formgod', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies: users can upload/read/delete in their own folder
DROP POLICY IF EXISTS "Users can upload to own folder" ON storage.objects;
CREATE POLICY "Users can upload to own folder"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'formgod' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Users can read own files" ON storage.objects;
CREATE POLICY "Users can read own files"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'formgod' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Public read for thumbnails and reels" ON storage.objects;
CREATE POLICY "Public read for thumbnails and reels"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'formgod');

DROP POLICY IF EXISTS "Users can delete own files" ON storage.objects;
CREATE POLICY "Users can delete own files"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'formgod' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );
