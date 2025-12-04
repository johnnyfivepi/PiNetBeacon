---
layout: page
title: Automation
---

So you’ve got PiNetBeacon running, the dashboard looks great, and your Raspberry Pi is doing a tiny but noble job. Now, let’s make it do that job *without you having to remember anything*.

This guide shows you how to:

- Automatically run network checks on a schedule  
- Automatically start the dashboard server at boot  
- Stop doing the “SSH → run script → forget → repeat” dance

If you want PiNetBeacon to quietly take care of itself in the background, you’re in the right place. By the end, your Pi will quietly monitor your network whether you're watching it or not.

---

## Contents (choose your own adventure)

- 👋 [Before we dive in: cron, systemd, and the journal](#-before-we-dive-in-cron-systemd-and-the-journal)
- ⏱ [Automate network checks with cron](#-automate-network-checks-with-cron)
- 🖥 [Run the dashboard automatically with systemd](#-automatically-start-the-dashboard-with-systemd)
- 🧹 [(Optional) Automatically clean up old logs](#-optional-automatically-clean-up-old-logs)
- 🛠 [Managing your services](#-managing-your-services)
- 🕒 [Using cron (lightweight scheduling)](#-using-cron-lightweight-scheduling)
- 🤔 [systemd vs cron — which should *you* use?](#-systemd-vs-cron--which-should-you-use)
- 🐛 [Troubleshooting automation](#-troubleshooting-automation)
- 🧩 [Troubleshooting summary (Quick reference)](#-troubleshooting-summary-quick-reference)
- 📋 [Testing your automation](#-testing-your-automation)
- 🧪 [Automation Testing Checklist](#-automation-testing-checklist)
- 🎉 [Recap](#-recap-what-youve-set-up-or-are-about-to)

---

## 👋 Before we dive in: cron, systemd, and the journal

If your brain is quietly asking “wait, what's the difference between `cron`, `systemd`, and `journal` again?”, here’s the short version:  

- **cron** → “_When_ should this command run?”  
Think: “run this script every 5 minutes” or “run cleanup at 3 AM.”

- **systemd** → “_How_ should this long-running thing behave?”  
Think: “start this server at boot and restart it if it dies.”

- **journal** (`journalctl`) → “_What happened?_ Show me the logs.”  
Think: “did cron actually run that line?” or “why did the service fail?”

PiNetBeacon uses:

- **cron** to schedule `pinetbeacon_check.py`  
- **systemd** to keep the dashboard (`server.py`) running  
- **journal** to help you see what both of them have been up to.

[↑ Back to safety](#contents-choose-your-own-adventure){:.pb-back}

---

## ⏱ Automate network checks with cron

PiNetBeacon’s check script (`pinetbeacon_check.py`) is designed to be run over and over — like a tiny digital heartbeat for your network.

You *could* SSH into your Pi every 10 minutes and run it manually, but that’s extremely “Victorian-era computing.”  

Let’s have the Pi do it for you.

### Step 1 — Open your crontab

On your Raspberry Pi:

```bash
crontab -e
```

If it asks what editor you want to use, choose **nano** unless you enjoy pain.

### Step 2 — Add your schedule

To run the check every 5 minutes, add:

```cron
*/5 * * * * /usr/bin/python3 /home/pnb/PiNetBeacon/scripts/pinetbeacon_check.py >> /home/pnb/PiNetBeacon/data/logs/cron.log 2>&1
```

> 💡 **What does `>> cron.log 2>&1` do?**  
> `>> cron.log` means “append all normal output (stdout) to `cron.log`.”  
> `2>&1` means “also send error messages (stderr) to the same place.”  
> Bundled together like a happy little family, they make sure *everything* your script prints ends up in one log file instead of disappearing into the void.
{: .note}

> 💡 **Tip**  
> Always use absolute paths.
{: .tip}

### Step 3 — Save your crontab

In nano:

- **Ctrl + O** to save  
- **Enter** to confirm  
- **Ctrl + X** to exit  

Cron will automatically pick up the change.

### Step 4 — Verify your cron job is running

Run:

```bash
journalctl -u cron.service --since "15 minutes ago"
```

If you don’t see anything for your user or your command in the last few minutes, cron isn’t actually running your job yet.

If you see entries like:

```
CRON[8999]: (pnb) CMD (/usr/bin/python3 /home/pnb/PiNetBeacon/scripts/pinetbeacon_check.py >> /home/pnb/PiNetBeacon/data/logs/cron.log 2>&1)
```

Congrats! You’ve created a Pi that checks your network *on its own*, like a responsible adult.

[↑ Back to safety](#contents-choose-your-own-adventure){:.pb-back}

---

## 🖥 Automatically start the dashboard with systemd

Running `python3 server.py` manually is fine... **the first time.**

But you don’t want to SSH into your Pi every time it reboots just to bring the dashboard back. So, let’s make it **start itself** like a well-adjusted, independent service.

We’ll create a systemd service that launches the PiNetBeacon dashboard at boot.

### Step 1 — Create the service file

On your Raspberry Pi:

```bash
sudo nano /etc/systemd/system/pinetbeacon-dashboard.service
```

Paste this inside:

```ini
[Unit]
Description=PiNetBeacon Dashboard
After=network.target

[Service]
ExecStart=/usr/bin/python3 /home/pnb/PiNetBeacon/dashboard/server.py
WorkingDirectory=/home/pnb/PiNetBeacon/dashboard
StandardOutput=journal
StandardError=journal
Restart=always
RestartSec=5
User=pnb

[Install]
WantedBy=multi-user.target
```

Breakdown (because we’re thorough):

- **After=network.target** → waits for network before launching  
- **Restart=always** → if it crashes, it comes right back  
- **RestartSec=5** → don’t panic, try again in 5 seconds  
- **journal** output → logs appear in `journalctl`  

### Step 2 — Enable the service (start on boot)

```bash
sudo systemctl enable pinetbeacon-dashboard.service
```

This tells your Pi:

> “Hey, every time you wake up, start this thing.”

### Step 3 — Start it now

```bash
sudo systemctl start pinetbeacon-dashboard.service
```

Your dashboard is now running — no terminal window required.

### Step 4 — Check its status

```bash
sudo systemctl status pinetbeacon-dashboard.service
```

You should see happy green text like:

```
Active: active (running)
```

If it shows red text: don’t worry, that’s why we have logs.

### Step 5 — View logs (optional but satisfying)

```bash
journalctl -u pinetbeacon-dashboard.service -f
```

The `-f` flag makes it follow logs in real time —  
like `tail -f`, but with systemd swagger.

### Step 6 — Stop or restart (if ever needed)

Stop it:

```bash
sudo systemctl stop pinetbeacon-dashboard.service
```

Restart it:

```bash
sudo systemctl restart pinetbeacon-dashboard.service
```

🎉 **Your Pi now boots up with the dashboard already running.**  
You can plug it in across the room, across the house, or behind your couch forever — and the dashboard will still be there.

[↑ Back to safety](#contents-choose-your-own-adventure){:.pb-back}

---

## 🧹 (Optional) Automatically clean up old logs

If you leave PiNetBeacon running for weeks or months, your log file will happily grow and grow like a digital sourdough starter.

Most people don’t need infinite history — so here’s how to make your Pi tidy up after itself.

You’ve got **two options**:

1. A tiny Python cleanup script (more flexible)  
2. A simple cron command (quick and easy)

Pick whichever feels right for your soul.

### Option A — Use a small Python cleanup script (recommended)

Create a file called:

```bash
nano ~/PiNetBeacon/scripts/cleanup_logs.py
```

Paste this:

```python
#!/usr/bin/env python3
import os
import time

LOG_PATH = "/home/pnb/PiNetBeacon/data/logs/pinetbeacon.log.jsonl"
MAX_DAYS = 7  # delete entries older than 7 days

cutoff = time.time() - (MAX_DAYS * 86400)

if not os.path.exists(LOG_PATH):
    print("No log file found — nothing to clean.")
    exit(0)

new_lines = []
with open(LOG_PATH, "r") as f:
    for line in f:
        try:
            # each line is a JSON object
            ts = line.split('"timestamp": "')[1].split('"')[0]
            # convert UTC timestamp to epoch
            t_epoch = time.mktime(time.strptime(ts.split("+")[0], "%Y-%m-%dT%H:%M:%S.%f"))
            if t_epoch >= cutoff:
                new_lines.append(line)
        except:
            # keep malformed lines to avoid data loss
            new_lines.append(line)

with open(LOG_PATH, "w") as f:
    f.writelines(new_lines)

print(f"Cleanup complete. Remaining entries: {len(new_lines)}")
```

Make it executable:

```bash
chmod +x ~/PiNetBeacon/scripts/cleanup_logs.py
```

### Schedule it with cron

Edit your Pi’s cron table:

```bash
crontab -e
```

Add this line:

```
0 3 * * * /usr/bin/python3 /home/pnb/PiNetBeacon/scripts/cleanup_logs.py
```

This runs the cleanup every night at **3:00 AM**, when your Pi is presumably chilling.

### Option B — Super simple “truncate logs every X days”

If you don’t need fine-grained control and you’re okay wiping the entire file occasionally:

```
0 3 */5 * * truncate -s 0 /home/pnb/PiNetBeacon/data/logs/pinetbeacon.log.jsonl
```

This:

- runs every 5 days  
- sets the log file size to **zero bytes**  
- keeps the file itself intact  
- makes PiNetBeacon start fresh

It’s blunt... but it works.

> 💡 **Tip:**  
> If you ever want to archive logs instead of deleting them, you can rotate them with a single cron line.
{: .tip}

[↑ Back to safety](#contents-choose-your-own-adventure){:.pb-back}

---

## 🛠 Managing Your Services

Now that PiNetBeacon can start itself, let’s talk about *controlling* those little robots you’ve created.

This section teaches you:

- How to **start / stop / restart** your automatic services  
- How to **view logs**  
- How to **disable** automation if something goes sideways  
- How to choose between **systemd** and **cron**, depending on your vibe

Think of this as your Pi’s “remote control” — very official, totally non-intimidating.

### 🧰 Managing systemd services

If you set up PiNetBeacon using `systemd`, then congratulations: you’ve unlocked the *grown-up* way Linux likes to run things.

Here are the commands you’ll use most often for the dashboard service.

#### **Start a service manually**
```bash
sudo systemctl start pinetbeacon-dashboard.service
```

#### **Stop a service**
```bash
sudo systemctl stop pinetbeacon-dashboard.service
```

#### **Restart a service**
(Useful after making changes to scripts.)
```bash
sudo systemctl restart pinetbeacon-dashboard.service
```

#### **Enable a service on boot**
(If you forgot earlier or want to re-enable it.)
```bash
sudo systemctl enable pinetbeacon-dashboard.service
```

#### **Disable a service on boot**
```bash
sudo systemctl disable pinetbeacon-dashboard.service
```

#### **See service status**
(This one’s your best friend.)
```bash
systemctl status pinetbeacon-dashboard.service
```

This shows:  

- whether the service is active  
- whether it restarted automatically  
- any recent errors  
- the exact command systemd ran

#### **View logs (journal)**

```bash
journalctl -u pinetbeacon-dashboard.service --since "15 minutes ago"
```

Or follow logs in real time:

```bash
journalctl -u pinetbeacon-dashboard.service -f
```

> 💡 **Tip**  
> If something looks weird on the dashboard, checking the service logs is usually the fastest way to find out why.
{: .tip}

[↑ Back to safety](#contents-choose-your-own-adventure){:.pb-back}

---

## 🕒 Using Cron (lightweight scheduling)

`cron` is the classic Unix scheduler — simple, reliable, and basically immortal.  

If you don’t need full service management (or you just love nostalgia), `cron` is perfect.

Here are the commands you’ll actually use.

### **View your current cron jobs**

```bash
crontab -l
```

If you’ve never set up any jobs before, this might say:

```
no crontab for pi
```  

That's normal — it just means you’re fresh and unscheduled.

### **Edit your cron jobs**

```bash
crontab -e
```

The first time you open this, it’ll ask which editor you want. Choose **nano** unless you enjoy wrestling with old text editors.

Inside the file, you might add something like:

```cron
* * * * * /usr/bin/python3 /home/pnb/PiNetBeacon/scripts/pinetbeacon_check.py
```

This runs the check **every minute**.

> 📝 **Note:**  
> Cron won’t run if the path is wrong.  
> Use `which python3` and `realpath pinetbeacon_check.py` if you want to be extra sure.
{: .note}

### **Example: Run the dashboard server at boot**

This is *less common* with cron (systemd is better for long-running servers),  
but if you insist:

```cron
@reboot /usr/bin/python3 /home/pnb/PiNetBeacon/dashboard/server.py
```

Pi reboots → dashboard rises from the ashes like a slightly nerdy phoenix.

### **Remove a cron job**

Just run:

```bash
crontab -e
```

...and delete the line you don’t want anymore.

Hit `Ctrl + X` → `Y` → `Enter` to save.

### **Cron log debugging**

Cron doesn’t show output in the terminal — it quietly logs things like a raccoon behind a dumpster.

On Raspberry Pi OS (with `systemd`), cron logs go into the journal. View them with:

```bash
journalctl -u cron.service -f
```

Or filter and tail just the recent PiNetBeacon entries:

```bash
journalctl -u cron.service --since "15 minutes ago" | grep pinetbeacon
```

You'll see entries like:

```
CRON[8999]: (pnb) CMD (/usr/bin/python3 /home/pnb/PiNetBeacon/scripts/pinetbeacon_check.py >> /home/pnb/PiNetBeacon/data/logs/cron.log 2>&1)
```

If you don’t see your command in there, cron probably never executed your line.

> 💡 **Tip:**  
> Cron needs **absolute paths** — no shortcuts, no assumptions, no `~/scripts/whatever`.  
> Always use full paths in cron jobs.
{: .tip}

[↑ Back to safety](#contents-choose-your-own-adventure){:.pb-back}

---

> 🗺️ **Quick reminder: cron, systemd, and the journal**
>
> - **cron** → “_When_ should this command run?”  
>   Think: “run this script every 5 minutes” or “run cleanup at 3 AM.”
>
> - **systemd** → “_How_ should this long-running thing behave?”  
>   Think: “start this server at boot and restart it if it dies.”
>
> - **journal** (`journalctl`) → “_What happened?_ Show me the logs.”  
>   Think: “did cron actually run that line?” or “why did the service fail?”
>
> PiNetBeacon uses:
> - **cron** to schedule `pinetbeacon_check.py`  
> - **systemd** to keep the dashboard (`server.py`) running  
> - **journal** to help you see what both of them have been up to.
{: .note}

## 🤔 systemd vs cron — which should *you* use?

Both work, both are reliable, and both let your Pi run PiNetBeacon without babysitting. But they shine in different ways.

Here’s the friendly, judgment-free breakdown:

### 🟦 **Use systemd if…**

- You want the dashboard server (`server.py`) to **stay running forever**
- You want **auto-restart** if something crashes
- You need logs in one place
- You want precise control (start/stop/restart/status)
- You plan to move the Pi around and have everything “just work”

systemd is basically your Pi’s personal butler:
> “Good evening. I noticed your script crashed. I’ve restarted it for you.”

### 🟨 **Use cron if…**

- You only want to run the **check script every X minutes**
- You don’t need a dashboard running 24/7
- You like lightweight, old-school tools
- You want the simplest possible scheduling setup

cron is more like:
> “You want this done every minute? Sure thing. Nothing more, nothing less.”

### 🟩 **Use BOTH if…**

This is the magic combo for most PiNetBeacon setups:

- systemd → runs the dashboard server  
- cron → runs the check script every minute  

It gives you:

- A live dashboard  
- Fresh log entries  
- Automatic restarts  
- Zero manual work on reboot  

PiNetBeacon becomes a tiny self-maintaining appliance.

### 🧭 Still not sure?

Here’s the cheat sheet:

| Goal | Use |
|------|-----|
| Automatically run dashboard at boot | **systemd** |
| Automatically run check script on a schedule | **cron** |
| Auto-restart dashboard if it crashes | **systemd** |
| “Just run this every minute, please” | **cron** |
| Replace manual `python3 server.py` | **systemd** |
| Replace manual `python3 pinetbeacon_check.py` | **cron** |
| Want everything on autopilot | **Both** |

### 🎉 The good news?

You **can’t** make a wrong choice!

PiNetBeacon works with either tool, and you can switch at any time.

Just pick whichever feels less intimidating — or whichever makes you whisper  
“oh nice, that’s pretty cool” while setting it up.

[↑ Back to safety](#contents-choose-your-own-adventure){:.pb-back}

---

## 🐛 Troubleshooting automation

Automation is wonderful... until something doesn’t run, or logs stop appearing, or your Pi suddenly forgets how time works.  

Even with everything wired up correctly, Linux sometimes likes to be a little dramatic. Here are the most common automation issues and how to debug them without rage-rebooting your Pi.

If the dashboard feels “stuck” or your log file looks suspiciously empty, start here.

### 1. Cron isn’t running your check script

If you set up cron but nothing is happening, check whether cron is even executing your job.

Run:

```bash
journalctl -u cron.service --since "15 minutes ago"
```

You're looking for lines like:

```bash
CRON[8999]: (pnb) CMD (/usr/bin/python3 /home/pnb/PiNetBeacon/scripts/pinetbeacon_check.py ...)
```

If you don't see that, then cron never ran your script.

**Common causes:**

- The path to Python is wrong
(Check with `which python3`.)
- The path to your script is wrong
(Use `realpath ~/PiNetBeacon/scripts/pinetbeacon_check.py`.)
- You used `~/` in cron
→ Cron doesn’t know what `~` means. Always use absolute paths.
- You forgot to save the file in `crontab -e`
(Happens to the best of us.)

### 2. Your systemd service won’t start

If the dashboard server doesn’t automatically launch on boot, check its status:

```bash
systemctl status pinetbeacon-dashboard.service
```

Look for:

`Active: active (running)`  

If you see **red text** or **failed**, view logs:

```bash
journalctl -u pinetbeacon-dashboard.service -n 30 --no-pager
```

**Common causes:**

- Wrong file paths in your service file
- Missing `WorkingDirectory=`
- Python path mismatch
- Dependency ordering (e.g., Wi-Fi not ready yet)

If you edit the service file, always run:

```bash
sudo systemctl daemon-reload
sudo systemctl restart pinetbeacon-dashboard.service
```

### 3. Dashboard is blank even though services are running

If automation is working but the dashboard shows “No data yet...” or empty tables:

**Check that logs actually exist:**

```bash
ls -l ~/PiNetBeacon/data/logs/pinetbeacon.log.jsonl
```

If the file exists, inspect the last lines:

```bash
tail ~/PiNetBeacon/data/logs/pinetbeacon.log.jsonl
```

If the file is empty:

- cron may not be writing
- the check script may be erroring silently
- the Pi’s clock may be wrong (messing with timestamps)

Run a manual check to confirm:

```bash
python3 ~/PiNetBeacon/scripts/pinetbeacon_check.py
```

### 4. Your Pi’s clock is wrong

PiNetBeacon relies heavily on timestamps. If your Pi thinks it’s 1970 (yes, this happens), the dashboard will look bizarre.

Check NTP sync:

```bash
timedatectl
```

You want:

```
System clock synchronized: yes
NTP service: active
```

If not, restart time sync:

```bash
sudo systemctl restart systemd-timesyncd
```

And if you’re using Wi-Fi, make sure the Pi actually has a connection, as NTP won’t work offline.

### 5. Permission issues writing logs

If automation runs but your log file stays empty, check permissions:

```bash
ls -l ~/PiNetBeacon/data/logs
```

Your user (e.g., `pnb`) should own the folder and file.

If not, run:

```bash
sudo chown -R $USER:$USER ~/PiNetBeacon/data/logs
```

Or more explicitly:

```bash
sudo chown -R pnb:pnb ~/PiNetBeacon/data/logs
```

Systemd sometimes runs under different users. Double-check your service file’s `User=` if you added one.

### 6. Dashboard isn’t updating (old JS cached)

Browsers love caching JavaScript aggressively. If the dashboard layout looks old or nothing updates, try a hard refresh:

- **Mac:** ⌘ + Shift + R  
- **Windows:** Ctrl + Shift + R  
- **iOS Safari:** Close tab → reopen  

Or open an incognito/private window.

If that fixes it, clear your cache or add `?v=1.0` to script tags (done in the repo already).

[↑ Back to safety](#contents-choose-your-own-adventure){:.pb-back}

---

## 🧩 Troubleshooting summary (Quick reference)

If you’re the “skim the summary first” type — same — here’s the everything-is-on-fire table.

| Problem | What it *usually* means | Quick Fix |
|--------|---------------------------|-----------|
| ❌ Cron isn’t running the check script | Wrong paths, no permissions, or cron doesn’t know who you are | Use absolute paths; check with `journalctl -u cron.service --since "15 minutes ago"` |
| ❌ Dashboard empty even though scripts are running | Log file missing or empty | Run a manual check; verify log file exists and has entries |
| ❌ Dashboard server won’t start on boot | systemd service file issue | Check with `systemctl status` and reread logs |
| ❌ Dashboard loads but shows old UI | Browser cached old JS/CSS | Hard refresh or incognito window |
| ❌ Pi showing the wrong time | NTP not syncing | `timedatectl` → restart `systemd-timesyncd` |
| ❌ “Permission denied” writing logs | User mismatch in cron/systemd | `sudo chown -R pnb:pnb ~/PiNetBeacon/data/logs` |
| ❌ Script runs manually but not in cron | Paths wrong or Python missing | Use `/usr/bin/python3` and full absolute script path |
| ❌ Dashboard shows data only sometimes | Check script is failing intermittently | Look at `cron.log` or journal logs for errors |
| ❌ Everything broke at once | You edited the service file but forgot daemon-reload | Run `sudo systemctl daemon-reload` |
| ❌ Dashboard works but logs don’t rotate | Cleanup cron job not installed | Re-check `crontab -e` entry |

> 🧠 **Remember:**  
> 90% of automation problems are just:  
> **“Cron/systemd can’t find your files.”**  
>  
> The other 10% are:  
> **“Your Pi thinks it’s 1970.”**
{: .note}

[↑ Back to safety](#contents-choose-your-own-adventure){:.pb-back}

---

## 📋 Testing your automation

So you’ve set up cron, systemd, maybe even a tidy little cleanup script. Now it’s time to make sure everything actually works — *before* you unplug the Pi, walk away, and silently hope for the best.

This section is a quick, friendly checklist you can run through to confirm that:

- your check script is running automatically  
- your dashboard starts on boot  
- logs are being written  
- log cleanup (if enabled) is actually happening  
- nothing is secretly on fire 🔥  

Let’s verify that your Pi is successfully doing tiny robotics in the background.

### 🔍 Test #1 — Confirm the check script runs automatically (cron)

Let’s make sure PiNetBeacon is running checks on its own.

#### 1. Check that cron picked up the job

```bash
crontab -l
```

You should see your scheduled entry, something like:

```cron
*/5 * * * * /usr/bin/python3 /home/pnb/PiNetBeacon/scripts/pinetbeacon_check.py >> /home/pnb/PiNetBeacon/data/logs/cron.log 2>&1
``` 

If it’s there → great.  
If not → cron has ghosted you (fix by re-adding it).

#### 2. Wait a few minutes, then look for new log entries

```bash
tail -n 5 ~/PiNetBeacon/data/logs/pinetbeacon.log.jsonl
```

If you see a fresh timestamp within the last few minutes → 🎉 cron is alive.

If the timestamps are old (or the file is empty), cron isn’t running your script.

#### 3. Check cron activity directly in the journal

```bash
journalctl -u cron.service --since "15 minutes ago"
```

You want to see something like:

```
CRON[8999]: (pnb) CMD (/usr/bin/python3 /home/pnb/PiNetBeacon/scripts/pinetbeacon_check.py)
```

If you don't see entries like that, cron may not be executing the line — usually due to:

- wrong Python path  
- wrong script path  
- permissions  
- using `~` instead of full paths (cron hates `~`)

### 🔍 Test #2 — Confirm the dashboard starts automatically (systemd)

You want the dashboard server to launch itself on boot like a responsible adult. Let’s make sure systemd is doing its job.

#### 1. Check the service status

```bash
sudo systemctl status pinetbeacon-dashboard.service
```

You’re looking for:

```
Active: active (running)
```

If you see:

- **active (running)** → ✔️ Good  
- **failed** → ❌ Not good  
- **inactive** → service hasn’t been enabled

#### 2. Reboot your Pi (the real test)

```bash
sudo reboot
```

Give it 30–60 seconds. Then, from another device on the same network, open:

```
http://pinetbeacon.local:8080/
```

or

```
http://<pi-ip-address>:8080/
```

If the dashboard loads without you manually running `server.py`, systemd passed with flying colors.

#### 3. Check logs after reboot (optional but satisfying)

```bash
journalctl -u pinetbeacon-dashboard.service -b
```

The `-b` flag shows logs *from the current boot*. You’ll see things like:

```
Started PiNetBeacon Dashboard.
Listening on http://0.0.0.0:8080/
```

If you see errors, systemd probably isn’t pointing at the right Python path or working directory.

### 🧹 Test #3 — Verify automatic log cleanup (optional)

If you set up automatic log cleanup (either via a Python script or a cron truncate command), let’s make sure it’s actually tidying up and not just *promising* to.

#### 1. Check the current log size

Run:

```bash
ls -lh ~/PiNetBeacon/data/logs/pinetbeacon.log.jsonl
```

You’ll see something like:

```
-rw-r--r-- 1 pnb pnb 48K Nov 23 09:42 pinetbeacon.log.jsonl
```

Make a note of the size.

#### 2. Trigger your cleanup manually

If you used the **Python cleanup script**:

```bash
/usr/bin/python3 ~/PiNetBeacon/scripts/cleanup_logs.py
```

If you used a **cron truncate rule**, simulate it manually:

```bash
truncate -s 0 ~/PiNetBeacon/data/logs/pinetbeacon.log.jsonl
```

Running these manually is perfectly safe — you're simply testing.

#### 3. Check the log file again

```bash
ls -lh ~/PiNetBeacon/data/logs/pinetbeacon.log.jsonl
```

If cleanup worked, you’ll see either:

- a smaller file  
- or a zero-byte file (if using truncate)  
- or fewer lines (if using the Python script)

To confirm line count:

```bash
wc -l ~/PiNetBeacon/data/logs/pinetbeacon.log.jsonl
```

#### 4. Check Cron’s logs (if cleanup is scheduled)

```bash
journalctl -u cron.service --since "1 hour ago" | grep cleanup_logs.py
```

(or whatever your cleanup script is called)

Or, follow it live:

```bash
journalctl -u cron.service -f
```

You should see entries that look like:

```
CRON[1234]: (pnb) CMD (/usr/bin/python3 /home/pnb/PiNetBeacon/scripts/cleanup_logs.py)
```

If you don’t see them, cron may not be firing.

> 💡 **Tip:**  
> Cron won’t run your script unless every path is absolute.  
> A single missing directory in the path → cron silently refuses to run it.
{: .tip}

[↑ Back to safety](#contents-choose-your-own-adventure){:.pb-back}

---

## 🧪 Automation Testing Checklist

Use this checklist to confirm that PiNetBeacon is officially running itself  
(so you don’t have to).

If you can check off every item here, you’ve achieved **Pi Enlightenment**.

### ✅ Network checks (cron)

- [ ] `crontab -l` shows your check job  
- [ ] `journalctl -u cron.service --since "15 minutes ago"` shows the job actually running  
- [ ] `tail ~/PiNetBeacon/data/logs/pinetbeacon.log.jsonl` shows **new entries** appearing over time  
- [ ] Log entries contain:
  - [ ] timestamp  
  - [ ] status (`up` / `down`)  
  - [ ] latency  
  - [ ] packet loss  
  - [ ] notes  

If logs aren’t growing → something’s wrong.  
If logs *won’t stop* growing → everything is working beautifully (but go set up cleanup 😄).

### ✅ Dashboard server (systemd)

- [ ] `systemctl status pinetbeacon-dashboard.service` shows **active (running)**  
- [ ] Dashboard loads in your browser at:  
  - [ ] `http://pinetbeacon.local:8080/`  
    *or*  
  - [ ] `http://<your-pi-ip>:8080/`  
- [ ] The page **auto-refreshes every 30 seconds**  
- [ ] The page shows:
  - [ ] last status  
  - [ ] average latency  
  - [ ] availability  
  - [ ] recent checks  
  - [ ] health JSON  

If the dashboard loads but shows **no data**, double-check the check script and logs.

### 🧴 Log cleanup (optional but recommended)

If you set up cleanup:

- [ ] Cleanup script runs manually  
- [ ] Cron shows cleanup events  
- [ ] Log file shrinks or rotates as expected  
- [ ] `wc -l ~/PiNetBeacon/data/logs/pinetbeacon.log.jsonl` shows fewer lines after cleanup
- [ ] No errors printed by the cleanup script  

If you skipped this step → totally fine. Your Pi will simply become a **historian** over time.  

### 🔁 Reboot test (the big one)

This is the ultimate validation that everything is automated.

- [ ] You reboot the Pi  
- [ ] You do *not* SSH into it  
- [ ] After 1–2 minutes:
  - [ ] Dashboard loads by itself  
  - [ ] Cron resumes writing logs  
  - [ ] Everything looks normal  
- [ ] You celebrate with a snack  

If the dashboard doesn’t come back → systemd needs tweaking.  
If logs don’t resume → cron needs tweaking.  
If *both* come back → you’ve achieved automation greatness.

### 🧘 Bonus: Sanity checks

- [ ] `timedatectl` shows the Pi’s clock is synchronized  
- [ ] Your config file (`config.json`) is valid JSON  
- [ ] Your Pi isn’t overheating (it probably isn’t, but still nice to check)  
- [ ] You can unplug the Pi, move it across the room, plug it back in — and everything still works  

### 🎉 If everything above is checked off...

You now have a **self-running, self-healing, auto-starting, low-maintenance network monitor** powered by a $20 computer that fits in your hand.

Most people never get their Pi this organized. You should feel extremely proud. Your Pi certainly does.

[↑ Back to safety](#contents-choose-your-own-adventure){:.pb-back}

---

## 🎉 Recap: What you’ve set up (or are about to!)

Let’s review everything your Raspberry Pi will be doing *automatically* once you finish this guide.

This way, you know exactly what’s running, where, and why — no mystery background tasks, no surprises, no “wait who started THIS?” moments.

### ✅ **1. Automated network checks** (via cron)

PiNetBeacon will run:

```
python3 ~/PiNetBeacon/scripts/pinetbeacon_check.py
```

automatically every minute (or whatever schedule you choose).

This keeps your log file fresh with:

- latency  
- packet loss  
- overall status  
- timestamps  

No manual typing required. Your Pi is now a tiny, punctual network monitor.

### ✅ **2. Dashboard server that starts on boot** (via systemd)

Your dashboard server:

```
python3 ~/PiNetBeacon/dashboard/server.py
```

starts **the moment your Pi boots**, thanks to systemd.

That means:

- you can plug the Pi in anywhere  
- you can walk away  
- and a minute later the dashboard is already alive  
- updating itself every 30 seconds  

You never have to SSH in and re-run the server manually again.

### ✅ **3. Automatic restart if anything crashes**

If the dashboard dies?  
systemd quietly restarts it.

If the Pi loses power and comes back?  
Everything comes back with it.

If the network drops for a second?  
The check script keeps writing logs as soon as it can reach the target again.

PiNetBeacon becomes *self-healing*.

### 📦 **Altogether, here’s what your Pi is doing now:**

| Task | Tool | Behavior |
|------|------|----------|
| Running monitoring checks | cron | Every minute (or schedule you set) |
| Running dashboard server | systemd | Starts on boot & auto-restarts |
| Updating dashboard | app.js | Every 30 seconds in your browser |
| Writing log entries | pinetbeacon_check.py | JSON Lines at `data/logs/pinetbeacon.log.jsonl` |

Your Pi is officially a small but mighty network appliance.

### 🎉 **Once this is set up...**

You can unplug the Pi from your laptop...  
take it across the room...  
leave it behind your TV...  
ignore it for weeks...  

...and everything will still work.

That's the magic of automation. 🪄

[↑ Back to safety](#contents-choose-your-own-adventure){:.pb-back}


