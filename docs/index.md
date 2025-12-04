---
layout: home
title: PiNetBeacon
nav_order: 0
description: Lightweight Raspberry Pi network monitor for curious hobbyists.
---

# PiNetBeacon

Welcome! 👋

**PiNetBeacon** is a lightweight, Raspberry-Pi–friendly network monitor that helps you **see what your home internet is *actually* doing** - latency, uptime, DNS health, and small outages - without heavy stacks, containers, or databases.

It’s simple, transparent, and built for *learning* just as much as monitoring.

---

## Why PiNetBeacon?

Most network tools assume you want dashboards, databases, containers, exporters, and 10 different ports open.

PiNetBeacon is the opposite.

It’s for people who want a small, understandable tool that answers real-life questions:

- “Is my internet actually flaky, or is it just that one site?”
- “What does latency *mean* for the way I use the internet?”
- “How often is my connection dropping when I’m not watching?”
- “Can I track this without Grafana, Prometheus, or Docker?”

If that’s you, you’ll feel right at home.

---

## Key features

- 🕒 **Lightweight scheduled checks**  
  Tiny ping + DNS tests that won’t stress even a Pi Zero W.

- 📄 **Clean local JSONL logs**  
  Human-readable, append-only, and easy to work with.

- 📊 **Optional web dashboard**  
  A small, self-hosted UI that shows your recent checks.

- 🔍 **Clear explanations**  
  Beginner notes, diagrams, and real-world interpretations.

- 🧹 **Automatic log cleanup**  
  Keep your Pi tidy with optional cron log rotation.

- 🧩 **Modular design**  
  Add new checks or customize existing ones easily.

- 🧸 **No bloat. No containers. No databases.**  
  The entire project is tiny, transparent, and approachable.

---

## Start here

- 👉 **[Getting started](getting-started.md)** — set up PiNetBeacon on a Raspberry Pi (Zero 2 W included)  
- 🧠 **[How it works](how-it-works.md)** — plain-language explanations of ping, DNS, and outage logic  
- 🔍 **[Monitoring modules](monitoring-modules.md)** — what PiNetBeacon checks and why  
- 📊 **[Dashboard](dashboard.md)** — load and browse your recent logs visually  
- 🤖 **[Automation](automation.md)** — cron, systemd, and automatic log cleanup  
- 🔐 **[Secure remote access](cloudflare-tunnel.md)** — optional Cloudflare Tunnel guide  
- ❓ **[FAQ](faq.md)** — common questions and troubleshooting tips  

---

## What makes PiNetBeacon different?

PiNetBeacon is intentionally small.

Instead of telling you “paste this and don’t ask why,” the docs explain how each part works - ping, DNS, logs, systemd, cron - so you understand both **what you’re doing** and **why it matters**.

Think of PiNetBeacon as:

> **A tiny Raspberry Pi watching your network...  
> and a friendly guide helping you make sense of it.**
