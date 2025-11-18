# Contributing to PiNetBeacon

Thank you for your interest in contributing to PiNetBeacon. This document explains how to propose changes, report issues, and work with the codebase in a way that keeps the project maintainable and helpful to the community.

If you're looking for a more beginner-friendly version, see the **Contributing** page in the documentation site.

---

## Table of contents

- [Code of conduct](#code-of-conduct)
- [Project goals](#project-goals)
- [Types of contributions](#types-of-contributions)
- [Setting up a development environment](#setting-up-a-development-environment)
- [Working with the codebase](#working-with-the-codebase)
- [Documentation contributions](#documentation-contributions)
- [Reporting bugs and issues](#reporting-bugs-and-issues)
- [Proposing new features or modules](#proposing-new-features-or-modules)
- [Pull request guidelines](#pull-request-guidelines)

---

## Code of conduct

PiNetBeacon aims to be a welcoming project for hobbyists, learners, and experienced developers. All participants are expected to:

- be respectful and considerate  
- keep feedback constructive  
- avoid personal attacks or dismissive language  
- collaborate in good faith  

If you encounter behavior that makes participation uncomfortable, please open an issue or contact the maintainer privately.

---

## Project goals

PiNetBeacon is designed to:

- run reliably on low-power hardware such as the Raspberry Pi Zero 2 W  
- be understandable for people who are new to networking  
- provide clear and accurate measurements of network behavior  
- keep the codebase small, readable, and dependency-light  

Please keep these goals in mind when proposing changes or new modules.

---

## Types of contributions

The following contributions are welcome and encouraged:

- bug reports with clear reproduction steps  
- focused bug fixes  
- new or improved monitoring modules  
- improvements to logging and observability  
- documentation enhancements (clarity, examples, structure)  
- performance improvements that don’t add unnecessary complexity  
- tests for existing functionality  

If you're unsure whether an idea fits, consider opening an issue first. A short discussion can help align the contribution with the project’s goals.

---

## Setting up a development environment

To work on PiNetBeacon locally, you’ll need:

- Python 3  
- Git  
- A text editor (VS Code recommended)  

Basic setup:

1. **Fork the repository** on GitHub.

2. **Clone your fork**:

   ```bash
   git clone https://github.com/YOUR-USERNAME/PiNetBeacon.git
   cd PiNetBeacon
   ```

3. **Optional: create a virtual environment**:

   ```bash
   python3 -m venv .venv
   source .venv/bin/activate       # macOS/Linux
   # or on Windows:
   # .venv\Scripts\activate
   ```

4. **Install dependencies** (when `requirements.txt` exists):

   ```bash
   pip3 install -r requirements.txt
   ```

5. **Run a basic check**:

   ```bash
   cd scripts
   python3 pinetbeacon_check.py
   ```

You can also develop directly on a Raspberry Pi using SSH or VS Code's Remote SSH extension.

---

## Working with the codebase

When contributing code, please keep the following guidelines in mind:

- Keep modules focused on a single clear responsibility.  
- Favor readability over clever or compact code.  
- Avoid adding heavy dependencies unless necessary.  
- Maintain compatibility with low-power Raspberry Pi models.  
- Use configuration options (`config.json`) instead of hard-coded values.  
- Include comments when behavior may not be obvious.

If your contribution changes functionality or introduces new behavior, please update or add the relevant documentation in the `docs/` directory.

---

## Documentation contributions

Documentation lives in the `docs/` directory and powers the public documentation site.

To build and preview the documentation locally:

```bash
cd docs
bundle install
bundle exec jekyll serve
```

This will start a local server and show you a preview URL.

When editing documentation:

- keep explanations clear and accessible  
- don’t assume prior networking or Linux knowledge  
- use examples and step-by-step instructions where useful  
- verify internal links and anchors  
- follow the existing Markdown formatting style

Documentation-only pull requests are welcome.

---

## Reporting bugs and issues

If you encounter unexpected behavior, please open an issue on GitHub.

Include as much of the following as possible:

- the command you ran  
- what you expected to happen  
- what actually happened  
- any error messages or logs  
- your Raspberry Pi model  
- your Raspberry Pi OS version  
- steps to reproduce the issue  

Minimal reproductions are extremely helpful and make fixes faster.  
It’s fine if you’re not sure what the root cause is — describing the symptoms is enough to get started.

---

## Proposing new features or modules

Before implementing a new feature or monitoring module, it’s often helpful to open an issue first. This allows discussion around:

- how the feature fits PiNetBeacon’s goals  
- resource usage (especially on Pi Zero–class devices)  
- configuration needs  
- how results will be logged  
- potential interactions with existing modules  

A short proposal helps avoid duplicated work and ensures your idea aligns with the project's direction. Once it’s approved, feel free to open a pull request with your implementation.

---

## Pull request guidelines

To help keep reviews efficient and the project history clean, please follow these guidelines when submitting a pull request:

1. **Create a feature branch**

   ```bash
   git checkout -b feature/my-change-name
   ```
   
   Avoid working directly on the `main` branch.

2. **Keep changes focused**

   Group related changes together.  
   Avoid combining unrelated features, refactors, and documentation edits in a single PR.

3. **Follow existing style**

   Match the surrounding code in terms of formatting, variable naming, and structure. If something in the codebase seems unclear, feel free to ask.

4. **Test your changes**

   At a minimum:

   - run the relevant check script  
   - verify logs behave as expected  
   - ensure documentation builds correctly if updated  

5. **Write a clear PR description**

   Include:

   - what the change does  
   - why it’s needed  
   - any configuration changes  
   - notes for reviewers (e.g., things to pay attention to)  

   Screenshots, log snippets, or examples are welcome.

6. **Participate in review**

   Review comments are a normal part of the process.  
   Follow-up commits to refine the contribution are encouraged.

---

## Thank you

Your contributions help make PiNetBeacon better for everyone. Whether you’re fixing a small issue, improving documentation, or adding a new module, your efforts are appreciated.
