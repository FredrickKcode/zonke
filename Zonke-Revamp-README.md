# Zonke Revamp — Local Development Setup and Troubleshooting

**Project:** Zonke Revamp  
**Maintainer / setup record:** F. S. Kato  
**Local project directory used for the recorded setup:** `C:\Users\user\Downloads\Zonke Revamp`  
**Local development URL used for testing:** `http://127.0.0.1:8080`

This README documents the setup I completed on my Windows computer. It records verified observations and fixes without claiming that every route, integration, payment flow, or database-backed feature has been tested. It has not been tested on other developers’ computers.

## Table of Contents

- [1. Introduction](#1-introduction)
- [2. Initial project structure and original problem](#2-initial-project-structure-and-original-problem)
- [3. Inspecting the PHP environment](#3-inspecting-the-php-environment)
- [4. Understanding the Laravel application structure](#4-understanding-the-laravel-application-structure)
- [5. Creating the local environment configuration](#5-creating-the-local-environment-configuration)
- [6. Downloading and importing the existing database](#6-downloading-and-importing-the-existing-database)
- [7. Creating the local Laravel public directory](#7-creating-the-local-laravel-public-directory)
- [8. Starting the Laravel application locally](#8-starting-the-laravel-application-locally)
- [9. Investigating the missing CSS and design](#9-investigating-the-missing-css-and-design)
- [10. Resolving the licence activation screen](#10-resolving-the-licence-activation-screen)
- [11. Inspecting the original hosting environment file](#11-downloading-and-inspecting-the-original-hosting-env)
- [12. Final local configuration and verification status](#12-final-local-configuration-and-verification-status)
- [13. Setup instructions for a developer receiving the shared project](#13-instructions-for-another-developer-receiving-the-prepared-project-folder)
- [Troubleshooting](#troubleshooting)
- [14. Screenshot checklist](#14-screenshot-checklist)
- [15. Important Notes for Team Members Using the Shared Project Folder](#15-important-notes-for-team-members-using-the-shared-project-folder)
- [16. Conclusion and next steps](#16-conclusion-and-next-steps)
- [Open verification items](#open-verification-items)

---

## 1. Introduction

I prepared this document to record how I configured the existing Zonke application to run locally before beginning the planned website revamp and further development.

I obtained the existing project files from the hosting environment. The application did not initially open as expected. I investigated several configuration and compatibility issues, including the original placeholder page, PHP version compatibility, the Laravel public directory, database configuration, missing environment configuration, CSS loading, and the application's licence activation screen.

I aimed to preserve the existing application and its database, make the local development changes required to run it, and establish a working local copy before introducing new functionality. I did not intend to rebuild Zonke from scratch. The goal was to make the existing codebase available for inspection so that I could understand its current implementation and plan the revamp based on the actual application.

> **Scope of verification:** The checks recorded here confirm specific setup steps and observed results. They do not establish that every route, page, integration, payment flow, or database-backed feature works correctly.

## 2. Initial project structure and original problem

### 2.1 Project directory

I placed the project in this Windows directory:

```text
C:\Users\user\Downloads\Zonke Revamp
```

The project folder contained the Laravel application files, including:

- `app`
- `bootstrap`
- `config`
- `database`
- `public_html`
- `resources`
- `routes`
- `storage`
- `vendor`
- `artisan`
- `composer.json`
- `composer.lock`
- `package.json`
- `phpunit.xml`
- `README.md`

These files indicated that I had an existing Laravel application rather than only a static website.

**Screenshot 1 — Original project folder.** Insert an actual File Explorer screenshot showing the main project folders and files, including `public_html`, `artisan`, and `composer.json`. Avoid showing unrelated private files.

### 2.2 The original “Zonke is coming” page

When I initially inspected the supplied website entry point, the expected Zonke application did not load. The browser displayed a simple placeholder page indicating that Zonke was coming.

The file responsible was:

```text
public_html/index.php
```

My inspection showed that this was not a functioning Laravel front controller for the supplied local project. It contained placeholder-related code and referenced Laravel files under a `core` directory that was not present in the project structure I had received. This explained why opening the supplied entry point did not start the application correctly.

The important finding was that the project contained the Laravel application files, but the supplied `public_html/index.php` was not configured to boot the application from the directory structure available in my local copy.

**Screenshot 2 — Original placeholder page.** Insert an actual browser screenshot showing the “Zonke is coming” message.

**Screenshot 3 — Original entry-point code.** Insert an actual screenshot of `public_html/index.php` showing the placeholder code or references to the missing `core` directory. Do not expose credentials or unrelated sensitive code.

### 2.3 Decision to preserve the supplied hosting files

Rather than modify or delete the original hosting files, I left `public_html` intact and prepared a separate `public` directory for local development. This gave me a working local entry point without unnecessarily changing the supplied hosting structure.

## 3. Inspecting the PHP environment

### 3.1 Initial PHP version mismatch

The computer had XAMPP installed, with PHP at:

```text
C:\xampp\php\php.exe
```

The PHP version available through XAMPP was **PHP 8.2.12**. When I checked the project's `composer.json`, I found this requirement:

```json
"php": "^8.3"
```

The project used Laravel 11, which requires PHP 8.2 or newer, but this particular project explicitly required PHP 8.3 or newer through Composer. PHP 8.2.12 therefore did not satisfy the project's stated PHP requirement. Continuing to use the default XAMPP PHP executable could cause compatibility problems when running Composer or Laravel commands.

### 3.2 Installing Laravel Herd

I installed Laravel Herd to obtain a compatible PHP version without removing the existing XAMPP installation. Herd provided:

- **PHP:** 8.4.26
- **Composer:** 2.8.12 (already installed)
- **Node.js:** 22.20.0 (already installed)

In PowerShell, running `npm -v` encountered a script execution-policy issue. Running `npm.cmd -v` worked instead. This was a PowerShell command-resolution issue; it did not indicate that Node.js or npm was missing.

### 3.3 Using the correct PHP executable

Because Windows could still resolve `php` to the older XAMPP installation, I used the full path to Herd's PHP launcher for Laravel commands.

To check PHP:

```powershell
& "$env:USERPROFILE\.config\herd\bin\php.bat" --version
```

To check Laravel:

```powershell
& "$env:USERPROFILE\.config\herd\bin\php.bat" artisan --version
```

During my checks, the environment reported **PHP 8.4.26** and **Laravel Framework 11.47.0**.

**Screenshot 4 — Herd PHP version.** Insert the actual PowerShell output showing the Herd PHP version.

**Screenshot 5 — Laravel version.** Insert the actual PowerShell output showing the Laravel version.

### 3.4 Developer instruction

When working on this copy of Zonke, use the compatible Herd PHP executable for Artisan commands. Do not assume that typing `php` in PowerShell selects the correct version.

## 4. Understanding the Laravel application structure

After resolving the PHP version issue, I inspected the project structure and checked whether Artisan commands worked.

To list the application's routes, I ran:

```powershell
& "$env:USERPROFILE\.config\herd\bin\php.bat" artisan route:list
```

The route list contained **484 routes**. This confirmed that Laravel could load the application's route definitions; it did not, by itself, prove that every route or feature worked correctly.

### 4.1 Homepage routing

The relevant routing file was:

```text
routes/web.php
```

The routes included a `SiteController` group, with a root route for the homepage and a slug-based route for pages. The homepage view was located at:

```text
resources\views\templates\basic\home.blade.php
```

The layout file was located at:

```text
resources\views\templates\basic\layouts\app.blade.php
```

The homepage controller retrieves page-related information from the database and loads the appropriate view. Restoring the database was therefore essential to representing the existing website locally.

**Screenshot 6 — Route registration or homepage routes.** Insert an actual screenshot of the route-list command or the relevant homepage routes. Do not imply that route registration proves all features work.

## 5. Creating the local environment configuration

### 5.1 Missing `.env` file

Laravel uses a `.env` file for environment-specific settings, including the application URL, database connection details, debug settings, and other configuration values.

The supplied project did not contain a usable `.env` file, and no `.env.example` file was available as a template. I therefore created a local `.env` file. I generated the application key during setup and configured the environment for local development rather than copying the production hosting configuration directly.

### 5.2 Initial local configuration

The local configuration included settings similar to the following:

```dotenv
APP_NAME=Zonke
APP_ENV=local
APP_DEBUG=true
APP_URL=http://127.0.0.1:8000

LOG_CHANNEL=stack
LOG_LEVEL=debug

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=zonke_Ju24072026_db
DB_USERNAME=YOUR_LOCAL_DATABASE_USER
DB_PASSWORD=YOUR_LOCAL_DATABASE_PASSWORD

SESSION_DRIVER=file
CACHE_STORE=file
QUEUE_CONNECTION=sync
FILESYSTEM_DISK=local
```

This is a configuration outline, not the complete `.env` file. The database username and password shown here are placeholders, not working credentials. The actual local file also contains the generated `APP_KEY` and any other required settings. **Do not commit a real `.env` file or publish application keys, passwords, purchase codes, API keys, or other secret values.**

The example records `APP_URL=http://127.0.0.1:8000` as an initial setting. The final browser address used for testing was `http://127.0.0.1:8080`. The local `APP_URL` should be consistent with the actual local setup where the application relies on it for generated URLs. Whether I updated the `.env` value to port 8080 is not confirmed; see [Open verification items](#open-verification-items).

### 5.3 Why I kept the production `.env` separate

The local environment needed to connect to the imported local database. The original hosting `.env` contained different database details, a live website URL, and production configuration. Replacing the local file with the original could have directed the application to the hosting database instead of the local database.

I retained the local `.env` and inspected the original hosting file separately later in the process.

> **Security:** The `.env` file contains sensitive values. Do not commit it to a public GitHub repository or distribute it with passwords, application keys, purchase codes, API keys, or other credentials exposed.

**Screenshot 7 — Local environment configuration.** Insert an actual screenshot of the local `.env` only after redacting the application key, database password, purchase code, API keys, and all other confidential values. If safe redaction cannot be guaranteed, omit the screenshot and show a sanitized example instead.

## 6. Downloading and importing the existing database

### 6.1 Why the database was required

The existing application depended on database records to render pages and load settings. Starting Laravel without the original application data would not provide an accurate representation of the current website. I therefore obtained an SQL backup from the hosting account.

The downloaded file was:

```text
zonke_Ju24072026_db_1791894224.sql
```

It was approximately **210,814 bytes** and was saved in the project root during setup.

### 6.2 Starting the local database environment

XAMPP was installed in:

```text
C:\xampp
```

The XAMPP Control Panel was located at:

```text
C:\xampp\xampp-control.exe
```

MySQL was running, and phpMyAdmin was accessible at:

```text
http://localhost/phpmyadmin
```

During setup, I also encountered a port conflict involving port 80. A process was already listening on that port, so Apache did not initially start normally through the usual workflow. I subsequently started Apache manually using its configured XAMPP configuration file:

```powershell
Start-Process "C:\xampp\apache\bin\httpd.exe" -ArgumentList "-f `"$((Resolve-Path 'C:\xampp\apache\conf\httpd.conf').Path)`"" -PassThru
```

The Apache process was then observed listening on ports 80 and 443. This was a separate local-server configuration issue; it was not the same as the Laravel PHP version problem or the database import.

**Screenshot 8 — XAMPP and MySQL.** Insert an actual screenshot showing XAMPP and the running MySQL service. Redact any sensitive information visible in the control panel.

**Screenshot 9 — phpMyAdmin.** Insert an actual screenshot of phpMyAdmin at `http://localhost/phpmyadmin`. Redact database usernames, passwords, private host information, and any records or other details that should not be public.

### 6.3 Creating the local database

In phpMyAdmin, I created a database named:

```text
zonke_Ju24072026_db
```

I then used this name in the local `.env` file. I deliberately kept the local database separate from the production database so the development environment would remain independent of the live hosting database.

### 6.4 Importing the SQL backup

I completed the import in phpMyAdmin as follows:

1. Open phpMyAdmin.
2. Select the local database `zonke_Ju24072026_db`.
3. Open the **Import** tab.
4. Select `zonke_Ju24072026_db_1791894224.sql`.
5. Start the import and wait for it to complete.

phpMyAdmin reported:

> “Import has been successfully finished, 446 queries executed.”

This confirmed that the SQL import completed successfully.

**Screenshot 10 — Successful SQL import.** Insert an actual screenshot showing phpMyAdmin's successful import message and the reported 446 queries. Redact any credentials or private hosting details.

### 6.5 Confirming the imported tables

After the import, I checked the database structure. Tables included:

- `users`
- `admins`
- `pages`
- `general_settings`
- `categories`
- `subcategories`
- `jobs`
- `projects`
- `bids`
- `transactions`
- `messages`
- `conversations`
- `reviews`
- `skills`
- `withdrawals`
- `deposits`

Additional tables were also present. The database therefore contained existing application structures and data; it was not an empty database waiting for a fresh Laravel migration.

**Screenshot 11 — Imported database tables.** Insert an actual screenshot showing the local database and its tables. Avoid exposing records containing personal information or confidential data.

### 6.6 Migration status warning

I ran:

```powershell
& "$env:USERPROFILE\.config\herd\bin\php.bat" artisan migrate:status
```

The command returned:

```text
ERROR Migration table not found.
```

This did not mean that the imported application tables were missing. It meant that Laravel could not find its migration-tracking table in that database.

> **Data-protection warning:** Do not run `php artisan migrate:fresh` against this imported database. That command can drop existing tables and destroy data. Back up the database before considering any schema changes.

## 7. Creating the local Laravel public directory

### 7.1 The `public_html` issue

The supplied project contained `public_html`, but Laravel conventionally serves the application through a `public` directory. The original `public_html/index.php` referenced paths that were not present in the supplied folder. I needed a working local entry point without replacing the original file.

### 7.2 Creating `public`

From the project root, I ran:

```powershell
New-Item -ItemType Directory -Path public -Force | Out-Null
```

This created a separate local `public` directory.

### 7.3 Copying the assets

The original assets were located in:

```text
public_html\assets
```

I copied them into the new directory:

```powershell
Copy-Item public_html\assets public\assets -Recurse -Force
```

The resulting local asset directory was:

```text
public\assets
```

It included global CSS files and template-specific assets, including:

- `public\assets\global\css\bootstrap.min.css`
- `public\assets\templates\basic\css\main.css`
- `public\assets\templates\basic\css\custom.css`

### 7.4 Creating the Laravel front controller

I created a standard Laravel 11 front controller at:

```text
public\index.php
```

Its contents were:

```php
<?php

use Illuminate\Http\Request;

define('LARAVEL_START', microtime(true));

if (file_exists($maintenance = __DIR__.'/../storage/framework/maintenance.php')) {
    require $maintenance;
}

require __DIR__.'/../vendor/autoload.php';

(require_once __DIR__.'/../bootstrap/app.php')
    ->handleRequest(Request::capture());
```

This directed incoming requests through Laravel's application bootstrap and request handler. I left the original `public_html\index.php` untouched.

### 7.5 Handover note

The new `public` folder is part of the local setup. A developer receiving the prepared project folder should first check whether it already contains `public\index.php` and `public\assets`. If both are present, there is no need to recreate them. If an earlier copy does not include these additions, this setup step must be repeated.

**Screenshot 12 — Local public directory.** Insert an actual File Explorer screenshot showing `public\index.php` and `public\assets`.

## 8. Starting the Laravel application locally

### 8.1 The `artisan serve` issue

I attempted to start the application using Laravel's normal development-server command. In the observed environment, the command could not bind to ports 8000 through 8010. Rather than treating this as evidence that the application itself was broken, I used PHP's built-in server directly.

### 8.2 Starting the server on port 8080

From the project root, I ran:

```powershell
& "$env:USERPROFILE\.config\herd\bin\php.bat" -S 127.0.0.1:8080 -t public
```

This started the PHP development server using the new `public` directory as its document root. The browser address was:

```text
http://127.0.0.1:8080
```

The PowerShell window running the server must remain open while the website is being tested. Closing the window or stopping the process stops the server. To stop it normally, press **Ctrl+C** in that PowerShell window.

### 8.3 Result

This allowed requests to reach the Laravel application through the correct local front controller instead of displaying the original hosting placeholder. The page shown at this point should be recorded accurately; the setup record later notes that the application displayed its licence activation screen before the missing environment entry was added.

**Screenshot 13 — Local PHP server.** Insert an actual screenshot of the PowerShell window showing the server command running. Do not expose unrelated command history or secrets.

**Screenshot 14 — Browser after server start.** Insert an actual screenshot of the browser at `http://127.0.0.1:8080` showing what was displayed at this stage. Do not label this as the successful homepage unless the homepage was actually visible; the later activation-screen finding is documented in Section 10.

## 9. Investigating the missing CSS and design

### 9.1 The observed problem

When the homepage first loaded, the expected design did not appear correctly. The page looked unstyled because its CSS was not loading as expected. I investigated whether the CSS files were missing.

### 9.2 Checking the asset files

I confirmed that important CSS files existed under `public\assets`. I also tested direct HTTP requests to:

```text
http://127.0.0.1:8080/assets/templates/basic/css/main.css
http://127.0.0.1:8080/assets/global/css/bootstrap.min.css
```

Both returned **HTTP 200** during my checks. This indicated that the files existed and could be served over HTTP.

### 9.3 Inspecting the Blade layout

I inspected:

```text
resources\views\templates\basic\layouts\app.blade.php
```

The layout referenced stylesheets including:

```html
<link rel="stylesheet" href="{{ asset('assets/global/css/bootstrap.min.css') }}">
<link rel="stylesheet" href="{{ asset('assets/global/css/all.min.css') }}">
<link rel="stylesheet" href="{{ asset('assets/global/css/line-awesome.min.css') }}">
<link rel="stylesheet" href="{{ asset(activeTemplate(true) . 'css/main.css') }}">
<link rel="stylesheet" href="{{ asset(activeTemplate(true) . 'css/custom.css') }}">
```

The layout also referenced other stylesheets, including Slick CSS and a dynamically generated colour stylesheet. The asset references were present. The issue was that generated URLs used HTTPS while the local PHP server was running plain HTTP.

### 9.4 Identifying the HTTPS mismatch

The generated HTML contained CSS URLs beginning with:

```text
https://127.0.0.1:8080/...
```

The local server was serving the application at:

```text
http://127.0.0.1:8080
```

The protocols did not match. The local server was not configured to serve HTTPS on port 8080, so the browser could not load those stylesheets correctly through the generated HTTPS URLs.

### 9.5 Adjusting local URL generation

I inspected:

```text
app\Providers\AppServiceProvider.php
```

The relevant code was:

```php
if (gs('force_ssl')) {
    \URL::forceScheme('https');
}
```

The imported database had the `force_ssl` setting enabled, which caused the application to force HTTPS URL generation. For local development, I changed the condition to:

```php
if (gs('force_ssl') && app()->environment('production')) {
    \URL::forceScheme('https');
}
```

This makes HTTPS forcing conditional on the application running in the production environment, preserving the intended HTTPS behaviour for production while not forcing HTTPS in the local environment.

After making the change, I cleared Laravel's caches:

```powershell
& "$env:USERPROFILE\.config\herd\bin\php.bat" artisan optimize:clear
```

The command completed successfully.

**Verification limitation:** I identified the CSS URL-scheme cause and made the local conditional change. The setup record states that the final CSS appearance still needs to be checked after the activation issue is resolved. I therefore do not claim that the final homepage styling has been verified.

**Screenshot 15 — `AppServiceProvider.php` change.** Insert an actual screenshot showing the relevant conditional. Ensure no unrelated credentials or private configuration are visible.

**Screenshot 16 — Browser Network evidence (if available).** If an actual Developer Tools Network screenshot is available, insert it to show CSS request URLs and status codes. Do not create substitute evidence or imply this screenshot exists if it was not captured.

## 10. Resolving the licence activation screen

### 10.1 The new problem

After the application began loading through Laravel, I encountered a different page: **Easy Activation — Olance License Activation**. The page identified the application as **olance - v1.3** and requested:

- Envato username
- Purchase code
- Email address

This was different from the original “Zonke is coming” placeholder. At this point, Laravel was reaching the application's licensing mechanism.

### 10.2 Inspecting the activation routes and code

I checked the registered activation routes using:

```powershell
& "$env:USERPROFILE\.config\herd\bin\php.bat" artisan route:list --path=activate
```

The route list included an activation page and an activation-submission route handled by the utility package. The relevant files were:

```text
vendor\laramin\utility\src\Controller\UtilityController.php
vendor\laramin\utility\src\Utility.php
vendor\laramin\utility\src\Helpmate.php
```

The licence state was checked by `Helpmate.php`.

### 10.3 Understanding the activation condition

My inspection of `Helpmate.php` showed that the middleware checked for two important things:

1. The existence of `vendor\laramin\utility\src\laramin.json`.
2. A purchase-code value available through the environment configuration.

If either condition was missing, the application redirected to the activation screen.

### 10.4 Checking `laramin.json` and the local environment

I ran:

```powershell
Test-Path ".\vendor\laramin\utility\src\laramin.json"
```

The result was:

```text
True
```

This confirmed that the file existed. I then checked the local `.env` for a purchase-code entry without printing its value:

```powershell
Select-String -Path ".\.env" -Pattern "^PURCHASECODE="
```

The command returned no output, indicating that the entry was missing. This provided a concrete explanation for the activation redirect: the local environment did not contain a value that the activation middleware expected.

### 10.5 Adding the existing purchase-code entry

The existing local licence configuration already contained a purchase code. I added the missing environment entry to the local `.env` using that existing value, subject to the team's authorisation to use the licence.

The entry follows this format:

```dotenv
PURCHASECODE=YOUR_EXISTING_PURCHASE_CODE
```

The value above is illustrative. The actual local `.env` contains the real value and must remain private. I did not use a fabricated purchase code or bypass the licensing check.

I then cleared Laravel's cached configuration and optimisation files:

```powershell
& "$env:USERPROFILE\.config\herd\bin\php.bat" artisan optimize:clear
```

The command completed successfully.

### 10.6 Verifying the observed result

I refreshed the browser at:

```text
http://127.0.0.1:8080
```

I also performed a hard refresh using **Ctrl+F5**. After this, the Zonke website opened successfully. This confirmed that adding the missing environment entry resolved the activation redirect encountered during the local setup.

This result does **not** independently prove that the licence is authorised for every domain or deployment. The team must use a legitimate licence and contact the software vendor or purchaser if a future installation requires additional validation.

**Screenshot 17 — Activation screen.** Insert an actual screenshot of the activation screen, cropping or blurring the Envato username, purchase code, email address, and any other sensitive information. Do not expose licence data.

**Screenshot 18 — Successful local homepage.** Insert an actual screenshot of the Zonke homepage after the activation redirect was resolved, at `http://127.0.0.1:8080`. This screenshot should also be used to check whether the CSS and final styling now appear correctly; do not claim that styling is verified unless the screenshot supports that conclusion.

## 11. Downloading and inspecting the original hosting `.env`

### 11.1 Why I downloaded it

I considered whether obtaining the original hosting `.env` would help me reproduce the environment more accurately. I downloaded and inspected a separate copy. It contained the original website URL and production database configuration. The downloaded file used:

- `APP_URL=http://zonke.me`
- `DB_CONNECTION=mysql`
- A production database name and username (omitted from this public README)
- Database-backed session, cache, and queue settings

It did not contain a `PURCHASECODE=` entry.

### 11.2 Why I did not replace the local `.env`

The downloaded file belonged to the hosting environment. Its database settings referred to the original hosting database, while my local application was connected to the imported database named `zonke_Ju24072026_db`. I have omitted the production database name and username from this public README. Replacing the local file with the downloaded file could have caused the local application to connect to the wrong database or fail to connect.

I therefore kept the local configuration separate. The original file was useful for understanding the hosting environment, but I did not use it as a direct replacement for the local `.env`.

> **Security:** Database credentials were exposed during troubleshooting. Treat exposed credentials as potentially compromised and arrange to rotate the production database password through the hosting administrator where appropriate. Do not include passwords, purchase codes, application keys, API keys, or other private credentials in screenshots or shared documentation.

## 12. Final local configuration and verification status

At the end of the recorded troubleshooting process, I had established the following:

| Component | Recorded result | Verification boundary |
|---|---|---|
| Laravel project | Existing application loaded | Does not establish that every page or feature works |
| PHP compatibility | Herd PHP 8.4.26 available | Observed during setup |
| Laravel version | 11.47.0 observed | Observed during setup |
| Route registration | 484 routes listed | Route registration is not feature testing |
| Local `.env` | Created and configured | Keep private; final `APP_URL` port should be confirmed |
| Local database | `zonke_Ju24072026_db` | Separate from production configuration |
| SQL import | Successful; 446 queries executed | Reported by phpMyAdmin |
| Local public directory | Created | Includes a Laravel front controller |
| Assets | Copied into `public\assets` | Direct CSS requests returned HTTP 200 during checks |
| Local server | Used port 8080 | Local URL: `http://127.0.0.1:8080` |
| Activation redirect | Resolved after adding the missing environment entry | Does not independently validate licence authorization for every deployment |
| CSS/HTTPS issue | Cause identified; local URL-generation condition changed | Final homepage styling still needs confirmation |

The current local URL recorded for testing is:

```text
http://127.0.0.1:8080
```

The application can now be inspected locally before further development begins. The final homepage styling and the local `.env` URL value remain items to confirm.

## 13. Instructions for another developer receiving the prepared project folder

A developer receiving the current prepared project folder should inspect what is already configured rather than repeat every installation step blindly.

### 13.1 Initial checks

1. Copy the current project folder to a suitable local directory.
2. Confirm that `artisan`, `composer.json`, `vendor`, and the Laravel application folders exist.
3. Confirm that the local `public` directory and its assets are included.
4. Confirm that a local `.env` exists.
5. Verify that the installed PHP version satisfies the requirement in `composer.json`.
6. Confirm that MySQL is running and that the imported local database is available.
7. Check that the `.env` database settings point to the local database.
8. Confirm that legitimate licence configuration is present and that the developer is authorised to use it. Do not share the purchase code in documentation or screenshots.
9. Start the local PHP server.
10. Open the local URL and verify the homepage, stylesheets, and database-driven content. Treat each as a separate check and record any unverified items.

### 13.2 Starting the server

From the project root, run:

```powershell
& "$env:USERPROFILE\.config\herd\bin\php.bat" -S 127.0.0.1:8080 -t public
```

Then open:

```text
http://127.0.0.1:8080
```

If port 8080 is already in use, identify the existing process before choosing another port. If the port changes, update the local `APP_URL` accordingly if the application relies on it for generated links.

### 13.3 Commands used during setup

**Check PHP:**

```powershell
& "$env:USERPROFILE\.config\herd\bin\php.bat" --version
```

**Check Laravel:**

```powershell
& "$env:USERPROFILE\.config\herd\bin\php.bat" artisan --version
```

**List routes:**

```powershell
& "$env:USERPROFILE\.config\herd\bin\php.bat" artisan route:list
```

**Clear Laravel caches:**

```powershell
& "$env:USERPROFILE\.config\herd\bin\php.bat" artisan optimize:clear
```

**Open the local environment file:**

```powershell
notepad .env
```

**Check whether the purchase-code entry exists without displaying its value:**

```powershell
Select-String -Path ".\.env" -Pattern "^PURCHASECODE="
```

Do not run `migrate:fresh` or overwrite the local `.env` without understanding the consequences. Protect the SQL backup, environment file, database credentials, licence information, and any other secrets.

## Troubleshooting

The entries below distinguish issues I observed on my computer from checks that another developer may need to perform. The recorded fixes were verified only to the extent stated; they do not establish that the same solution will apply to every environment.

| Symptom or situation | What I observed or verified | What to check in another environment |
|---|---|---|
| PHP appears missing or incompatible | XAMPP PHP 8.2.12 did not meet this project’s Composer requirement of `^8.3`. Herd provided PHP 8.4.26. | Check which PHP executable the terminal is using. On my setup, Laravel commands used `& "$env:USERPROFILE\.config\herd\bin\php.bat"`. Compare the active PHP version with the project’s `composer.json`; do not assume that `php` resolves to Herd. |
| PowerShell cannot run `npm -v` | PowerShell reported a script execution-policy issue; `npm.cmd -v` worked. | Try the `.cmd` command form in PowerShell. This issue alone does not mean Node.js or npm is missing. |
| Laravel route listing works, but a feature is untested | `artisan route:list` displayed 484 routes. | Treat this as confirmation that route definitions loaded, not proof that the pages, APIs, integrations, or business functions work. Test relevant features individually. |
| Laravel development server cannot bind | On my computer, Laravel’s development server could not bind to ports 8000–8010. I used PHP’s built-in server on port 8080. | Identify whether the requested port is already in use. If choosing another port, check and update the local `APP_URL` if generated links depend on it. Do not assume the application is broken solely because a port cannot be bound. |
| Apache does not start through the usual XAMPP workflow | I encountered a port 80 conflict; a process was already listening. I started Apache with the recorded XAMPP configuration command and observed it listening on ports 80 and 443. | Check the port conflict and current process before changing Apache configuration. My local Apache issue was separate from the Laravel PHP version and database import. |
| Homepage appears unstyled | The CSS files existed under `public\assets`, and the two tested CSS URLs returned HTTP 200. Generated HTTPS URLs did not match the local HTTP server. I changed the `force_ssl` condition to apply in production only and cleared Laravel caches. | Check the browser’s actual CSS request URLs and statuses, the local HTTP/HTTPS scheme, the `force_ssl` setting, and `app\Providers\AppServiceProvider.php`. The final styling still requires confirmation after activation; do not treat the CSS fix as fully verified until the homepage is checked. |
| Activation screen appears | `laramin.json` existed, but the local `.env` lacked `PURCHASECODE`. Adding the existing, authorized local licence value and clearing caches resolved the activation redirect on my setup. | Confirm that legitimate licence configuration is available and authorized for the environment. Do not invent a purchase code, bypass verification, or change licensing controls. Keep the value private. |
| `artisan migrate:status` reports `Migration table not found` | The imported database contained application tables, but Laravel could not find its migration-tracking table. | Do not infer that the imported application tables are absent. Back up the database and investigate migration tracking before any schema changes. **Never run `php artisan migrate:fresh` against the imported database; it can drop tables and destroy data.** |
| Local page fails after copying project files | The project needs a local `.env`, compatible PHP, MySQL, and the imported database; the original `public_html/index.php` was not the local Laravel front controller. | Confirm the prepared `public/index.php` and `public/assets` exist; verify local database settings and server root. Keep production and local environment configuration separate. |

If an issue remains unresolved, capture the exact error, the command or URL involved, software versions, and the change that was tested. Record only outcomes actually confirmed. Do not include credentials or private database records in issue reports or screenshots.

## 14. Screenshot checklist

The placeholders in Sections 2–10 are numbered chronologically from Screenshot 1 through Screenshot 18. Insert only genuine screenshots from the setup process; do not substitute generic examples or imply that evidence exists if it was not captured.

| Checklist item | Evidence references | What the screenshot(s) should show |
|---|---:|---|
| 1. Original project folder | 1 | Supplied folders and files, including `public_html`, `artisan`, and `composer.json` |
| 2. Original placeholder and entry point | 2–3 | Actual “Zonke is coming” page and the relevant `public_html/index.php` code |
| 3. PHP compatibility | 4–5 | Herd PHP version and Laravel version command output |
| 4. Database import | 8–11 | XAMPP/MySQL, phpMyAdmin, successful import message, and imported tables |
| 5. Local public directory | 12 | Prepared `public/index.php` and `public/assets` structure |
| 6. Server and local URL | 13–14 | PHP server command and the actual browser state after server start |
| 7. CSS investigation | 15–16 | The `AppServiceProvider.php` change and, if available, actual browser Network evidence |
| 8. Activation and successful homepage | 17–18 | Actual activation screen (sensitive values redacted) and the actual homepage after the redirect was resolved |

### Screenshot redaction requirements

Before inserting or sharing screenshots, redact:

- Database passwords and usernames where they are confidential
- Application keys
- Purchase codes and licence details
- API keys and other credentials
- Personal information in database records
- Any other confidential hosting information

If a screenshot cannot be safely redacted, do not include it. A sanitized configuration example may be used to explain a setting, but it must not be presented as actual screenshot evidence.

## 15. Important Notes for Team Members Using the Shared Project Folder

I configured the Zonke Revamp project on my computer and am sharing the project folder to make the initial setup easier for other team members. The shared folder provides the existing project files and the local-development changes already recorded in this document, so team members can start from that prepared copy rather than repeat all of my setup work.

The project working on my computer does not guarantee that it will run immediately on another computer. Each development environment may differ in PHP version, Composer installation, operating system, environment variables, available ports, and other software configuration. Team members may therefore encounter different errors or setup requirements; I have not tested this project on every team member's computer.

### PHP and Laravel compatibility

The project requires a compatible PHP version. During my setup, I found that XAMPP's PHP 8.2.12 did not meet the project's stated PHP 8.3 requirement. I installed Laravel Herd, which provided PHP 8.4.26. Before concluding that PHP is missing or incompatible, check which PHP executable the terminal is actually using. Different terminals or computers may resolve `php` to different installations.

### Local server and browser differences

On my computer, Laravel's development server could not bind to ports 8000–8010, so I used PHP's built-in server on port 8080. I also investigated stylesheet-loading problems caused by HTTPS URLs being generated for a local server serving plain HTTP. Other team members may encounter the same issues or different ones depending on their software, ports, and local configuration. Check the actual error and generated URLs before changing project files.

### Database and environment configuration

Sharing the project folder does not transfer a running MySQL server and does not guarantee that the required database is present on another computer. Team members need access to the appropriate authorized database backup, must import it locally if required, and must configure the local database connection correctly.

The `.env` file contains local application and database settings that may not work unchanged on every computer. Check and adjust local settings when necessary, while keeping the local environment separate from production. Do not put passwords, purchase codes, API keys, application keys, or other confidential values in this documentation or in shared screenshots. Protect the SQL backup and `.env` file. Do not run `php artisan migrate:fresh` against the imported database because it can destroy existing data.

### Troubleshooting, project changes, and licensing

Read the documented setup steps, verify software versions, and examine error messages carefully. Record new problems and the solutions you have confirmed so that the handover can be updated accurately. Avoid changing working project files unnecessarily, and do not assume that an issue on one computer means the shared project itself is broken.

Licence activation or access to particular product features may depend on the applicable licence requirements and environment. Follow the legitimate licensing and access requirements; do not bypass licence verification or alter licensing controls.

## 16. Conclusion and next steps

The local setup involved more than starting a web server. I resolved the PHP compatibility mismatch, inspected the supplied Laravel directory structure, configured a local environment, restored the existing database, created a suitable local `public` directory, investigated CSS URL generation, and resolved the observed activation redirect by adding the missing purchase-code environment entry from the existing local licence configuration.

The result is a working local starting point for the Zonke revamp. I can now inspect the existing codebase and database before making further changes. The next phase should begin with a structured review of the current functionality, views, routes, controllers, database relationships, and integrations. Changes should be tested locally and documented before being considered for the live website.

Before describing the local setup as fully verified, I still need to confirm the final homepage styling, ensure that the local `APP_URL` matches port 8080 where required, and resolve the open verification items listed below. Keep the local `.env`, SQL backup, database credentials, and licence information private. Preserve the imported database, avoid destructive migrations, and rotate exposed production credentials through the hosting administrator where appropriate.


## Open verification items

These items were not confirmed by the setup record and should remain open until checked:

1. Confirm whether the local `.env` `APP_URL` was updated from the initial port 8000 example to the final local port 8080.
2. Confirm what the browser displayed at Screenshot 14; the source notes that the activation screen appeared before the missing environment entry was added.
3. Recheck the final homepage styling after the activation redirect was resolved.
4. Confirm that the licence is authorized for the intended domain or deployment where required. The disappearance of the activation redirect is not independent proof of licence scope.
5. Confirm whether the hosting administrator rotated the production database password after credentials were exposed during troubleshooting.
6. Insert only genuine screenshots from the setup process, with credentials and personal data redacted. No screenshot files were supplied with this README.

## Security and data-integrity reminder

Keep the local `.env`, SQL backup, database credentials, licence information, application keys, API keys, and other secrets private. The production `.env` must not replace the local `.env`. Back up the imported database before considering schema changes, and do not run `php artisan migrate:fresh` against it.
