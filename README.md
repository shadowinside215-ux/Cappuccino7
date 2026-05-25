# Android APK Build Instructions for Cappuccino7

To build the real `.apk` or `.aab` file for Cappuccino7, you will need to use **Android Studio**. This ensures the application is correctly signed, optimized, and built natively.

### Prerequisites

1.  **Download and Install Android Studio**: Get it from the [official Android Studio website](https://developer.android.com/studio).
2.  **Ensure Node.js is installed**: You should have Node.js and `npm` installed on your machine.

### Step 1: Export or Clone the Project

1.  **Export the Source Code**: In the AI Studio editor, open the settings menu and export the application as a ZIP file.
2.  **Extract the ZIP**: Extract the downloaded ZIP file to a known folder on your computer.

### Step 2: Build the Web Assets

1.  Open your computer's terminal, navigate to the extracted folder:
    ```bash
    cd path/to/cappuccino7
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Build the web code into the `dist` folder:
    ```bash
    npm run build
    ```
4.  Sync the web code to the Android project folder using Capacitor:
    ```bash
    npx cap sync android
    ```
    *Note: This step copies everything from `dist` into `android/app/src/main/assets/public`.*

### Step 3: Open in Android Studio

1.  Open **Android Studio**.
2.  Click **Open** (or File > Open).
3.  Navigate into your exported folder and select the **`android`** folder (e.g., `path/to/cappuccino7/android`), then click **OK**.
4.  Wait for the **Gradle Sync** to finish. This might take a few minutes the first time. Watch the bottom right progress bar.

### Step 4: Build the APK!

Once Gradle sync finishes successfully:
1.  In the top menu bar of Android Studio, click **Build**.
2.  Click **Build Bundle(s) / APK(s)**.
3.  Click **Build APK(s)**.
4.  Android Studio will now compile the application. Once it finishes, a small pop-up will appear in the bottom right corner saying "Build APK(s) completed".
5.  Click the **locate** link in that pop-up to immediately open the folder containing your brand new `app-debug.apk`. 

*(Note: For production, you can select Build > Generate Signed Bundle / APK... to upload to the Play Store or distribute without warning popups).*

### Serving the APK on the Website

Once you have grabbed your generated `.apk` file:
1. Rename it to `Cappuccino7.apk`.
2. Move it to the `public/` folder in your project's code tree.
3. Commit or re-deploy the web application.
4. The download button on the website will now automatically download the real APK instead of showing "Android app coming soon"!
