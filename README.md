# IP Address & Subnet Calculator

A simple, clean web application for calculating various network information based on an IP address and its associated CIDR prefix or subnet mask. Styled using neo-brutalism Design principles for a modern and responsive user interface.

Test Live here -- 
<!-- Optional: Add a screenshot! -->
<!-- ![App Screenshot](path/to/your/screenshot.png) -->

## Features

This tool calculates and displays the following network details:

*   **Subnet Mask:** In both Binary and Dotted Decimal format.
*   **Network Class:** Identifies the class (A, B, C, D, E) of the input IP address.
*   **CIDR Notation:** Shows the calculated or provided CIDR prefix (e.g., /24).
*   **Number of Subnets:** Calculates the number of possible subnets created relative to the IP's default classful mask (if applicable).
*   **Hosts per Subnet:** Calculates the number of usable host addresses within the determined subnet.
*   **Network Range:** Displays the Network ID and Broadcast Address for the specific subnet the input IP belongs to.
*   **Address Details (for the input IP's subnet):**
    *   Subnet ID (Network Address)
    *   Broadcast Address
    *   First Usable Host IP Address
    *   Last Usable Host IP Address
*   **Subnet Range List:** Lists all subnet ranges within the parent classful network derived from the input IP (display is limited for performance with very small subnets).
*   **Responsive Design:** Adapts layout for both desktop and mobile devices.

## Technologies Used

*   **HTML5:** Structure of the web page.
*   **CSS3:** Styling the application using Material Design concepts (layout, colors, elevation, typography). Includes Google Fonts (Roboto, Roboto Mono).
*   **JavaScript (Vanilla JS):** Handles user input, performs all network calculations (bitwise operations), and manipulates the DOM to display results.

## How to Run

**Option 1: Cloning the Repository**

1.  Clone this repository to your local machine:
    ```bash
    git clone <repository-url>
    ```
2.  Navigate into the cloned directory:
    ```bash
    cd <repository-directory-name>
    ```
3.  Open the `index.html` file directly in your web browser.

**Option 2: Downloading Files**

1.  Download the `index.html`, `style.css`, and `script.js` files.
2.  Place all three files in the same folder on your computer.
3.  Open the `index.html` file in your web browser.

## Input Guide

The application accepts input in the following ways:

1.  **IP Address / CIDR Field:**
    *   Enter the target IP address (e.g., `198.165.15.174`).
    *   You can *optionally* include the CIDR prefix directly in this field (e.g., `198.165.15.174/28`).
    *   **Priority:** If a valid CIDR is provided here, it will be used for calculations, and the "Subnet Mask" field below will be ignored.

2.  **Subnet Mask Field (Optional):**
    *   If you do *not* provide a CIDR in the first field, you can enter the subnet mask here in standard dotted decimal format (e.g., `255.255.255.240`).
    *   The application validates if the mask is mathematically correct (contiguous ones followed by zeros).

3.  **Default Classful Mask:**
    *   If *neither* a CIDR prefix nor a subnet mask is provided, the application will attempt to determine the IP address class (A, B, or C only) and use its default standard subnet mask (e.g., `/24` for Class C).
    *   This will not work for Class D, E, or Loopback addresses without an explicit CIDR or mask.

## Contributing

Contributions, issues, and feature requests are welcome! Feel free to check [issues page](<link-to-issues-if-applicable>) or submit a pull request.

## License

Distributed under the MIT License. See `LICENSE` file (if included) for more information, or state: Licensed under the MIT License.
