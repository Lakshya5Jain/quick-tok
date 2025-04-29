#!/bin/bash

# Stop any running Supabase local instance (so new config and functions are applied)
supabase stop || true

# Start Docker if not running
open -a Docker

# Wait for Docker to start
echo "Waiting for Docker to start..."
sleep 15

# Start Supabase
echo "Starting Supabase..."
supabase start

echo "Applying database migrations..."
supabase db push

# Deploy functions
echo "Deploying Edge functions..."
supabase functions deploy manual-subscription-add
supabase functions deploy create-customer-portal-session
supabase functions deploy add-monthly-credits
supabase functions deploy generate-ai-video
supabase functions deploy get-user-credits
supabase functions deploy add-admin-credits
supabase functions deploy webhook-stripe
supabase functions deploy cancel-subscription
supabase functions deploy check-ai-video-status
supabase functions deploy check-final-video-status
supabase functions deploy create-checkout-session
supabase functions deploy create-final-video
supabase functions deploy cleanup-files
supabase functions deploy generate-script
supabase functions deploy get-videos

# Start frontend
echo "Starting frontend application..."
npm run dev 