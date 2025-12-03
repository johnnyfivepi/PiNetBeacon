---
layout: page
title: How it works
---

# How it works

PiNetBeacon is a tiny helper that sits on your Raspberry Pi and quietly watches your home internet.  

This page gives you a friendly tour of what's going on under the hood, written for regular humans and curious hobbyists. No networking background needed. No pop quizzes later. 

Here’s what you’ll learn:

- what PiNetBeacon actually checks
- why those checks matter in real life
- how to make sense of the logs
- how each part fits into your home network puzzle

If you've ever wondered why a website is slow even though every speed test says things are "fine", or if your router is having secret meltdowns at 3 AM, this page will help you spot the patterns.

Let’s start simple and build from there.

---

## Contents (choose your own adventure)

- 🚶‍♀️ [Your network, from Pi to the internet](#️-your-network-from-pi-to-the-internet)
- 🏃‍♂️ [What latency really is](#️-what-latency-really-is)
- 🕳️ [What packet loss means](#️-what-packet-loss-means)
- 🛠️ [How PiNetBeacon actually checks your connection](#️-how-pinetbeacon-actually-checks-your-connection)
- 📊 [Why checking over time matters](#-why-checking-over-time-matters)
- ✨ [What's next](#-whats-next)

---

## 🚶‍♀️ Your network, from Pi to the internet

Before we dig into what PiNetBeacon checks, it helps to know the basic path your Raspberry Pi takes when it talks to the internet. This is the 30-second version, and it's all you really need.

```
[ Raspberry Pi ] → [ Your Router ] → [ Your ISP ] → [ The Internet ]
```

That’s it. Four stops. Nothing mysterious.

Your Pi sends a tiny request, your router decides where it should go, your ISP carries it along like a highway, and eventually something on the internet replies. When everything is behaving, this round trip takes a few milliseconds.

When it's *not* behaving, you see symptoms:

- websites that take forever to load  
- apps that spin for no reason  
- video calls that glitch or freeze  
- that one game that insists it's *your* fault  

If you want a deeper dive into how home networks work, the “Introduction to Home Networking” from Cloudflare is a great beginner-friendly read:  
https://www.cloudflare.com/en-gb/learning/network-layer/what-is-a-home-network/

But for PiNetBeacon, the simple model above is all you need.

[↑ Back to safety](#contents-choose-your-own-adventure){:.pb-back}

---

## 🏃‍♂️ What latency really is

One of the first things PiNetBeacon measures is latency, which is a fancy word for “how long it takes your request to go out into the world and come back.” Think of it like sending your Raspberry Pi on a tiny errand.

Here’s the simplest way to imagine it:

Your Pi steps onto a moving walkway at the airport. The walkway is your ISP. The Pi's mission is just to deliver a tiny envelope to a server somewhere on the internet.

Most of the time, the walkway glides smoothly and your Pi comes right back, envelope delivered, feeling pretty proud of itself, and ready to change from outside clothes back into comfy clothes.

Sometimes the walkway:

- slows down  
- speeds up unpredictably  
- jerks to a stop  
- makes terrifying noises you hope the plane doesn't imitate
- or flickers like it’s haunted  

And occasionally, your Pi reaches the end of the walkway and whatever’s waiting there is... not ideal. Maybe it's a friendly server. Maybe it's a tired server. Or maybe it's a goblin that drops the envelope on the floor and wanders off, cackling.

PiNetBeacon times this whole adventure. If the round trip is quick, things feel snappy. If it’s slow, apps start “thinking” too hard.

If you want to dig a little deeper, Cloudflare has a great explanation of latency: 

- [What is latency (Cloudflare)](https://www.cloudflare.com/learning/performance/what-is-latency/)

[↑ Back to safety](#contents-choose-your-own-adventure){:.pb-back}

---

## 🕳️ What packet loss means

Next up is packet loss. If latency is about how long the trip takes, packet loss is about whether your Pi’s tiny envelope even makes it back at all.

Remember the moving walkway at the airport? Sometimes your Pi heads out with its envelope, everything seems fine... and then nothing comes back.

No envelope.  
No response.  
Just silence.

This is packet loss, and it can happen for a bunch of everyday reasons:

- your Wi-Fi is having one of its moods  
- your router is tired and needs a reboot  
- your ISP is doing “maintenance” at the worst possible time  
- your Pi’s request got misplaced, stepped on, or eaten by an internet goblin  

Packet loss matters because even small amounts can make things feel glitchy:

- video calls freeze or desync  
- websites load halfway and give up  
- games feel laggy even with “good” speeds  

PiNetBeacon tracks how often those envelopes go missing so you can see when the walkway is acting up.

Fortinet has a nice explanation of packet loss:  

- [What Is Packet Loss - Fortinet](https://www.fortinet.com/resources/cyberglossary/what-is-packet-loss)

[↑ Back to safety](#contents-choose-your-own-adventure){:.pb-back}

---

## 🛠️ How PiNetBeacon actually checks your connection

Now that you know the basic ideas behind latency and packet loss, here’s how PiNetBeacon measures them:

PiNetBeacon uses a tiny, built-in tool called `ping`. You’ve probably heard the word before. It’s the networking version of shouting “hey, you there?” down a hallway and seeing how long it takes to get a “yep!”

### What PiNetBeacon does during each check

1. Your Pi sends a few small packets (tiny data envelopes) to a target host.  
   The default is **1.1.1.1**, a very reliable server run by Cloudflare.

2. It waits for replies.  
   Each reply tells your Pi how fast the round trip was and whether anything got lost.

3. PiNetBeacon notes:  
   - the average latency  
   - how many packets came back  
   - whether any errors happened  
   - the timestamp of the check

4. It saves everything as a single line in a log file.  
   This makes it easy to read later, or to feed into a dashboard.

That’s the whole thing. No huge frameworks, no secret magic. Just small, honest measurements repeated over time, which gives you a surprisingly clear picture of your network’s mood swings.

Here’s a detailed guide from Bunny.net about how `ping` works:  

- [What Is Ping? - Bunny.net](https://bunny.net/academy/network/what-is-ping-how-does-it-work-and-what-it-does/)

[↑ Back to safety](#contents-choose-your-own-adventure){:.pb-back}

---

## 📊 Why checking over time matters

A single check is useful, but the real magic happens when you collect dozens or hundreds of them. One ping result can be a fluke. Ten results start to form a pattern. A whole day of results can tell you a story.

Here are a few things that only show up when you look at the bigger picture:

- **Daily slowdowns** that happen at the same hour  
  (maybe your ISP is busy, or everyone in your house starts streaming at once)

- **Tiny micro-outages** that break video calls but look “fine” in speed tests  
  (these are surprisingly common)

- **Random glitches** that only happen when your router is feeling dramatic  
  (technical term: “the router woke up and chose chaos”)

- **Consistent low latency** that tells you things are actually working great  
  (internet goblin not spotted... yet)

PiNetBeacon doesn’t try to predict or fix anything. It just collects small truths about your connection and writes them down in a clean, readable way. Once you see the patterns, you can make smarter decisions:

- Is the problem your ISP?  
- Is it Wi-Fi interference?  
- Is it the router?  
- Or is everything actually fine and the app you’re using is just having a day?

Data makes guesswork less.... guessy.

[↑ Back to safety](#contents-choose-your-own-adventure){:.pb-back}

---

## ✨ What’s next

Now that you know what PiNetBeacon checks and how it thinks, you can explore the rest of the docs:

- 👉 [Getting started]({{ site.baseurl }}/getting-started/) if you haven’t run your first check yet  
- 📈 [Monitoring modules]({{ site.baseurl }}/monitoring-modules/) to see what components you can track  
- ❓ [FAQ]({{ site.baseurl }}/faq/) for quick answers and “is this normal?” moments

If you enjoy learning how networks behave in the real world, PiNetBeacon gives you just enough visibility to feel confident without drowning you in jargon. You might even start spotting patterns your ISP would rather you didn’t notice.

[↑ Back to safety](#contents-choose-your-own-adventure){:.pb-back}
