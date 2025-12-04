<h1 align="center">📡🕊  PiNetBeacon  🕊📡</h1>

<p align="center">
  <em>Lightweight Raspberry Pi network monitor for curious hobbyists.</em>
</p>

<p align="center">

  <!-- Core Info -->
  <img src="https://img.shields.io/badge/Project%20Type-CLI%20Tool%20%2B%20Dashboard-8A2BE2?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Platform-Raspberry%20Pi-lightgrey?style=for-the-badge&logo=raspberrypi&logoColor=C51A4A" />
  <img src="https://img.shields.io/badge/OS-Raspberry%20Pi%20OS%20Lite-red?style=for-the-badge&logo=raspberrypi&logoColor=white" />

  <!-- Tech -->
  <img src="https://img.shields.io/badge/Built%20With-Python-3776AB?style=for-the-badge&logo=python&logoColor=white" />
  <img src="https://img.shields.io/badge/Interface-CLI%20%2B%20Web%20UI-ff69b4?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Scope-Lightweight%20Monitoring-yellow?style=for-the-badge" />

  <!-- Audience + Status -->
  <img src="https://img.shields.io/badge/Status-Active-success?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Audience-Hobbyists%20%7C%20Beginners%20%7C%20Homelabbers-blue?style=for-the-badge" />
  <img src="https://img.shields.io/github/stars/johnnyfivepi/PiNetBeacon?style=for-the-badge&label=Stars&color=brightgreen">  
  <br>
  <!-- Open source + License -->  
  <img src="https://img.shields.io/badge/Open%20Source-Yes-1572B6?style=for-the-badge" />
  <img src="https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge" />

</p>

**PiNetBeacon** is a lightweight, Raspberry Pi–friendly network monitor.

It runs tiny, scheduled checks from your Pi (including the **Raspberry Pi Zero W**) and logs what your home internet is actually doing: latency, outages, and DNS health. It also comes with a simple web dashboard and beginner-friendly documentation.

Think of it as a small **beacon** in your network — quietly watching, logging, and shining a light on what's going on.

---

## 📚 Table of contents

- ✨ [Why PiNetBeacon?](#-why-pinetbeacon)
- 📡 [What PiNetBeacon does](#-what-pinetbeacon-does)
- 🛠️ [Hardware requirements](#️-hardware-requirements)
- 🚀 [Quick start](#-quick-start-high-level)
- 📊 [The dashboard](#-the-dashboard)
- 🤖 [Automation](#-automation)
- 📝 [Example log entry](#-example-log-entry)
- 📄 [Documentation](#-documentation)
- 🎓 [Designed for learning](#-designed-for-learning)
- 💻 [Development setup (VS Code)](#-development-setup-vs-code)
- 🤝 [Contributing](#-contributing)
- 📄 [License](#-license)

---

## ✨ Why PiNetBeacon?

There are plenty of heavyweight monitoring stacks out there (Prometheus, Grafana, etc.). They're awesome, but they can be overkill if you just want to know:

- “Is my ISP flaky, or is it just me?”
- “How often does my internet actually drop?”
- “Is my latency getting worse at certain times of day?”
- “Is DNS slow or failing?”

PiNetBeacon focuses on:

- 🕊 **Simplicity** – no containers, no huge databases
- 🧠 **Education** – explains *why* we’re doing each step, not just “run this command”
- 🧩 **Extensibility** – small modules you can tweak or extend
- 🧸 **Beginner-friendly** – you don’t need to be a network engineer to use this

[↑ Back to top](#-table-of-contents)

---

## 📡 What PiNetBeacon does

At a high level:

1. **Runs small checks** at a schedule (via `cron` or systemd timer)
   - ICMP ping to a target (e.g. `1.1.1.1` or `8.8.8.8`)
   - DNS resolution checks (e.g. lookup `example.com`)
2. **Writes results to a log file** (JSON Lines format)
3. **Optionally powers a tiny dashboard**, which displays:
   - latency over time
   - up/down classifications
   - timestamps of recent outages

No big database. No containers. Just small files and a clear story.

[↑ Back to top](#-table-of-contents)

---

## 🛠️ Hardware requirements

PiNetBeacon is intentionally light.

Tested / intended for:

- ✅ Raspberry Pi Zero W / Zero 2 W
- ✅ Raspberry Pi 3 / 4 / 5
- ✅ Any other Pi running Raspberry Pi OS Lite
- ✅ Should work on any Linux box with Python 3 and basic tools

If you're using a **Pi Zero 2 W**, you're in the right place. The documentation includes Zero-friendly tips and constraints where it matters.

[↑ Back to top](#-table-of-contents)

---

## 🚀 Quick start (high-level)

Full, step-by-step instructions live in the [docs site](./docs), but here’s the bird’s-eye view:

### 1. Prepare your Raspberry Pi

- Install **Raspberry Pi OS Lite**
- Connect your Pi to the internet  
- Make sure **SSH is enabled** so you can access the Pi from another computer

### 2. Clone this repository

```bash
git clone https://github.com/johnnyfivepi/PiNetBeacon.git
cd PiNetBeacon
```

### 3. Install Python dependencies

PiNetBeacon is very small and uses only a few standard packages. To install them:

```bash
sudo apt update
sudo apt install -y python3 python3-pip
```

If you add a requirements.txt file later, you would install it like this:

```bash
pip3 install -r requirements.txt
```

### 4. Copy and edit your config file

```bash
cd scripts
cp config.example.json config.json
nano config.json
```

You can change things such as:

- which host to ping
- how many packets to send
- timeout settings
- where logs should be written

Save the file and exit the editor.

### 5. Run a test check

```bash
python3 pinetbeacon_check.py
```

If everything is set up correctly, you'll see a log entry appear in the data/logs folder:

```
data/logs/pinetbeacon.log.jsonl
```

### 6. Optional: Set up a schedule

You can use cron or a systemd timer to run the check every minute or every few minutes. The documentation includes detailed examples with explanations of how each schedule works.

### 7. Optional: View the dashboard

PiNetBeacon includes a small dashboard so you can see recent checks in your browser.

1. On your Pi, start the dashboard server:

   ```bash
   cd ~/PiNetBeacon/dashboard
   python3 server.py
   ```

   You should see something like:

   ```bash
   PiNetBeacon dashboard running on http://0.0.0.0:8080/  
   Serving logs from: /home/pnb/PiNetBeacon/data/logs/pinetbeacon.log.jsonl  
   Press Ctrl+C to stop.
   ```

2. On your computer, open a browser and visit:

   - `http://pinetbeacon.local:8080/`
   - or `http://YOUR-PI-IP:8080/` (for example `http://192.168.1.96:8080/`)

3. Click **Refresh now** in the dashboard.

   This will show your most recent log information in a simple visual format. You should see:  

   - the latest status (up / down)
   - average latency across recent checks
   - availability as a percentage
   - a table of recent log entries
   - a small “Dashboard health” JSON box at the bottom

   If the dashboard says there is no data yet, run a few manual checks on the Pi:

   ```bash
   cd ~/PiNetBeacon/scripts
   python3 pinetbeacon_check.py
   python3 pinetbeacon_check.py
   python3 pinetbeacon_check.py
   ```

   Then, refresh the dashboard again.

> 📝 **Note:**  
> The dashboard only updates while the dashboard server is actively running on your Pi. This is because it reads live data from:
>
> - `/api/logs/latest`
> - `/api/health`
>
> Running one-off checks *does* add entries to:
>
> ```
> data/logs/pinetbeacon.log.jsonl
> ```
>
> ...but those entries won’t appear in the dashboard until the server is running **and** you click **Refresh now**.

[↑ Back to top](#-table-of-contents)

---

## 📊 The Dashboard

PiNetBeacon includes a tiny, Zero-friendly web dashboard so you can **visualize** what your network has been doing — no Grafana, no heavy dependencies, no setup pain.

Once running, the dashboard shows:

- ⭐ **Last status** (up / down)
- ⚡ **Average latency** across recent checks
- 📈 **Availability** as a percentage
- 📋 **Recent checks table**
- 🩺 **Dashboard health JSON** (quick debugging snapshot)

Everything is read directly from:

```
data/logs/pinetbeacon.log.jsonl
```

No database, no backend frameworks - just Python + static files.

### ▶️ Starting the dashboard

On your Pi:

```bash
cd ~/PiNetBeacon/dashboard
python3 server.py
```

You'll see something like:

```
PiNetBeacon dashboard running on http://0.0.0.0:8080/
Serving logs from: /home/pnb/PiNetBeacon/data/logs/pinetbeacon.log.jsonl
Press Ctrl+C to stop.
```

### 🌐 Open the dashboard in your browser

From any device on the same network:

- `http://pinetbeacon.local:8080/`
- or `http://<YOUR-PI-IP>:8080/`
(e.g., `http://192.168.1.96:8080/`)

Click **Refresh now** to pull fresh data.

### 🔁 Automatic refresh

The dashboard auto-updates every 30 seconds, using lightweight JS to fetch:

- `/api/logs/latest`
- `/api/health`

If the table shows “No data yet...”, just run a few test checks:

```bash
cd ~/PiNetBeacon/scripts
python3 pinetbeacon_check.py
python3 pinetbeacon_check.py
```

Then refresh the dashboard.

### 🧼 Optional: Run the dashboard automatically at boot

The recommended way is with **systemd**, using the service file included in the docs:

```
pinetbeacon-dashboard.service
```

Once enabled, your Pi will reboot → wait 20–30 seconds → dashboard is live.

[↑ Back to top](#-table-of-contents)

---

## 🤖 Automation

PiNetBeacon becomes *truly* useful when your Raspberry Pi runs everything **on its own** — no manual commands, no forgotten scripts, no “oh crap, I rebooted the Pi and the dashboard died.”

Automation uses two tools:

- **cron** → schedules your *network checks*  
- **systemd** → keeps your *dashboard server* alive

You can use one or both. Most people use **both**.

### ⏱ Automating network checks (cron)

Cron is the classic Linux scheduler — simple, lightweight, reliable.

Edit your cron table:

```bash
crontab -e
```

Run the check every 5 minutes:

```
*/5 * * * * /usr/bin/python3 /home/pnb/PiNetBeacon/scripts/pinetbeacon_check.py >> /home/pnb/PiNetBeacon/data/logs/cron.log 2>&1
```

This logs *both* normal output (`stdout`) and errors (`stderr`) into `cron.log`.

View recent cron activity:

```
journalctl -u cron.service --since "15 minutes ago"
```

You should see entries like:

```
CRON[8999]: (pnb) CMD (/usr/bin/python3 /home/pnb/PiNetBeacon/scripts/pinetbeacon_check.py ...)
```

### 🖥 Running the dashboard automatically (systemd)

Systemd is the grown-up way to run long-lived services.

Create the service:

```bash
sudo nano /etc/systemd/system/pinetbeacon-dashboard.service
```

Recommended service file:

```
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

Enable + start:

```
sudo systemctl enable pinetbeacon-dashboard.service
sudo systemctl start pinetbeacon-dashboard.service
```

Check status:

```
sudo systemctl status pinetbeacon-dashboard.service
```

View live logs:

```
journalctl -u pinetbeacon-dashboard.service -f
```

If your Pi reboots → the dashboard comes back automatically.

### 🧹 Optional: Automatic log cleanup

If you monitor for weeks/months, your JSONL file will grow.

Use the included `cleanup_logs.py` script:

```
/usr/bin/python3 ~/PiNetBeacon/scripts/cleanup_logs.py
```

Schedule it nightly:

```
0 3 * * * /usr/bin/python3 /home/pnb/PiNetBeacon/scripts/cleanup_logs.py >> /home/pnb/PiNetBeacon/data/logs/cleanup.log 2>&1
```

### 🧠 systemd vs cron — which should you use?

Both tools are great — they just shine in different roles. Here’s the friendly cheat sheet:

| Goal | Use |
|------|-----|
| Run dashboard 24/7 | **systemd** |
| Run check script every X minutes | **cron** |
| Auto-restart dashboard when it crashes | **systemd** |
| Super lightweight scheduling | **cron** |
| Full “appliance mode” | **Both** |

### ⭐ Recommended setup

- **systemd** → dashboard  
- **cron** → network checks  

This gives you a Pi that behaves like a self-maintaining network appliance.

[↑ Back to top](#-table-of-contents)

---

## 📝 Example Log Entry

PiNetBeacon writes logs as **one complete JSON object per line**. This format is called **JSON Lines (JSONL)**. Each line represents **one network check**, fully self-contained and easy for tools to parse.

```jsonl
{"timestamp": "2025-01-17T14:32:10Z", "target_host": "1.1.1.1", "avg_latency_ms": 26.4, "packet_loss_percent": 0.0, "status": "up", "notes": "baseline check"}
{"timestamp": "2025-01-17T14:33:11Z", "target_host": "1.1.1.1", "avg_latency_ms": 27.8, "packet_loss_percent": 0.0, "status": "up", "notes": "baseline check"}
```

> 💡 **Why JSON Lines?**  
> - Easy for humans to skim
> - Easy to append to without rewriting the whole file
> - Plays nicely with Unix tools (grep, tail -f, jq)
> - Works well with log processors and data pipelines

[↑ Back to top](#-table-of-contents)

---

## 📄 Documentation

PiNetBeacon includes a full set of beginner-friendly documentation which lives in the `docs` folder inside this repository. When GitHub Pages is enabled for this project, the contents of the `docs` folder become the public documentation site:

**Official published documentation:**  
https://johnnyfivepi.github.io/PiNetBeacon/

Topics include:

- 🚀 Getting started on a Pi Zero  
- 📡 Understanding ping, DNS, and latency (in plain English)  
- 🧪 How the check script works  
- 📊 Dashboard usage & refreshing  
- 🤖 Automation with cron + systemd  
- 🔧 Troubleshooting  
- 🧱 Extending PiNetBeacon with new check modules 

If you fork this project and enable GitHub Pages for your fork, your own documentation site will be available at:

`https://YOUR-USERNAME.github.io/PiNetBeacon/`

Replace "YOUR-USERNAME" with your GitHub account name when publishing your fork.

### 🛠 Enabling GitHub Pages

To enable GitHub Pages:

1. Go to **Settings → Pages** in your fork.  
2. Under **Source**, choose **Deploy from a branch**.  
3. Select your default branch (for example, `main`) and set the folder to `/docs`.  
4. Save, then wait a minute or two for GitHub to build the site.

Once GitHub Pages is enabled, the site automatically updates every time you push changes.

[↑ Back to top](#-table-of-contents)

---

## 🎓 Designed for Learning

PiNetBeacon is more than a small monitoring tool. It's also a **teaching project**, trying to explain as it goes. 

The documentation includes clear explanations, short notes, small callouts, and practical examples that demystify the moving parts of networking and automation.

### 💡 You’ll learn things like:

- What **latency** actually represents (and why it fluctuates)  
- What **packet loss** means in real life  
- Why DNS can fail even when ping works  
- How cron schedules work (and why it hates `~`)  
- How JSON Lines simplify small logging systems  
- What systemd does and why Linux depends on it  
- Why tiny, frequent checks are more reliable than big, heavy ones  

Our goal:  

You walk away not just with a working monitor, but with a clearer understanding of your own network, and the confidence to extend or modify PiNetBeacon however you like.

### 🧩 Designed for beginners, but grows with you

Whether you’re:

- plugging in your first Raspberry Pi,  
- curious about networking basics,  
- learning Linux scheduling tools, or  
- exploring lightweight dashboards...

PiNetBeacon supports you with approachable explanations and zero jargon gatekeeping.

You’ll see friendly callouts like:

> **“What does ping actually measure?”**  
> or  
> **“Why JSONL instead of a database?”**

so you always understand the “why,” not just the “copy/paste this command.”

[↑ Back to top](#-table-of-contents)

---

## 💻 Development Setup (VS Code)

If you want to work on PiNetBeacon from your main computer, VS Code makes it easy - whether you’re editing files locally or working directly on your Raspberry Pi over SSH.

### 🧰 What you'll need

- VS Code  
- Git (installed locally)  
- (Optional) Remote SSH extension  
- A cloned copy of this repository  

### 🛠️ Clone the repository

```bash
git clone https://github.com/johnnyfivepi/PiNetBeacon.git
cd PiNetBeacon
```

### 📝 Open it in VS Code

1. Open VS Code.  
2. Go to **File → Open Folder...**
3. Select your `PiNetBeacon` folder.

VS Code will detect this is a Python project and prompt you to install the Python extension if you don’t have it.

### 🧩 Install helpful extensions in VS Code

These aren’t required, but they make life easier:

- **GitHub Pull Requests & Issues**
- **GitLens** (powerful Git explorer)
- **Python** (syntax highlighting + IntelliSense)
- **Remote SSH** (edit files directly on the Pi)
- **Prettier** (for consistent formatting)
- **YAML** (for GitHub Actions or docs metadata)

### 🔌 (Optional) Edit files directly on your Pi over SSH

If you want your Pi and VS Code to feel connected, you can use VS Code’s **Remote – SSH** extension to edit files on the Raspberry Pi itself:

1. Install the **Remote - SSH** extension
2. Add your Pi to your SSH targets
3. Connect to it via the Remote Explorer sidebar
4. Open the `/home/pnb/PiNetBeacon` folder remotely

This lets you:

- edit Python and HTML files directly on the Pi
- save edits right into the Pi’s filesystem
- test things instantly without copying files back and forth

Very cozy.

### 🧪 Run tests or scripts locally

Most PiNetBeacon scripts run fine on any Linux/macOS machine.

Examples:

```
python3 scripts/pinetbeacon_check.py
python3 dashboard/server.py
```

You can also:

- inspect the JSON Lines log
- tweak the dashboard
- test new monitoring modules
- edit config files
- preview docs locally

The docs include detailed explanations and examples for each component you may want to modify.

### 🌱 Contribute (optional but encouraged!)

You’re welcome to:

- open issues
- adjust the documentation
- add improvements
- suggest feature ideas
- create new monitoring modules
- help refine the dashboard

PiNetBeacon is intentionally friendly to beginners and first-time contributors.

That’s it! VS Code + GitHub + a tiny Pi = a great little development loop.

[↑ Back to top](#-table-of-contents)

---

## 🤝 Contributing

PiNetBeacon is intentionally beginner-friendly — contributions of *all* sizes are welcome.

Whether you're a seasoned engineer or you're setting up your very first Raspberry Pi, you can help in meaningful ways.

Here’s how you can contribute:

### 📝 Improve documentation

Found something unclear? Missing a step? Typo?  
Open an issue or submit a PR — docs are often the most valuable contributions.

### 🧪 Test the setup  

If you try PiNetBeacon on a Zero W, Zero 2 W, Pi 3/4/5, or any other Linux box:

- note what worked  
- note what confused you  
- open issues for rough edges  

Real-world feedback is gold.

### 🧩 Add small monitoring modules  

PiNetBeacon is built to be extendable.  

Ideas include:

- HTTP uptime check  
- DNS resolver comparison  
- Gateway ping check  
- Packet jitter measurement  
- Wi-Fi quality sampling  
- Speedtest-lite probe  

(Anything lightweight and Pi-friendly fits well.)

### 🎨 Improve the dashboard  

CSS cleanup, new cards, tiny charts, layout tweaks — or more API endpoints. Small improvements go a long way.

### 🐛 Submit bug reports  

If something breaks, behaves weirdly, or logs look wrong, let us know:

- what Pi model you’re using  
- what you expected  
- what happened instead  
- commands you ran  
- logs (if safe to share)

Clear bug reports are a huge help.

### 🔧 Code contributions  

All code contributions are welcome as long as they follow the project’s goals:

- simple  
- lightweight  
- understandable  
- Pi-friendly  

We avoid massive frameworks or dependencies.

See **CONTRIBUTING.md** for details.

### 😊 First-timers welcome  

If this is your first open-source contribution ever, you are *very* welcome here.

Open an issue and say:

> “Hi, I want to contribute, but I’m not sure where to start.”

We’ll help you find something fun and approachable.

---

## 📄 License

PiNetBeacon is released under the **MIT License** — one of the most permissive open-source licenses available.

You’re free to:

- ✔️ Use it
- ✔️ Modify it
- ✔️ Fork it
- ✔️ Publish your own version
- ✔️ Use it in commercial or personal projects

...as long as you include the original license text.

The full license can be found in `License`.

### 🎭 Code of Conduct

Participation in this project is governed by the [Code of Conduct](CODE_OF_CONDUCT.md).

[↑ Back to top](#-table-of-contents)