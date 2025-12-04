---
layout: page
title: Getting started
nav_order: 1
---

# Getting started

Welcome! This page walks you through setting up PiNetBeacon on your Raspberry Pi. You don’t need any networking background to follow along. We’ll take things step by step and explain some details as we go so nothing feels mysterious.

If this is your first time SSHing into a Raspberry Pi or installing a tool like this, you’re in the right place. Think of this page as a friendly guide standing beside you saying, “Yep, this is normal, you’re doing great.”

---

## Contents (choose your own adventure)

- 📦 [What you'll need](#-what-youll-need)
- 💿 [Flash Raspberry Pi OS Lite with Raspberry Pi Imager (v2.0)](#-flash-raspberry-pi-os-lite-with-raspberry-pi-imager-v20)
- 🔧 [Install dependencies](#-install-dependencies)
- 📥 [Clone the repository](#-clone-the-repository)
- 📝 [Configure PiNetBeacon](#-configure-pinetbeacon)
- 🏃‍♂️ [Run your first check](#️-run-your-first-check)
- ✨ [Next steps](#-next-steps)

---

## 📦 What you'll need

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

[↑ Back to safety](#contents-choose-your-own-adventure){:.pb-back}

---

## 💿 Flash Raspberry Pi OS Lite with Raspberry Pi Imager (v2.0)

PiNetBeacon runs best on **Raspberry Pi OS Lite (64-bit)** — the fast, minimal version without a desktop environment. With Raspberry Pi Imager v2.0, flashing the OS and pre-configuring Wi-Fi + SSH is easier than ever.

Here’s how to get your microSD card fully prepared:

### **1. Install and open Raspberry Pi Imager**

Download the official Imager (now 2.0) from:  
[https://www.raspberrypi.com/software/](https://www.raspberrypi.com/software/)

Insert your microSD card and launch the app.

### **2. Select your device**

Click **Device**, then choose your Pi model (e.g., Raspberry Pi Zero 2 W):

![Select device](../assets/images/imager-device.png)

### **3. Select the operating system**

Go to:

**Operating System → Raspberry Pi OS (other)**  

Then select:

**Raspberry Pi OS Lite (64-bit)**

![Choose OS Lite](../assets/images/imager-os2.png)

### **4. Select your storage**

Choose your microSD card from the storage list:

![Select storage](../assets/images/imager-storage.png)

Once **Device**, **OS**, and **Storage** are all filled in, the **Next** button becomes available.

### **5. Apply OS customisation**

Customisation is where we set Wi-Fi, SSH, username, password, and more.

### **6. Customisation — hostname, localisation, username, Wi-Fi**

Set your **hostname**, something like:

`PiNetBeacon`

![Hostname](../assets/images/imager-customisation1.png)

Then set your **localisation** (capital city, time zone, keyboard layout):

![Localisation](../assets/images/imager-localisation.png)

Next, create the username + password you’ll use to log in via SSH:

![User settings](../assets/images/imager-user.png)

Finally, configure Wi-Fi:

![Wi-Fi settings](../assets/images/imager-wifi.png)

> 💡 **Password tip:**  
> Make sure the password you choose here is something you can remember, or save it somewhere secure (like 1Password or Bitwarden). This is the password you’ll use every time you connect to your Pi over SSH, so if you forget it, you'll likely need to rewrite the SD card.
{: .tip}

### **7. Remote access — enable SSH**

Go to the **Remote Access / SSH** section (Imager 2.0’s layout varies slightly by OS type).

Enable SSH → choose **Use password authentication**.

![SSH settings](../assets/images/imager-ssh.png)

> PiNetBeacon requires SSH so you can set everything up headlessly.

### **8. Raspberry Pi Connect (leave disabled)**

Imager may offer "Raspberry Pi Connect" — leave this turned **off** for now.

![Pi Connect disabled](../assets/images/imager-raspberrypiconnect.png)

### **9. App Options — optional but useful**

Click the **App Options** button at the bottom left and enable **Eject media when finished** to avoid file-system warnings later.

![App options](../assets/images/imager-appoptions.png)

### **10. Review your settings**

Imager shows a summary before writing:

![Write summary](../assets/images/imager-write.png)

- Hostname configured  
- Localisation configured  
- User account configured  
- Wi-Fi configured  
- SSH enabled  

Click **Write** and wait for the image to finish flashing.

### **11. Insert the microSD card and power on your Pi**

Give it about **60–90 seconds** to boot and join your Wi-Fi.

### **12. SSH into your Raspberry Pi**

Try connecting by hostname:

```bash
ssh <your-username>@pinetbeacon.local
```

If that doesn’t work, use your router’s device list to find the Pi’s IP address:

```bash
ssh <your-username>@<pi-ip-address>
```

Once you're in, your Pi is officially alive, online, and ready for PiNetBeacon.

> 📘 **More info:**  
> The Raspberry Pi Foundation maintains full documentation for the Imager, including all OS customization options: [Official Raspberry Pi Imager documentation](https://www.raspberrypi.com/documentation/computers/getting-started.html#getting-started-imaging-your-raspberry-pi)
{: .note}

[↑ Back to safety](#contents-choose-your-own-adventure){:.pb-back}

---

## 🔧 Install dependencies

PiNetBeacon uses Python, which is already included on Raspberry Pi OS Lite. To make sure everything is up to date, install Python and pip with:

```bash
sudo apt update
sudo apt upgrade -y
sudo apt install -y python3 python3-pip
```

Later on, if PiNetBeacon includes additional Python packages, they’ll be listed in a `requirements.txt` file. You can install those at any time with:

```bash
pip3 install -r requirements.txt
```

Once Python and pip are ready, your Pi has everything it needs to run PiNetBeacon’s modules and log data.

[↑ Back to safety](#contents-choose-your-own-adventure){:.pb-back}

---

## 📥 Clone the repository

Now that your Raspberry Pi is running and you can connect to it over SSH, you’re ready to download PiNetBeacon.

Navigate to the home directory on your Pi and clone the project:

```bash
git clone https://github.com/johnnyfivepi/PiNetBeacon.git
cd PiNetBeacon
```

This creates a new folder containing all of PiNetBeacon’s files, and it keeps everything organized in one place. You’ll run commands from inside this directory throughout the rest of the setup.

[↑ Back to safety](#contents-choose-your-own-adventure){:.pb-back}

---

## 📝 Configure PiNetBeacon

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

[↑ Back to safety](#contents-choose-your-own-adventure){:.pb-back}

---

## 🏃‍♂️ Run your first check

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

[↑ Back to safety](#contents-choose-your-own-adventure){:.pb-back}

---

## ✨ Next steps

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

[↑ Back to safety](#contents-choose-your-own-adventure){:.pb-back}
