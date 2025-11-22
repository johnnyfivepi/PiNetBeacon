---
layout: page
title: Dashboard
---

# PiNetBeacon dashboard

The PiNetBeacon dashboard is a small web UI that reads from your log file:

`data/logs/pinetbeacon.log.jsonl`

It gives you:

- A quick “up / down” status view  
- Recent latency and packet loss  
- A simple table of recent checks  

## Starting the dashboard server

On your Raspberry Pi:

```bash
cd ~/PiNetBeacon/dashboard
python3 server.py
