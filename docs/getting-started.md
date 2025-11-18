---
layout: page
title: Getting started
---

# Getting started

Welcome! This page walks you through setting up PiNetBeacon on your Raspberry Pi. You don’t need any networking background to follow along. We’ll take things step by step and explain some details as we go so nothing feels mysterious.

If this is your first time SSHing into a Raspberry Pi or installing a simple tool like this, you’re in the right place. Think of this page as a friendly guide standing beside you saying, “Yep, this is normal, you’re doing great.”

---

## Contents (choose your own adventure)

- 📦 [What you'll need](#what-youll-need)
- 💿 [Install Raspberry Pi OS Lite](#install-raspberry-pi-os-lite)
- 📥 [Clone the repository](#clone-the-repository)
- 🔧 [Install dependencies](#install-dependencies)
- 📝 [Configure PiNetBeacon](#configure-pinetbeacon)
- 🏃‍♂️ [Run your first check](#run-your-first-check)
- ✨ [Next steps](#next-steps)

---

## What you'll need

Here’s the short list of things you need before starting:

- **A Raspberry Pi**<br>
  Zero 2 W, Zero W, Pi 3, Pi 4, or anything newer that isn’t powered by steam.
- **A microSD card**<br>
  8 GB or larger works fine.
- **A way to connect your Pi to your home network**<br>
  Wi-Fi is totally okay for this project.
- **A computer that can SSH into the Pi**<br>
  Any Mac, Windows, or Linux machine works.

> 💡 **What is SSH?**  
> SSH lets you open a command line on your Raspberry Pi from your computer. It’s like a long-distance keyboard for your Pi. If you’ve never used SSH before, don’t worry. The commands here are simple, and we’ll point out exactly where to type them.
{: .tip}

---

## Install Raspberry Pi OS Lite

PiNetBeacon runs well on Raspberry Pi OS Lite, which is the streamlined, no-desktop version of the operating system. It keeps things clean and efficient, and you won’t miss the graphical interface for this project.

Here’s how to get it onto your microSD card:

1. Install the Raspberry Pi Imager on your computer.  
   You can download it from: https://www.raspberrypi.com/software/

2. In the Imager, choose **Raspberry Pi OS Lite (64-bit)** as your operating system.

3. Before writing the image, click the gear icon to open advanced settings.  
   Enable **SSH** and set a username and password. This lets you connect to your Pi without attaching a monitor or keyboard.

4. Insert your microSD card, write the image, and let the Imager finish the setup.

5. Place the card into your Raspberry Pi, power it on, and give it a minute to start up.

Once it’s on your network, you can connect to it over SSH:

```bash
ssh username@raspberrypi.local
```

If that doesn’t work right away, you can use the Pi’s IP address instead. Your router’s device list will usually show it.

After this step, your Raspberry Pi is ready for PiNetBeacon.

[↑ Back to safety](#getting-started)

---

## Clone the repository

Once your Raspberry Pi is running and you can connect to it over SSH, you’re ready to download PiNetBeacon.

Navigate to the home directory on your Pi and clone the project:

```bash
git clone https://github.com/YOUR-USERNAME/PiNetBeacon.git
cd PiNetBeacon
```

This creates a new folder containing all of PiNetBeacon’s files, and it keeps everything organized in one place. You’ll run commands from inside this directory throughout the rest of the setup.

[↑ Back to safety](#getting-started)

---

## Install dependencies

PiNetBeacon uses Python, which is already included on Raspberry Pi OS Lite. To make sure everything is up to date, install Python and pip with:

```bash
sudo apt update
sudo apt install -y python3 python3-pip
```

Later on, if PiNetBeacon includes additional Python packages, they’ll be listed in a `requirements.txt` file. You can install those at any time with:

```bash
pip3 install -r requirements.txt
```

Once Python and pip are ready, your Pi has everything it needs to run PiNetBeacon’s modules and log data.

[↑ Back to safety](#getting-started)

---

## Configure PiNetBeacon

Now you’ll tell PiNetBeacon what to watch and how often to check things.

Inside the `scripts` folder there is an example configuration file:

```bash
cd scripts
cp config.example.json config.json
nano config.json
```

The `config.json` file controls details such as:

- which host to ping  
- how many packets to send  
- timeout settings  
- where log files should be written  

You can think of this as PiNetBeacon’s checklist. Instead of hard-coding values inside the script, you adjust them here in one place.

Take a moment to read through the fields and their comments. Update anything you want to customize, then save and close the file.

If you are using `nano`, you can save with:

- `Ctrl + O` to write the file  
- `Enter` to confirm  
- `Ctrl + X` to exit

[↑ Back to safety](#getting-started)

---

## Run your first check

You're ready to see PiNetBeacon in action. From inside the `scripts` directory, run:

```bash
python3 pinetbeacon_check.py
```

You should see a short line of output that shows:

- the host you checked  
- the average latency  
- how many packets returned  
- PiNetBeacon’s interpretation of the result  

Behind the scenes, the script also writes an entry to:

```
../data/logs/pinetbeacon.log.jsonl
```

If that file appears and the new entry looks reasonable, congratulations. PiNetBeacon is officially awake and paying attention to your network.

If you don’t see a log entry or something looks unusual, don’t worry. The FAQ page covers common issues, and you can always run the check again while adjusting your config.

[↑ Back to safety](#getting-started)

---

## Next steps

Once your first check is running, you're in great shape. PiNetBeacon is already collecting useful information about your network, and you can build on that in a few different ways.

Here are good places to go next:

- Set up PiNetBeacon to run on a schedule with `cron`  
  (for example, every minute or every five minutes)

- Explore the log format  
  It’s designed to be readable by both humans and tools.

- Visit the dashboard  
  You can view your recent results in a clean, visual layout right in your browser.

- Learn more about what's happening behind the scenes  
  The [How it works]({{ site.baseurl }}/how-it-works/) page gives a friendly overview of the concepts PiNetBeacon uses.

As you get comfortable, feel free to fork the project, customize modules, or suggest ideas. PiNetBeacon is meant to be approachable for newcomers and interesting for hobbyists who want to explore how their network behaves over time.

[↑ Back to safety](#getting-started)
