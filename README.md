# FollowGuard - Instagram Unfollower Tracker

<p align="center">
  <img src="https://img.shields.io/badge/Version-2.0-ff69b4" alt="Version 2.0">
  <img src="https://img.shields.io/badge/Python-3.8%2B-blue" alt="Python 3.8+">
  <img src="https://img.shields.io/badge/License-MIT-green" alt="License MIT">
  <img src="https://img.shields.io/badge/Platform-Instagram-lightgrey" alt="Platform Instagram">
</p>

**FollowGuard** is a secure Python tool that helps you track who unfollowed you on Instagram. Designed with account safety as a priority, it provides clear insights into your follower dynamics without violating Instagram's Terms of Service.

---

## ⚠️ Critical Safety Note (2025)

Using third-party tools that require your Instagram login credentials poses significant risks, including **account suspension, temporary action blocks, or data compromise**.

FollowGuard is designed with security in mind. It operates on principles that minimize risk, but users must be aware that Instagram actively limits unauthorized data access. The safest method to track unfollowers is through Instagram's official **"Download Your Data"** feature. This tool provides an alternative for those who accept the associated risks.

## ✨ Features

-   **Unfollower Detection**: Identifies users who have stopped following you.
-   **Non-Followers List**: See which accounts you follow that don't follow you back.
-   **Follower Analytics**: Get basic statistics on your follower count and changes.
-   **Security-Focused**: Does not store your Instagram password on remote servers.
-   **Local Data Processing**: All data analysis happens locally on your machine.

## 📦 Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/eduolihez/FollowGuard_InstagramUnfollowers.git
    cd FollowGuard_InstagramUnfollowers
    ```

2.  **Install required dependencies**
    ```bash
    pip install -r requirements.txt
    ```

## 🚀 Usage

### Method 1: Using Instagram's Official Data Download (Recommended & Safest)

This method aligns with the safest practices recommended for 2025.

1.  Request your data from Instagram:
    -   Go to your Instagram **Settings** → **Security** → **Download Data**.
    -   Enter your email and request a download. You will receive a link to a ZIP file within 24-48 hours.
2.  Extract the downloaded ZIP file.
3.  Locate the `connections.json` file (or similar) which contains your follower/following history.
4.  Run FollowGuard with the path to your data file:
    ```bash
    python followguard.py --data-file path/to/your/connections.json
    ```

### Method 2: Script-Based Analysis (Use with Caution)

For those who accept the risks, a script can automate checks via your browser.

```python
# Example using a browser console script
from followguard import analyzer

# Initialize the analyzer
guard = analyzer.FollowGuard()

# Run analysis (this may require manual authentication in a browser)
results = guard.run_analysis()

# Print users who haven't followed back
print("Accounts not following you back:")
for user in results.non_followers:
    print(f" - {user['username']} {'☑️' if user['is_verified'] else ''}")
```

> **Warning**: Method 2 may trigger Instagram's anti-bot measures, leading to temporary blocks. Use sparingly and avoid making excessive or rapid requests.

## 🔧 Configuration

Create a `.env` file in the project root to manage your settings securely. Never commit this file.

```env
# .env file
INSTAGRAM_USERNAME=your_username_optional_for_method_2
# INSTAGRAM_PASSWORD=<-- DO NOT STORE YOUR PASSWORD HERE
ANALYSIS_INTERVAL=86400
DATA_SOURCE=download # Options: 'download' or 'script'
```

## 🤝 Contributing

We welcome contributions! Please feel free to submit issues, fork the repository, and create pull requests.

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

Please ensure your code adheres to the existing style and includes appropriate tests.

## 📄 License

This project is distributed under the MIT License. See the `LICENSE` file for more information.

## 🛡️ Disclaimer

This project is not affiliated with, authorized, maintained, or endorsed by Instagram or Facebook. Instagram is a registered trademark of Facebook, Inc. This tool is developed for educational and personal convenience purposes. The developers are not responsible for any account restrictions or issues that may arise from using this tool. **Users assume all risks.**

## 💡 Ethical Use and Best Practices

Tracking unfollowers can offer insights, but it's important to maintain a healthy perspective.
-   **Normal Churn**: Losing followers is a normal part of having an Instagram account. Audience interests change.
-   **Focus on Engagement**: Concentrate on creating valuable content and building a genuine community, rather than obsessing over follower counts.
-   **Strategic Tool**: Use this data to identify content that may not resonate or to clean up inactive accounts, not for retaliatory unfollowing.

---

<div align="center">

### Did FollowGuard help you?

If you found this project useful, please consider giving it a ⭐ on GitHub!

</div>