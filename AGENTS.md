# AGENTS.md — rate-calculator-applet

**Last Updated:** 2026-02-08

This document provides the essential context for any AI agent working in this repository.

---

## Repository Purpose

Wholetone Suite Rate Calculator

## Architecture Context

This repo is part of the **LOOVE OS** ecosystem under the `loovelabs` GitHub organization. The canonical architecture reference is stored in Supabase in the `loove_arch_*` tables. Query `loove_arch_repositories` for the full inventory.

## Credential Access

Credentials are stored in the `loove_credentials` table in Supabase. See the `loove-keys` skill for the retrieval protocol. **Never print credential values in chat, logs, or commit history.**

## Related Skills

Skills relevant to this repo are stored in the `loove_arch_skills` Supabase table and in the Manus sandbox at `/home/ubuntu/skills/`. Key skills for this repo:

- wholetone-development

## Multi-Agent Collaboration

LOOVE uses a collaborative model. See `loovelabs/loove-os/AGENTS.md` for the full protocol. Current agents: Manus (executor), Claude Opus 4.6 (reasoning), Devin (focused coding).

## Getting Started

1. Query `loove_arch_repositories` for the current repo inventory.
2. Query `loove_arch_skills` for available skills.
3. Read `loovelabs/loove-os/core/constitution.md` for mission context.

---

*This file is maintained as part of the LOOVE Architecture review cycle.*
