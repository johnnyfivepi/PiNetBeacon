---
layout: page
title: FAQ
---

Here are answers to the questions people tend to ask while setting up or using PiNetBeacon. Everything here is beginner-friendly, and nothing assumes you already know how networking works. 

If something feels confusing, you're not alone, and part of the point of PiNetBeacon is to make this stuff easier to understand.

---

## Contents (choose your own adventure)

- ❓ [Does PiNetBeacon work on the Raspberry Pi Zero 2 W?](#-does-pinetbeacon-work-on-the-raspberry-pi-zero-2-w)
- 🌐 [Do I need fast internet for this to work?](#-do-i-need-fast-internet-for-this-to-work)
- 📡 [What host should I ping?](#-what-host-should-i-ping)
- 🧪 [How often should PiNetBeacon run checks?](#-how-often-should-pinetbeacon-run-checks)
- 🗂️ [Will this wear out my SD card?](#️-will-this-wear-out-my-sd-card)
- 🛜 [My internet feels slow but PiNetBeacon says it's fine. Why?](#-my-internet-feels-slow-but-pinetbeacon-says-its-fine-why)
- 🔧 [A module shows an error. What do I do?](#-a-module-shows-an-error-what-do-i-do)
- 🔍 [Where do I find the logs?](#-where-do-i-find-the-logs)
- 📊 [Do I need the dashboard?](#-do-i-need-the-dashboard)
- 🤝 [Can I contribute or add my own module?](#-can-i-contribute-or-add-my-own-module)

---

## ❓ Does PiNetBeacon work on the Raspberry Pi Zero 2 W?

Yes, absolutely. PiNetBeacon is lightweight and runs comfortably on the Raspberry Pi Zero 2 W. In fact, many people use it as a background “network narrator” for their home setup.

It also works on the original Pi Zero W, Pi 3, Pi 4, Pi 5, and anything newer. If your Pi can run Raspberry Pi OS Lite and has a network connection, you’re set.

[↑ Back to safety](#contents-choose-your-own-adventure){:.pb-back}

---

## 🌐 Do I need fast internet for this to work?

No. PiNetBeacon isn’t measuring how *fast* your internet is. It cares more about how *responsive* and *reliable* it feels.

Even modest internet connections can behave well or poorly depending on:

- congestion  
- your router’s health  
- Wi-Fi stability  
- your ISP’s “personality” today  

PiNetBeacon focuses on latency and packet loss, which matter for things like:

- loading websites  
- video calls  
- gaming  
- smart-home devices  

So whether you have gigabit fiber or something more humble, PiNetBeacon can help you understand how your connection behaves.

[↑ Back to safety](#contents-choose-your-own-adventure){:.pb-back}

---

## 📡 What host should I ping?

Most people start with **1.1.1.1** (Cloudflare) or **8.8.8.8** (Google). Both are reliable, well-maintained, and respond quickly.

You can also ping:

- your router’s LAN IP  
- a DNS server you prefer  
- a service you rely on  
- or any stable host that normally stays online

If you ever notice a target behaving oddly, try switching to a different one and compare. Sometimes a single service has a temporary mood, and PiNetBeacon makes that easy to spot.

[↑ Back to safety](#contents-choose-your-own-adventure){:.pb-back}

---

## 🧪 How often should PiNetBeacon run checks?

Most people schedule PiNetBeacon to run:

- every **1 minute**  
- or every **5 minutes**

Shorter intervals give you more detailed data, while longer intervals reduce how often the log grows.

A good starting point is every 2 to 3 minutes. That gives you a clear picture of your network's behavior without overwhelming your Pi or your storage.

If you’re trying to diagnose something in real time, feel free to shorten the interval temporarily.

[↑ Back to safety](#contents-choose-your-own-adventure){:.pb-back}

---

## 🗂️ Will this wear out my SD card?

Not under normal use. PiNetBeacon writes small log entries, and they’re lightweight enough that the impact on your SD card is minimal.

If you want to be extra cautious, you can:

- run checks less frequently  
- rotate logs occasionally  
- or store logs on a USB drive or network share  

But for most hobbyists, PiNetBeacon’s logging style is well within what SD cards handle every day without issue.

[↑ Back to safety](#contents-choose-your-own-adventure){:.pb-back}

---

## 🛜 My internet feels slow but PiNetBeacon says it's fine. Why?

This happens more often than you might think. PiNetBeacon focuses on *responsiveness* and *stability* (latency and packet loss), but many real-world slowdowns happen for other reasons like:

- a specific website or app struggling  
- crowded Wi-Fi channels  
- multiple devices using bandwidth at once  
- your router needing a reboot  
- a service throttling traffic  
- DNS being sluggish for a moment  

Think of PiNetBeacon as the “is the network actually misbehaving?” tool. If it reports normal results but things *feel* slow, the issue is often:

- a single service  
- Wi-Fi interference  
- or something happening outside your Pi’s path

The **How it works** page explains these scenarios in more detail if you want a deeper look.

[↑ Back to safety](#contents-choose-your-own-adventure){:.pb-back}

---

## 🔧 A module shows an error. What do I do?

Don’t panic — most module errors are straightforward and usually mean something in the network path didn’t respond the way the Pi expected.

A few common causes:

- the host you’re checking is temporarily down  
- your Wi-Fi dropped for a moment  
- DNS returned something unusual  
- your router paused to collect itself  
- the Pi ran the check before the network was fully ready

Each module includes a short note in the log entry to help you figure out what happened. If you’re unsure how to interpret it:

- run the check again  
- try a different target host  
- check your Pi’s network connection  
- glance at the **Gateway** or **DNS** module’s results for context

If you continue seeing the same error, feel free to open an issue on GitHub. PiNetBeacon is meant to be understandable, not mysterious.

[↑ Back to safety](#contents-choose-your-own-adventure){:.pb-back}

---

## 🔍 Where do I find the logs?

PiNetBeacon stores log entries in:

```
data/logs/pinetbeacon.log.jsonl
```

Each line is a single JSON object. This makes it easy to:

- view entries with `cat` or `less`  
- search through them with command-line tools  
- feed them into the dashboard  
- analyze them with Python or another script

Logs grow over time, but they’re plain text and very manageable. If you ever want to rotate or archive them, you can rename the file and PiNetBeacon will create a fresh one automatically.

[↑ Back to safety](#contents-choose-your-own-adventure){:.pb-back}

---

## 📊 Do I need the dashboard?

No, PiNetBeacon works perfectly well without it. The dashboard is an optional layer that turns your log data into clear visuals, which can help you spot patterns more easily.

You might find the dashboard helpful if you want to see:

- when latency spikes over time  
- how often packet loss appears  
- whether certain hours of the day behave differently  
- how your router or DNS responds across longer periods

If you prefer reading logs directly, that’s totally fine. PiNetBeacon is designed to let you use whichever approach feels most natural.

[↑ Back to safety](#contents-choose-your-own-adventure){:.pb-back}

---

## 🤝 Can I contribute or add my own module?

Absolutely. PiNetBeacon is open source and designed to be understandable even if you’re new to scripting or networking.

You can contribute by:

- opening an issue  
- suggesting a new module  
- improving documentation  
- submitting a pull request  
- experimenting with new checks in your own fork

If you’re interested in writing your own module, feel free to look at the existing ones for inspiration. They’re intentionally compact so you can learn from them without getting buried in boilerplate.

Contributions of all sizes are welcome. You can read more about contributing here:

👉 [Contributing to PiNetBeacon]({{ site.baseurl }}/contributing/)

[↑ Back to safety](#contents-choose-your-own-adventure){:.pb-back}


