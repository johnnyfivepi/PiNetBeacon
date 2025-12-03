---
layout: page
title: Secure Remote Access
---

# Secure Remote Access (Cloudflare Tunnel)

Cloudflare Tunnel lets you access your PiNetBeacon dashboard **from anywhere**, securely, with no VPN, and *without opening ports* on your home router.

If Tailscale is the “super easy private VPN,” Cloudflare Tunnel is the “browser-only, magic-link portal.” Both are great; this guide is for the Cloudflare path.

> 🛡️ **Why use Cloudflare Tunnel?**  
> - No port-forwarding  
> - No exposing your Pi directly to the internet  
> - SSL for free  
> - Works on *any* device with a browser  
{: .tip}

---

## Contents (choose your own adventure)

- 🚀 [Step 1: Install cloudflared](#-step-1-install-cloudflared)
- 🔑 [Step 2: Authenticate your Pi](#-step-2-authenticate-your-pi)
- 🛠 [Step 3: Create your tunnel](#-step-3-create-your-tunnel)
- ⚙️ [Step 4: Configure ingress rules](#️-step-4-configure-ingress-rules)
- 🌐 [Step 5: Expose the dashboard](#-step-5-expose-the-dashboard-a-tiny-bit-of-magic)
- 💾 [Optional: Make it start automatically](#-optional-make-the-tunnel-start-automatically)
- 🌱 [Optional: Use your own subdomain](#-optional-use-your-own-subdomain)
- 🧪 [Testing your tunnel](#-testing-your-tunnel)
- 🐛 [Troubleshooting](#-troubleshooting-cloudflare-tunnel)
- 🔒 [Security Notes & Best Practices](#-security-notes--best-practices)

---

## 🚀 Step 1: Install cloudflared

Cloudflare Tunnel is powered by a tiny helper program called **cloudflared**.  

Let’s install it on your Raspberry Pi.

Run the official install command:

```bash
curl -fsSL https://pkg.cloudflare.com/cloudflare-main.gpg | sudo tee /usr/share/keyrings/cloudflare-main.gpg >/dev/null
echo 'deb [signed-by=/usr/share/keyrings/cloudflare-main.gpg] https://pkg.cloudflare.com/cloudflared jammy main' | sudo tee /etc/apt/sources.list.d/cloudflared.list
sudo apt update
sudo apt install cloudflared
```

To confirm it installed correctly:

```bash
cloudflared --version
```

You should see something like:

```
cloudflared version 2024.X.X (built YYYY-MM-DD)
```

If you see that —  
🎉 **You now have a tunnel-capable Pi**.

[↑ Back to safety](#contents-choose-your-own-adventure){:.pb-back}

---

## 🔑 Step 2: Authenticate your Pi

Before your Pi can create a tunnel, it needs permission to link with your Cloudflare account.

Run:

```bash
cloudflared tunnel login
```

This will open a URL in your terminal - something like:

```
Please open the following URL in your browser:

https://dash.cloudflare.com/argotunnel?callback=...
```

Open that link on **any device** (your laptop/phone is fine). 

Cloudflare will ask you to choose the domain you want to use with the tunnel. Once you approve it, your Pi is authenticated and ready to create tunnels.

If it succeeds, cloudflared will say something like:

```
You have successfully logged in.
Your certificates have been saved to: /home/pi/.cloudflared/cert.pem
```

🎉 **Your Pi is officially Cloudflare-verified.**

[↑ Back to safety](#contents-choose-your-own-adventure){:.pb-back}

---

## 🛠 Step 3: Create your tunnel

Now that your Pi is authenticated, it’s time to **create** a tunnel.

Run:

```bash
cloudflared tunnel create pinetbeacon
```

This creates:

- a **tunnel ID**
- a **credentials file**  
  (usually located at `~/.cloudflared/<TUNNEL_ID>.json`)

You should see output like:

```
Tunnel credentials written to /home/pi/.cloudflared/123abc456def.json
Created tunnel pinetbeacon with ID 123abc456def
```

Keep that tunnel ID safe because you’ll need it in the config file.

> 💡 **Tip:**  
> You can name the tunnel anything, like `pnb`, `mydashboard`, or `beacon-tunnel`, but `pinetbeacon` keeps it tidy.
{: .tip}

[↑ Back to safety](#contents-choose-your-own-adventure){:.pb-back}

---

## ⚙️ Step 4: Configure ingress rules

Now you’ll tell Cloudflare **what** to expose (your PiNetBeacon dashboard) and **where** to find it on the Pi.

Create the config file:

```bash
sudo nano /etc/cloudflared/config.yml
```

### Option A: You have your own domain

If you already use Cloudflare for `yourdomain.com`, you can give PiNetBeacon a friendly URL like `beacon.yourdomain.com`.

Paste this into `config.yml`:

```yaml
tunnel: <YOUR-TUNNEL-ID>
credentials-file: /home/<your-pi-user>/.cloudflared/<YOUR-TUNNEL-ID>.json

ingress:
  - hostname: beacon.yourdomain.com
    service: http://localhost:8080
  - service: http_status:404
```

Replace:

- `<YOUR-TUNNEL-ID>` with the ID from `cloudflared tunnel create`  
- `<your-pi-user>` with your Pi username (for example, `pi` or `pnb`)  
- `beacon.yourdomain.com` with the subdomain you prefer  

### Option B: You don’t have your own domain (totally fine)

Cloudflare can create a temporary URL for you like:

```
https://something-random.trycloudflare.com
```

Use this minimal config instead:

```yaml
tunnel: <YOUR-TUNNEL-ID>
credentials-file: /home/<your-pi-user>/.cloudflared/<YOUR-TUNNEL-ID>.json

ingress:
  - service: http://localhost:8080
```

Save and exit:

- **Ctrl + O** → Enter  
- **Ctrl + X** to close `nano`

[↑ Back to safety](#contents-choose-your-own-adventure){:.pb-back}

---

## 🌐 Step 5: Expose the dashboard (a tiny bit of magic)

Your tunnel is configured… now it just needs a door to walk through.

This step tells Cloudflare:  
**“Hey, when someone visits this URL, please send them to my adorable Raspberry Pi.”**

### 1. Create the DNS route (if using your own domain)

```bash
cloudflared tunnel route dns <YOUR-TUNNEL-NAME> beacon.yourdomain.com
```

Cloudflare will quietly create a CNAME record that points your domain → your tunnel. You don’t have to touch DNS. (No, really — put the screwdriver down.)

If you're **not** using your own domain, skip this step. Cloudflare will give you a temporary URL in the next step.

### 2. Start the tunnel

```bash
cloudflared tunnel run <YOUR-TUNNEL-NAME>
```

You should see something like:

```
INF Starting tunnel...
INF Connection established
INF Route propagating...
```

That’s Cloudflare saying, “Yep, everything’s working, go ahead and brag.”

### 3. Open your dashboard from anywhere

If you used a real domain, visit:

```
https://beacon.yourdomain.com
```

If you're using a temporary “trycloudflare” URL, the terminal will print something like:

```
https://fluffy-dawn-8472.trycloudflare.com
```

Yes, the names are always chaotic.  
Yes, we love them.

Open that URL and, if the stars align, you’re now viewing your PiNetBeacon dashboard **from anywhere in the world**.

> 💡 **Tip:**  
> If the dashboard loads but everything is empty, scroll back to the terminal and make sure your Pi is actually running both:  
> - the **monitoring script**  
> - the **dashboard server**  
>  
> (PiNetBeacon isn’t a mind reader. Yet.)
{: .tip}

[↑ Back to safety](#contents-choose-your-own-adventure){:.pb-back}

---

## 💾 Optional: Make the tunnel start automatically

Right now, you start your tunnel like this:

```bash
cloudflared tunnel run <YOUR-TUNNEL-NAME>
```

Which is fine! But also... not ideal if your Pi ever reboots, crashes, sneezes, etc.

Let’s make Cloudflare Tunnel start **by itself**, every time the Pi wakes up.

### 1. Install the systemd service

Cloudflare provides a built-in setup command:

```bash
sudo cloudflared service install
```

This creates:

- a systemd unit file  
- proper permissions  
- automatic startup at boot  
- and fewer reasons for you to SSH into the Pi at 2 AM

### 2. Tell the service *which* tunnel to run

Edit the configuration file:

```bash
sudo nano /etc/cloudflared/config.yml
```

Add or confirm these lines:

```yaml
tunnel: <YOUR-TUNNEL-NAME>
credentials-file: /home/pi/.cloudflared/<YOUR-TUNNEL-ID>.json

ingress:
  - hostname: beacon.yourdomain.com
    service: http://localhost:8080
  - service: http_status:404
```

> 📝 **Note:**  
> If you’re using the auto-generated “trycloudflare” URL (no custom hostname), you can skip the `hostname:` line.
{: .note}

Save & exit (`Ctrl+O`, `Enter`, `Ctrl+X`).

### 3. Enable the service

```bash
sudo systemctl enable cloudflared
sudo systemctl restart cloudflared
```

Check that it’s alive:

```bash
systemctl status cloudflared
```

If it shows **active (running)** — congratulations:  
🎉 Your Pi now teleports traffic through Cloudflare *fully automatically*.

### 4. Reboot to be extra sure

```bash
sudo reboot
```

Once the Pi comes back online, your tunnel should be running without you lifting a finger.

[↑ Back to safety](#contents-choose-your-own-adventure){:.pb-back}

---

## 🌱 Optional: Use your own subdomain

If you’d like something nicer than:

```text
https://fluffy-dawn-8472.trycloudflare.com
```

...you can point a **real** subdomain at your tunnel, like:

```text
https://beacon.yourdomain.com
```

This assumes:

- your domain (like `yourdomain.com`) is already using Cloudflare DNS  
- you used that domain when you ran `cloudflared tunnel login`

### 1. Find your tunnel UUID

Run:

```bash
cloudflared tunnel list
```

You’ll see something like:

```text
NAME         UUID                                  CREATED
pinetbeacon  123abc456def7890aabbccddeeff0011  2025-11-22T18:00:00Z
```

Copy the **UUID** for your tunnel.

### 2. Add a CNAME record in Cloudflare

In the Cloudflare dashboard:

1. Go to **Websites → yourdomain.com → DNS**  
2. Add a new **CNAME** record:

   - **Name:** `beacon`  
   - **Target:** `<YOUR-TUNNEL-UUID>.cfargotunnel.com`  
   - **Proxy status:** Proxied (orange cloud)

This tells Cloudflare:

> “When someone visits `beacon.yourdomain.com`, send them through this tunnel.”

### 3. Confirm the config matches

In `/etc/cloudflared/config.yml`, you should have:

```yaml
tunnel: <YOUR-TUNNEL-NAME>
credentials-file: /home/pi/.cloudflared/<YOUR-TUNNEL-ID>.json

ingress:
  - hostname: beacon.yourdomain.com
    service: http://localhost:8080
  - service: http_status:404
```

Restart cloudflared:

```bash
sudo systemctl restart cloudflared
```

Give DNS a moment to catch up, then visit:

```text
https://beacon.yourdomain.com
```

If you see the PiNetBeacon dashboard, you’ve just given your Raspberry Pi its own tiny corner of the internet.

[↑ Back to safety](#contents-choose-your-own-adventure){:.pb-back}

---

## 🧪 Testing your tunnel

Before you trust this setup, let’s poke it a bit and make sure everything’s doing what it claims.

We’ll check three things:

1. The **local dashboard** still works  
2. The **tunnel URL** works  
3. PiNetBeacon is **actually writing logs**


### 1. Check the local dashboard

From a device on your home network, make sure the dashboard works *without* Cloudflare first.

In your browser:

```text
http://pinetbeacon.local:8080/
```

Or use the Pi’s IP:

```text
http://192.168.x.x:8080/
```

If this doesn’t work, fix that first — the tunnel can’t help if the dashboard itself is stuck.

### 2. Check the Cloudflare URL

Next, try your tunnel URL:

- If you’re using your **own domain**:

  ```text
  https://beacon.yourdomain.com
  ```

- If you’re using a **temporary URL**, copy it from the `cloudflared tunnel run` output:

  ```text
  https://some-random-name.trycloudflare.com
  ```

You should see the **same** PiNetBeacon dashboard, just now coming through Cloudflare.

### 3. Confirm logs are updating

On the Pi, check that new log entries are appearing:

```bash
tail -n 5 ~/PiNetBeacon/data/logs/pinetbeacon.log.jsonl
```

You should see recent JSON Lines like:

```json
{"timestamp": "2025-11-22T18:51:49.046746+00:00", "target_host": "1.1.1.1", "avg_latency_ms": 16.698, "packet_loss_percent": 0.0, "status": "up", "notes": "ok"}
```

If:

- the **local dashboard** works  
- the **Cloudflare URL** works  
- and **logs are moving**  

...then your tunnel is officially doing its job.

[↑ Back to safety](#contents-choose-your-own-adventure){:.pb-back}

---

## 🐛 Troubleshooting Cloudflare Tunnel

Cloudflare Tunnels are usually cooperative little creatures… until they aren’t. Here’s how to fix the most common issues — fast.

### ❌ 1. The tunnel URL won’t load at all

Run this on your Pi to check tunnel status:

```bash
sudo cloudflared service status
```

If it shows **inactive** or **failed**, restart the service:

```bash
sudo systemctl restart cloudflared
```

Then check logs:

```bash
journalctl -u cloudflared --no-pager -n 50
```

Common causes:

- Wrong service name  
- Wrong credentials file path  
- Tunnel deleted in Cloudflare dashboard

### ❌ 2. Tunnel runs, but dashboard shows a 502 or “Bad Gateway”

This almost always means Cloudflare can’t reach your Pi’s dashboard server.

Checklist:

- Is `server.py` running?

  ```bash
  ps aux | grep server.py
  ```

- Can you visit it locally?

  ```text
  http://pinetbeacon.local:8080/
  ```

- Is the ingress rule pointing to the **correct port**?

Your tunnel config should include:

```yaml
url: http://localhost:8080
```

If not, fix it and restart:

```bash
sudo systemctl restart cloudflared
```

### ❌ 3. Tunnel URL works, but dashboard looks “empty”

The Cloudflare side is fine — the dashboard itself just isn’t getting data.

Run these checks:

1. **Is the log file present?**

   ```bash
   ls -l ~/PiNetBeacon/data/logs/pinetbeacon.log.jsonl
   ```

2. **Does it contain entries?**

   ```bash
   tail -n 5 ~/PiNetBeacon/data/logs/pinetbeacon.log.jsonl
   ```

3. **Is the Pi’s clock correct?** (yes, really)

   ```bash
   timedatectl
   ```

If time is wrong:

```bash
sudo systemctl restart systemd-timesyncd
```

### ❌ 4. Automatic service won’t start

If you created a `pinetbeacon-dashboard.service` or custom `cloudflared` service and it refuses to boot:

Check the unit file:

```bash
sudo nano /etc/systemd/system/cloudflared.service
```

Then reload:

```bash
sudo systemctl daemon-reload
sudo systemctl restart cloudflared
```

And verify:

```bash
systemctl status cloudflared
```

### ❌ 5. Browser keeps showing an **old** version of the dashboard

This one happens *a lot* when updating the UI.

Force a full refresh:

- **Mac:** ⌘ + Shift + R  
- **Windows:** Ctrl + Shift + R  
- **iPhone/iPad:** Close tab → reopen  
- **Android:** Menu → “Reload without cache”

Worst-case fix:

```bash
cd ~/PiNetBeacon/dashboard
python3 server.py
```

If none of this works and you’re giving your Pi the side-eye: It’s okay. We’ve all been there.  

Open an Issue on GitHub and we’ll take a look together.

[↑ Back to safety](#contents-choose-your-own-adventure){:.pb-back}

---

## 🔒 Security Notes & Best Practices

A quick word on safety, because exposing things to the internet *without* thinking is how horror movies start.

Cloudflare Tunnel is already one of the safest ways to publish a tiny internal dashboard, but there are a few things worth keeping in mind.

### 🛡 1. Your tunnel URL is private... but still a URL

Cloudflare generates long, unguessable subdomains like:

```
https://fuzzy-iguana-7283.trycloudflare.com
```

Think of this like a *secret clubhouse door*:  
Safe unless you intentionally hand it out.

- Don’t post it publicly  
- Don’t put it in screenshots  
- Treat it like a password 

### 🔑 2. Protect with Zero Trust Access (optional but awesome)

Cloudflare can require:

- GitHub login  
- Google login  
- One-time PIN  
- MFA  
- or all of the above  

Before anyone can reach your dashboard URL.

If you want to lock things down even more tightly:

1. Go to **Cloudflare Dashboard → Access → Applications**
2. Add your tunnel URL  
3. Require authentication  
4. Feel nice and secure 😎

### 🔐 3. Keep your Cloudflare credentials file safe

Your credentials live inside:

```
/home/<USERNAME>/.cloudflared/
```

Inside are:

- Your tunnel certificate  
- Your private key  
- Tunnel config  
- Cloudflare account associations  

**Never add this folder to Git.**  
Never upload it.  
Never email it.  
Never back it up to “random cloud folder #14”.

If someone gets these files, they *own your tunnel* like trolls own & place a toll on bridges.

### 🧱 4. Do not port-forward your Pi manually

PiNetBeacon’s dashboard runs on port **8080**.  

If you ever think:

> “Maybe I’ll just port-forward 8080 on my router?”

**Stop. Breathe. Absolutely do not.**

Cloudflare Tunnel exists specifically to avoid this.

### 🧪 5. Test your tunnel regularly

Occasionally run:

```bash
curl https://your-tunnel-url/health
```

If it returns JSON, you’re golden.  
If not, time to nudge cloudflared awake:

```bash
sudo systemctl restart cloudflared
```

### 🤝 6. If something feels off, ask for help

Whether your tunnel feels sleepy, your dashboard feels cranky, or your Pi feels offended:

Open an issue on GitHub or reach out.  

PiNetBeacon is friendly — the documentation should be too.

[↑ Back to safety](#contents-choose-your-own-adventure){:.pb-back}
