-- Migration to add cancel_at_period_end column to subscriptions table
-- Created on 2024-07-02

ALTER TABLE public.subscriptions
ADD COLUMN IF NOT EXISTS cancel_at_period_end boolean DEFAULT false NOT NULL; 