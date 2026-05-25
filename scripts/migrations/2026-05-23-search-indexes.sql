-- Migration: Search Enhancement
-- Phase 8 of IMPROVEMENT_PLAN.md

create extension if not exists pg_trgm;

create index if not exists posts_body_trgm_idx
  on public.posts using gin (body gin_trgm_ops);

create index if not exists comments_body_trgm_idx
  on public.comments using gin (body gin_trgm_ops);
