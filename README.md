# PiNetBeacon

**PiNetBeacon** is a lightweight, Raspberry Pi–friendly network monitor.

It runs tiny, scheduled checks from your Pi (including the **Raspberry Pi Zero W**) and logs what your home internet is actually doing: latency, outages, and DNS health. It also comes with a simple web dashboard and beginner-friendly documentation.

Think of it as a small **beacon** in your network: quietly watching, logging, and shining a light on what's going on.

---

## Why PiNetBeacon?

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

---

## What PiNetBeacon does

At a high level:

1. **Runs small checks** at a schedule (via `cron` or systemd timer)
   - ICMP ping to a target (e.g. `1.1.1.1` or `8.8.8.8`)
   - DNS resolution check (e.g. lookup `example.com`)
2. **Writes results to a log file** (JSON Lines format)
3. **Optionally powers a tiny dashboard**
   - Static HTML that reads your log and shows:
     - latency over time
     - up/down classifications
     - timestamps of recent outages

No big database. Just small files and a clear story.

---

## Hardware requirements

PiNetBeacon is intentionally light.

Tested / intended for:

- ✅ Raspberry Pi Zero W / Zero 2 W (your tiny, Wi-Fi-enabled Pi)
- ✅ Raspberry Pi 3 / 4 / 5
- ✅ Any other Pi running Raspberry Pi OS Lite
- ✅ Should work on any Linux box with Python 3 and basic tools

If you're using a **Pi Zero 2 W**, you're in the right place. The documentation includes Zero-friendly tips and constraints where it matters.

---

## Quick start (high-level)

Full, step-by-step instructions live in the [docs site](./docs), but here’s the bird’s-eye view:

### 1. Prepare your Raspberry Pi

- Install Raspberry Pi OS Lite  
- Connect your Pi to the internet  
- Make sure SSH is enabled so you can access the Pi from another computer

### 2. Clone this repository

```bash
git clone https://github.com/johnnyfivepi/PiNetBeacon.git
cd PiNetBeacon
```

### 3. Install Python dependencies

PiNetBeacon is very small and uses only a few packages. To install them:

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

If everything is set up correctly, you'll see a log entry appear in the data/logs folder.

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

   `PiNetBeacon dashboard running on http://0.0.0.0:8080/  
   Serving logs from: /home/pnb/PiNetBeacon/data/logs/pinetbeacon.log.jsonl  
   Press Ctrl+C to stop.`

2. On your computer, open a browser and visit one of:

   - `http://pinetbeacon.local:8080/`
   - `http://YOUR-PI-IP:8080/` (for example `http://192.168.1.96:8080/`)

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

> **Note:**  
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

---

## Example Log Entry

PiNetBeacon writes logs as one JSON object per line. This is called **JSON Lines**.

For example:

{
  "timestamp": "2025-01-17T14:32:10Z",
  "target_host": "1.1.1.1",
  "avg_latency_ms": 26.4,
  "packet_loss_percent": 0.0,
  "status": "up",
  "notes": "baseline check"
}

> 💡 **Why JSON Lines?**  
> It's human-readable, easy to append to, and plays nicely with command-line tools and log analyzers.

---

## Documentation

PiNetBeacon includes a full set of beginner-friendly documentation which lives in the `docs` folder inside this repository. When GitHub Pages is enabled for this project, the contents of the `docs` folder become the public documentation site:

**Official published documentation:**  
https://johnnyfivepi.github.io/PiNetBeacon/

Topics include:

- 📦 Getting started on a Raspberry Pi Zero W
- 🧰 Understanding ping, DNS, and latency (without needing to be an expert)
- 🧾 How the logging format works
- 📊 How the dashboard reads and renders data
- 🧪 Ideas for extending PiNetBeacon with new checks

If you fork this project and enable GitHub Pages for your fork, your own documentation site will be available at:

`https://YOUR-USERNAME.github.io/PiNetBeacon/`

Replace "YOUR-USERNAME" with your GitHub account name when publishing your fork.

To enable GitHub Pages:

1. Go to **Settings → Pages** in your fork.  
2. Under **Source**, choose **Deploy from a branch**.  
3. Select your default branch (for example, `main`) and set the folder to `/docs`.  
4. Save, then wait a minute or two for GitHub to build the site.

---

## Designed for Learning

PiNetBeacon is more than a small monitoring tool. It's also a teaching project, trying to explain as it goes. The documentation includes clear explanations, short beginner notes, and small callouts that help you understand how the checks work.

You’ll see callouts in the docs like:

- What ping measures in simple language  
- Why latency rises during certain times of day  
- What packet loss means in real life  
- What happens if DNS fails but ping still works  
- How schedules work on Linux  
- How JSON Lines helps with small logging systems  

The goal is that you walk away not just with a running tool, but with a better understanding of your own network.

---

## Development Setup (VS Code)

If you want to work on PiNetBeacon from your main computer, you can use VS Code and GitHub.

1. Clone this repository to your computer.  
2. Open it in VS Code.  
3. Install the GitHub and Git extensions if needed.  
4. (Optional) Install the Remote SSH extension if you want to edit files directly on your Raspberry Pi.  
5. Use the built-in Git tools in VS Code to commit and push changes.

The docs include a beginner-friendly “Developing with VS Code & GitHub” section with screenshots and explanations.

---

## Contributing

Contributions are welcome, especially from beginners using a Raspberry Pi for the first time.

You can contribute by:

- Trying the setup steps and opening issues when something is unclear  
- Improving documentation or adding helpful notes  
- Adding small monitoring modules, such as an HTTP check or gateway check  
- Suggesting improvements to the dashboard  
- Sharing ideas for new features  

See the `CONTRIBUTING.md` file in this repository for more information.

---

## Code of Conduct

Participation in this project is governed by the [Code of Conduct](CODE_OF_CONDUCT.md).

---

## License

PiNetBeacon is released under the MIT License.  

You're welcome to fork it, build on it, and use it in your own homelab.

The full license text is in the LICENSE file.