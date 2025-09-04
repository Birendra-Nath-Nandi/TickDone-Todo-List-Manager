# TickDone - To-Do List Manager

TickDone is a feature-rich, full-stack to-do list web application. This project was developed as part of a 3-month internship in PHP & MySQL by a team of B.Tech students. It showcases a complete user authentication system, task and list management, and a clean, responsive user interface.

## About the Project

This web application was created by a team of 3rd-year Computer Science & Engineering students from Mallabhum Institute of Technology. It represents the culmination of their learning and collaboration during a 3-month internship program focused on PHP and MySQL.

## Features

  * **User Authentication:** Secure user registration and login system with email verification and password reset functionality.
  * **Task Management:** Create, update, and delete tasks with due dates and descriptions.
  * **List Organization:** Group tasks into custom lists for better organization.
  * **Intuitive UI:** A clean and modern user interface for a seamless user experience.
  * **Drag & Drop:** Reorder tasks with a simple drag-and-drop interface.

## Technologies Used

  * **Frontend:** HTML, CSS, JavaScript
  * **Backend:** PHP
  * **Database:** MySQL

## Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites

  * A web server environment (e.g., XAMPP, WAMP, or MAMP)
  * PHP
  * MySQL

### Installation

1.  **Clone the repo**
    ```sh
    git clone https://github.com/birendra-nath-nandi/TickDone-Todo-List-Manager.git
    ```
2.  **Database Setup**
      * Create a new database named `tickdone_db` in phpMyAdmin.
      * Import the `main.sql` file into the new database.
3.  **Configuration**
      * Update the database credentials in `TickDone/api/db_config.php` if they differ from the XAMPP defaults (root username, no password).
      * Configure your email settings in `TickDone/api/signup.php` and `TickDone/api/forgot_password.php` to enable email verification and password resets.

## Screenshot

<p align="center">
  <img src="docs\assets\images\screenshot.png" alt="Screenshot"/>
</p>

## Team

  * **Birendra Nath Nandi** (Team Leader)
  * Soumyadeep Chatterjee
  * Soumyadeb Chakraborty
  * Pranay Dey
  * Subhadip Dey
  * Subhadeep Patra
  * Swadesh Nemo