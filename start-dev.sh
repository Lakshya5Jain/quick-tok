#!/bin/bash

# Start Docker if not running
open -a Docker

# Wait for Docker to start
echo "Waiting for Docker to start..."
sleep 15

# Start Supabase
echo "Starting Supabase..."
supabase start

# Deploy functions
echo "Deploying Edge functions..."
supabase functions deploy generate-ai-video
supabase functions deploy generate-script
supabase functions deploy check-ai-video-status

# Start frontend
echo "Starting frontend application..."
npm run dev 