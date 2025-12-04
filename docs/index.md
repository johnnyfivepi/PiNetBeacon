---
layout: home
title: PiNetBeacon
description: Lightweight Raspberry Pi network monitor for curious hobbyists.
---

<p align="left">
  <img alt="Platform" src="https://img.shields.io/badge/platform-Raspberry%20Pi-orange">
  <img alt="Built with" src="https://img.shields.io/badge/built%20with-Python-3670A0">
  <img alt="Interface" src="https://img.shields.io/badge/interface-CLI%20%2B%20web%20UI-ff69b4">
  <img alt="Status" src="https://img.shields.io/badge/status-active-brightgreen">
</p>

Welcome! 👋

**PiNetBeacon** is a lightweight, Raspberry-Pi–friendly network monitor that helps you **see what your home internet is *actually* doing** - latency, uptime, DNS health, and small outages - without heavy stacks, containers, or databases.
{: .lead }

PiNetBeacon runs tiny checks from a Raspberry Pi (including the Zero 2 W), logs the results as simple JSON Lines, and optionally serves a small web dashboard so you can browse your recent history in a browser.

It’s simple, transparent, and built for *learning* just as much as monitoring.

---

## Why PiNetBeacon?

Most monitoring stacks assume you want dashboards, databases, exporters, half a dozen services, and 10 ports open.

PiNetBeacon is the opposite: it's small, approachable, and aimed at people who want answers to real-life questions like:

- “Is my internet actually flaky, or is it just that one site?”
- “What does latency *mean* for the way I use the internet?”
- “How often is my connection dropping when I’m not watching?”

If you’d like a tiny Pi quietly watching your network - and **explaining what it’s seeing** - you’re in the right place.

---

## Key features

- 🕒 **Lightweight scheduled checks**  
  Tiny ping + DNS tests that won’t stress even a Pi Zero W.

- 📄 **Clean local JSONL logs**  
  One check per line, easy to `tail`, `grep`, or feed into other tools.

- 📊 **Optional web dashboard**  
  A simple, self-hosted UI that reads your log file and shows recent checks.

- 🧪 **Built to teach**  
  Docs explain the “why”, not just “paste this command”.

- 🧹 **Automatic log cleanup**  
  Optional cron-based cleanup to keep your SD card tidy.

- 🧩 **Extensible**  
  Add your own modules or tweak the existing ones.

- 🧸 **No bloat. No containers. No databases.**  
  The entire project is tiny, transparent, and approachable.

---

## Start here

- 👉 **[Getting started](getting-started.md)** - set up PiNetBeacon on a Raspberry Pi (Zero 2 W included)  
- 🧠 **[How it works](how-it-works.md)** - plain-language explanations of ping, DNS, and outage logic  
- 🔍 **[Monitoring modules](monitoring-modules.md)** - what PiNetBeacon checks and why  
- 📊 **[Dashboard](dashboard.md)** - load and browse your recent logs visually  
- 🤖 **[Automation](automation.md)** - cron, systemd, and automatic log cleanup  
- 🔐 **[Secure remote access](cloudflare-tunnel.md)** - optional Cloudflare Tunnel guide  
- ❓ **[FAQ](faq.md)** - common questions and troubleshooting tips  

---

## What makes PiNetBeacon different?

PiNetBeacon is intentionally small and transparent.

Instead of hiding complexity behind a huge stack, it leans into:

- clear configuration  
- small scripts you can read in one sitting  
- documentation that explains how things work under the hood

This way, you'll understand both **what you’re doing** and **why it matters**.

Think of PiNetBeacon as:

> A tiny Raspberry Pi watching your network...  
> and a friendly guide helping you make sense of it.
