---
layout: page
title: Monitoring modules
---

# Monitoring modules

PiNetBeacon is built around small, focused “modules” that check different parts of your network. Think of each module as a tiny sensor that reports how things are going. None of them try to fix anything, they just collect honest little facts about your connection.

This page walks you through the modules that PiNetBeacon supports, why each one matters, and how the results can help you understand your network's mood.

---

## Contents (choose your own adventure)

- 🏓 [Ping module: latency and packet loss](#-ping-module-latency-and-packet-loss)
- 🌐 [DNS module: testing name lookups](#-dns-module-testing-name-lookups)
- 🔍 [HTTP module: checking website reachability](#-http-module-checking-website-reachability)
- 🚪 [Gateway module: is your router awake](#-gateway-module-is-your-router-awake)
- 🛠️ [Optional future modules](#️-optional-future-modules)
- ✨ [Wrapping up](#-wrapping-up)

---

## 🏓 Ping module: latency and packet loss

The Ping module is the core of PiNetBeacon. It’s the one that checks how fast your network responds and whether anything goes missing along the way.

If you read the "[How it works]({{ site.baseurl }}/how-it-works/)" page, you already know the vibes: your Pi steps onto the imaginary airport moving walkway with a tiny envelope and hopes whatever’s at the other end isn’t a goblin.

Here’s what the Ping module measures:

- **Average latency**<br>
This tells you how long the round trip took. Lower numbers feel snappier. Higher numbers feel like your apps are thinking too hard.

- **Packet loss**<br>
This is how many envelopes never made it back. Even a little packet loss can make video calls freeze or games feel laggy.

- **Status**<br>
PiNetBeacon translates the raw result into simple states like “up” or “down” so you don’t have to interpret weird command output.

- **Helpful notes**<br>
If something odd happened (host unreachable, timed out, permission error), the module writes a clear note in the log.

Most home internet issues show up in the Ping module first. It’s the simplest, most reliable way to spot slowdowns or flaky behavior.

[↑ Back to safety](#monitoring-modules)

---

## 🌐 DNS module: testing name lookups

The DNS module checks whether your network can turn names into addresses. When you type `example.com` into a browser, your device has to ask a DNS server, “Hi, what is the actual IP for this name?” If DNS is unhappy, almost everything feels broken.

PiNetBeacon’s DNS module is small but helpful. It sends a simple lookup request for a hostname you choose, then records what happened.

### What the DNS module checks

- **Can the Pi reach your DNS resolver?**  
  If this fails, your Pi can still “see” the internet in theory but has no idea where anything lives.

- **How long the lookup takes**  
  Slow DNS can make websites feel sluggish even when your connection is fast.

- **Whether the response looks valid**  
  If the query gets a weird or empty response, PiNetBeacon notes that in the log.

This module is especially useful on days when speed tests look fine but websites refuse to load, or when every device in the house suddenly complains in chorus.

You can pick a simple, stable hostname to test, such as:

- `cloudflare.com`
- `example.com`
- or a service you care about

The DNS module logs a clear success or failure result so you do not have to read raw resolver output.

[↑ Back to safety](#monitoring-modules)

---

## 🔍 HTTP module: checking website reachability

The HTTP module answers a very normal, very human question:

**“Is it just me, or is this website actually down?”**

Instead of relying on guesses, refreshing the page six times, or Googling “is X down,” PiNetBeacon can quietly check for you.

The HTTP module sends a tiny request to a website you choose and looks for a simple, healthy response. It doesn’t download the whole page and it doesn’t spider the site. It just taps the door and waits for a friendly “yep, I’m here.”

### What the HTTP module checks

- **Can the Pi reach the site at all?**  
  If your Pi can’t reach it, chances are your other devices can’t either.

- **Does the server respond with a normal status code?**  
  (Like 200 OK. Not the dreaded 500, or the “whoops, everything’s on fire” 503.)

- **How long the site took to reply**  
  Slow responses can reveal early signs of service issues.

### Why it’s useful

Sometimes your internet is fine but one specific service (think: email provider, chat app, game server, or your favorite dashboard) is having a mood. The HTTP module helps you confirm it without guesswork.

You can monitor:

- a homepage you depend on  
- an API endpoint  
- your router’s status page (advanced users only)  
- or any site that allows simple GET requests

The module logs the result in clear yes/no terms so you don’t have to interpret cryptic status codes.

[↑ Back to safety](#monitoring-modules)

---

## 🚪 Gateway module: is your router awake

Your gateway (usually your router) is the first stop for all your internet traffic. If it’s slow, overloaded, overheating, or quietly having an existential crisis, everything else feels broken.

The Gateway module checks whether your Pi can reliably talk to your router. It’s a simple test, but it answers a surprisingly important question:

**“Is the problem happening inside my house, or somewhere out on the internet?”**

### What the Gateway module checks

- **Basic connectivity**  
  Can the Pi reach the router’s IP address?

- **Response time**  
  If the router is sluggish, local traffic slows down even when your ISP is fine.

- **Packet loss at the first hop**  
  This usually means Wi-Fi interference or a router that needs a little nap (or a reboot).

### Why it matters

If the gateway check is failing:

- the issue is almost certainly local  
- your ISP is not the villain this time  
- your router or Wi-Fi network is having a mood  
- it explains streaming hiccups, smart-home chaos, and slow loading times

If the gateway check is fine but everything else is a mess, the problem is more likely farther upstream.

The Gateway module helps you separate “my house is on fire” from “the internet is on fire,” which is a surprisingly useful distinction.

[↑ Back to safety](#monitoring-modules)

---

## 🛠️ Optional future modules

PiNetBeacon is designed to grow over time. The core modules keep things lightweight and beginner friendly, but there's room for expansion if you want to explore deeper network behavior.

Here are a few ideas that might land in future versions, or that you can add yourself if you're feeling adventurous.

### • Speed sampling  
Not a full speed test (those are too heavy for frequent checks), but small, low-impact measurements that give you a sense of how fast downloads or uploads feel at different times.

### • Jitter monitoring  
Jitter is how much your latency varies. High jitter makes video calls feel wobbly even if the connection is technically fast. It's a great metric for “vibe checking” your network stability.

### • HTTP status pattern tracking  
Look for repeating trends, like occasional 503s at the same time every evening. This is surprisingly useful for spotting upstream service hiccups.

### • Local device checks  
Ping or HTTP-check devices inside your home, like a NAS, smart hub, or home server. This can help you figure out if your Wi-Fi is having an off day.

### • Gateway uptime summaries  
Small daily or weekly rollups that highlight “your router took a 3-minute nap at 2:17 AM.” Very handy for spotting reboot cycles or heat issues.

### • DNS consistency checks  
Verify that your resolver is returning the same answers over time, and detect when things get weird (looking at you, captive portals and ISP redirects).

If you decide to build one of these, PiNetBeacon’s structure should make it easy to drop in a module, log its results, and add it to the dashboard. PRs are always welcome.

[↑ Back to safety](#monitoring-modules)

---

## ✨ Wrapping up

PiNetBeacon's modules are intentionally small and easy to understand. Each one focuses on a specific part of your network and writes down what it sees in clear, human-friendly terms. When you combine a few modules together, you get a surprisingly good snapshot of your network’s habits.

Whether you're here because your internet feels “off,” or you're just curious about how things actually work under the hood, these modules give you a simple way to explore.

If there's a module you'd like to see, feel free to open an issue or start a pull request. This project is built with hobbyists in mind, and contributions are always welcome.

You can keep exploring with:

- [Getting started]({{ site.baseurl }}/getting-started/)
- [How it works]({{ site.baseurl }}/how-it-works/)
- [FAQ]({{ site.baseurl }}/faq/)

Thanks for checking out PiNetBeacon. Your router may not always be awake, but we’re glad you are.

[↑ Back to safety](#monitoring-modules)
