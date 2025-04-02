// Wait for the DOM to be fully loaded before running script
document.addEventListener('DOMContentLoaded', () => {

    const ipInput = document.getElementById('ipInput');
    const maskInput = document.getElementById('maskInput'); // New Mask Input
    const calculateBtn = document.getElementById('calculateBtn');
    const resultsDiv = document.getElementById('results');
    const errorDiv = document.getElementById('errorMessage');

    // --- Output Span References ---
    const subnetMaskBinarySpan = document.getElementById('subnetMaskBinary');
    const subnetMaskDecimalSpan = document.getElementById('subnetMaskDecimal');
    const networkClassSpan = document.getElementById('networkClass');
    const cidrValueSpan = document.getElementById('cidrValue'); // New CIDR Span
    const numSubnetsSpan = document.getElementById('numSubnets');
    const numHostsSpan = document.getElementById('numHosts');
    const networkRangeSpan = document.getElementById('networkRange');
    const givenIpSpan = document.getElementById('givenIp');
    const subnetIdSpan = document.getElementById('subnetId');
    const broadcastAddressSpan = document.getElementById('broadcastAddress');
    const firstHostIpSpan = document.getElementById('firstHostIp');
    const lastHostIpSpan = document.getElementById('lastHostIp');
    const subnetListContainer = document.getElementById('subnetListContainer');
    const subnetListDiv = document.getElementById('subnetList');
    const subnetListInfoDiv = document.getElementById('subnetListInfo');


    // --- Helper Functions ---

    function decToBin(dec) {
        return (dec >>> 0).toString(2).padStart(8, '0');
    }

    function ipToLong(ipString) {
         if (!ipString || typeof ipString !== 'string') return null;
        const octets = ipString.split('.').map(Number);
        if (octets.length !== 4 || octets.some(o => isNaN(o) || o < 0 || o > 255)) {
            return null;
        }
        // Ensure result is treated as unsigned 32-bit
        return octets.reduce((acc, octet) => (acc << 8) | octet, 0) >>> 0;
     }

    function longToIp(longIp) {
        longIp = longIp >>> 0;
        return [
            (longIp >>> 24) & 255,
            (longIp >>> 16) & 255,
            (longIp >>> 8) & 255,
            longIp & 255
        ].join('.');
    }

    function longToBinaryIp(longIp) {
         longIp = longIp >>> 0;
         return [
            decToBin((longIp >>> 24) & 255),
            decToBin((longIp >>> 16) & 255),
            decToBin((longIp >>> 8) & 255),
            decToBin(longIp & 255)
        ].join('.');
    }

    // New function to validate subnet mask structure
    function isValidSubnetMask(maskString) {
        const maskLong = ipToLong(maskString);
        if (maskLong === null) return false; // Invalid IP format

        // Convert to unsigned 32-bit for bitwise operations
         const mask = maskLong >>> 0;

        // Handle edge cases: 0.0.0.0 and 255.255.255.255 are valid
        if (mask === 0 || mask === 0xFFFFFFFF) {
             return true;
        }

        // Check for contiguous ones followed by contiguous zeros
        // Invert the mask. A valid inverted mask has form 0...01...1
        const invMask = ~mask >>> 0;
        // Adding 1 to this should result in a power of 2 (only one bit set)
        const invMaskPlus1 = (invMask + 1) >>> 0;
         // Check if invMaskPlus1 is a power of 2 (and not 0)
         // A power of 2 has only one bit set, so (x & (x - 1)) === 0
         return invMaskPlus1 !== 0 && (invMaskPlus1 & invMask) === 0; // Check `invMaskPlus1 & invMask` is equivalent to `invMaskPlus1 & (invMaskPlus1 - 1)` here
    }

    // New function to calculate CIDR from a valid subnet mask (long)
    function maskToCidr(maskLong) {
        let mask = maskLong >>> 0;
        if (mask === 0) return 0;

         // Count leading ones (more intuitive for masks)
         // Since we assume isValidSubnetMask passed, we know it's contiguous ones
         let count = 0;
         // Use a safe loop condition (count < 32) to prevent infinite loops on invalid input
         while ((mask & 0x80000000) && count < 32) { // Check MSB (Most Significant Bit)
             count++;
             mask <<= 1; // Shift left (effectively examining the next bit)
         }
         return count;
    }


    function getNetworkClass(ipString) {
        const firstOctet = parseInt(ipString.split('.')[0], 10);
        if (isNaN(firstOctet) || firstOctet < 0 || firstOctet > 255) return 'Invalid';
        if (firstOctet >= 1 && firstOctet <= 126) return 'A';
        if (firstOctet === 127) return 'A (Loopback)';
        if (firstOctet >= 128 && firstOctet <= 191) return 'B';
        if (firstOctet >= 192 && firstOctet <= 223) return 'C';
        if (firstOctet >= 224 && firstOctet <= 239) return 'D (Multicast)';
        if (firstOctet >= 240 && firstOctet <= 255) return 'E (Experimental)';
        return 'Unknown';
    }

    function getDefaultCidr(ipClass) {
        if (ipClass.startsWith('A')) return 8;
        if (ipClass.startsWith('B')) return 16;
        if (ipClass.startsWith('C')) return 24;
        return null;
    }

    function cidrToSubnetMaskLong(cidr) {
        if (cidr < 0 || cidr > 32) return null;
        if (cidr === 0) return 0;
        // Use >>> 0 to ensure the result is treated as unsigned 32-bit
        return ((-1 << (32 - cidr)) >>> 0);
    }

    // --- Main Calculation Logic ---
    function calculateNetworkInfo() {
        hideError();
        resultsDiv.classList.add('hidden');
        subnetListContainer.classList.add('hidden');
        subnetListDiv.innerHTML = '';
        subnetListInfoDiv.textContent = '';

        const rawIpInput = ipInput.value.trim();
        const rawMaskInput = maskInput.value.trim();

        if (!rawIpInput) {
            showError("Please enter an IP address.");
            return;
        }

        let ipString = '';
        let explicitCidr = null;
        let subnetMaskLong = null;
        let cidr = null;

        // --- Determine IP, CIDR, and Mask ---

        // Priority 1: Check if CIDR is provided in the IP input field
        if (rawIpInput.includes('/')) {
            const parts = rawIpInput.split('/');
            ipString = parts[0];
            explicitCidr = parseInt(parts[1], 10);

            if (isNaN(explicitCidr) || explicitCidr < 0 || explicitCidr > 32) {
                showError(`Invalid CIDR prefix in IP field: /${parts[1]}. Must be between 0 and 32.`);
                return;
            }
            cidr = explicitCidr;
            subnetMaskLong = cidrToSubnetMaskLong(cidr);
             if (rawMaskInput) {
                 console.warn("CIDR in IP field overrides the Subnet Mask input.");
             }

        } else {
            // No CIDR in IP field, use the whole string as IP
            ipString = rawIpInput;

            // Priority 2: Check if Subnet Mask is provided in its own field
            if (rawMaskInput) {
                if (!isValidSubnetMask(rawMaskInput)) {
                    showError(`Invalid Subnet Mask format or value: ${rawMaskInput}. Must be contiguous 1s followed by 0s.`);
                    return;
                }
                subnetMaskLong = ipToLong(rawMaskInput);
                cidr = maskToCidr(subnetMaskLong); // Calculate CIDR from mask
            } else {
                // Priority 3: No CIDR, No Mask -> Use class default
                const tempIpLongForClass = ipToLong(ipString); // Need IP long value to get class
                if (tempIpLongForClass === null) {
                    showError(`Invalid IP address format: ${ipString}`);
                    return;
                }
                const networkClass = getNetworkClass(ipString);
                const defaultCidr = getDefaultCidr(networkClass);

                if (defaultCidr === null) {
                    let reason = '';
                    if (networkClass.startsWith('D') || networkClass.startsWith('E')) reason = `Class ${networkClass}`;
                    else if (networkClass.includes('Loopback')) reason = 'Loopback Address';
                    else reason = 'this address type';
                    showError(`Cannot determine default subnet mask for ${reason} (${ipString}). Please provide CIDR notation (e.g., ${ipString}/24) or a Subnet Mask.`);
                    return;
                }
                cidr = defaultCidr;
                subnetMaskLong = cidrToSubnetMaskLong(cidr);
                console.log(`No CIDR or Mask provided, using default for class ${networkClass}: /${cidr}`);
            }
        }

        // --- Validation and Final Setup ---
        const ipLong = ipToLong(ipString);
        if (ipLong === null) {
            // This check might be redundant if handled above, but good for safety
            showError(`Invalid IP address format: ${ipString}`);
            return;
        }

        // At this point, we MUST have: ipString, ipLong, cidr, subnetMaskLong

        // --- Calculations ---
        const networkClass = getNetworkClass(ipString); // Get class for display
        const defaultCidr = getDefaultCidr(networkClass); // Get default for subnet calculation

         // Full network class string for display
         let networkClassDisplay = networkClass;
         if (defaultCidr !== null && !networkClass.includes('Loopback')) {
             networkClassDisplay += ` (Default Class Mask /${defaultCidr})`;
         }


        const subnetMaskDecimal = longToIp(subnetMaskLong);
        const subnetMaskBinary = longToBinaryIp(subnetMaskLong);

        // Number of subnets (relative to class default)
         let numSubnets = 'N/A';
        if (defaultCidr !== null) {
            const subnetBits = cidr - defaultCidr;
            if (subnetBits < 0) {
                numSubnets = `N/A (Supernetted: /${cidr} is larger than class default /${defaultCidr})`;
            } else if (subnetBits === 0) {
                 numSubnets = `1 (Uses class default /${defaultCidr})`;
            } else {
                numSubnets = Math.pow(2, subnetBits).toLocaleString();
            }
        } else {
             numSubnets = 'N/A (Class D/E/Loopback)';
        }

        // Number of hosts
        const hostBits = 32 - cidr;
        const maxHosts = Math.pow(2, hostBits);
        let numUsableHosts = maxHosts >= 2 ? maxHosts - 2 : 0;
        let hostSuffix = '';
         if (hostBits === 1 && maxHosts === 2) { // /31
             numUsableHosts = 0;
             hostSuffix = " (2 total addresses in /31, 0 usable by convention)";
         } else if (hostBits === 0 && maxHosts === 1) { // /32
             numUsableHosts = 1;
             hostSuffix = " (1 total address in /32, the host itself)";
         }

        // Subnet ID and Broadcast for the *specific* subnet the IP is in
        const currentSubnetIdLong = (ipLong & subnetMaskLong) >>> 0;
        const currentSubnetId = longToIp(currentSubnetIdLong);

        const currentBroadcastLong = (currentSubnetIdLong | (~subnetMaskLong)) >>> 0;
        const currentBroadcastAddress = longToIp(currentBroadcastLong);

        const currentNetworkRange = `${currentSubnetId} - ${currentBroadcastAddress}`;

        // First and Last usable IPs
        let firstHostIp = 'N/A';
        let lastHostIp = 'N/A';
        if (numUsableHosts > 0) {
             firstHostIp = longToIp(currentSubnetIdLong + 1);
             lastHostIp = longToIp(currentBroadcastLong - 1);
        } else if (hostBits === 0 && maxHosts === 1) { // Handle /32 specifically for display
             firstHostIp = currentSubnetId; // It's the only address
             lastHostIp = currentSubnetId;
        } else if (hostBits === 1 && maxHosts === 2) { // Handle /31 specifically for display
             firstHostIp = currentSubnetId;      // Often network address is usable
             lastHostIp = currentBroadcastAddress; // Often broadcast address is usable
        }


        // --- Display Results ---
        givenIpSpan.textContent = ipString; // Show only IP here
        subnetMaskBinarySpan.parentElement.classList.add('binary-mask');
        subnetMaskBinarySpan.textContent = subnetMaskBinary;
        subnetMaskDecimalSpan.textContent = subnetMaskDecimal;
        networkClassSpan.textContent = networkClassDisplay;
        cidrValueSpan.textContent = `/${cidr}`; // Display determined CIDR
        numSubnetsSpan.textContent = numSubnets;
        numHostsSpan.textContent = numUsableHosts.toLocaleString() + hostSuffix;
        networkRangeSpan.textContent = currentNetworkRange;
        subnetIdSpan.textContent = currentSubnetId;
        broadcastAddressSpan.textContent = currentBroadcastAddress;
        firstHostIpSpan.textContent = firstHostIp;
        lastHostIpSpan.textContent = lastHostIp;

        // --- Generate and Display Subnet List ---
        generateSubnetList(ipLong, cidr, networkClass, defaultCidr); // Pass defaultCidr explicitly

        resultsDiv.classList.remove('hidden');
    }

    function generateSubnetList(ipLong, cidr, networkClass, defaultCidr) {
        subnetListDiv.innerHTML = '';
        subnetListInfoDiv.textContent = '';
        const MAX_SUBNETS_TO_DISPLAY = 256;

        // Re-check conditions where listing isn't applicable using the determined defaultCidr
        if (defaultCidr === null) {
            subnetListInfoDiv.textContent = `Subnet listing not applicable for Class ${networkClass}.`;
            subnetListContainer.classList.remove('hidden');
            return;
        }
        if (cidr < defaultCidr) {
            subnetListInfoDiv.textContent = `Subnet listing not applicable for supernetting (/${cidr} is larger than default /${defaultCidr}).`;
             subnetListContainer.classList.remove('hidden');
            return;
        }
         if (cidr >= 31) { // Changed from 31 || 32 to >= 31
             subnetListInfoDiv.textContent = `Subnet listing for /${cidr} is generally not displayed due to excessive length or triviality.`;
             subnetListContainer.classList.remove('hidden');
             return;
         }


        const parentNetworkMaskLong = cidrToSubnetMaskLong(defaultCidr);
        const parentNetworkIdLong = (ipLong & parentNetworkMaskLong) >>> 0; // Use the original IP to find its parent network
        const parentNetworkIdIp = longToIp(parentNetworkIdLong);

        const subnetBits = cidr - defaultCidr;
        const numberOfSubnets = Math.pow(2, subnetBits);
        const blockSize = Math.pow(2, 32 - cidr);

        let listContent = '';
        const displayCount = Math.min(numberOfSubnets, MAX_SUBNETS_TO_DISPLAY);

         // Determine the Subnet ID of the input IP based on the *calculated* CIDR
         const currentSubnetMaskLong = cidrToSubnetMaskLong(cidr);
         const inputIpSubnetIdLong = (ipLong & currentSubnetMaskLong) >>> 0;


        subnetListInfoDiv.textContent = `Showing ${displayCount.toLocaleString()}${numberOfSubnets > MAX_SUBNETS_TO_DISPLAY ? ' of ' + numberOfSubnets.toLocaleString() : ''} subnets for ${parentNetworkIdIp}/${defaultCidr} divided into /${cidr}:`;

        for (let i = 0; i < displayCount; i++) {
            const currentSubnetStartLong = (parentNetworkIdLong + i * blockSize) >>> 0;
            let currentSubnetEndLong;
             // Block size for /30 is 4. start + 4 - 1 = end.
             // blocksize cannot be 0 here because we checked cidr < 31
            currentSubnetEndLong = (currentSubnetStartLong + blockSize - 1) >>> 0;

            const startIp = longToIp(currentSubnetStartLong);
            const endIp = longToIp(currentSubnetEndLong);

            const isCurrentSubnet = (currentSubnetStartLong === inputIpSubnetIdLong);

            listContent += `<p${isCurrentSubnet ? ' style="background-color: #e7f3ff; font-weight: bold;"' : ''}>${startIp.padEnd(15)} - ${endIp.padEnd(15)} ${isCurrentSubnet ? ' (contains input IP)' : ''}</p>`;
        }

        if (numberOfSubnets > MAX_SUBNETS_TO_DISPLAY) {
            listContent += `<p>...</p><p>(List truncated to first ${MAX_SUBNETS_TO_DISPLAY.toLocaleString()} subnets)</p>`;
        }

        subnetListDiv.innerHTML = listContent;
        subnetListContainer.classList.remove('hidden');
    }


    function showError(message) {
        errorDiv.textContent = message;
        errorDiv.classList.remove('hidden');
        resultsDiv.classList.add('hidden');
        subnetListContainer.classList.add('hidden');
    }

    function hideError() {
        errorDiv.classList.add('hidden');
        errorDiv.textContent = '';
    }

    // --- Event Listeners ---
    if (calculateBtn) { // Ensure button exists before adding listener
        calculateBtn.addEventListener('click', calculateNetworkInfo);
    }
    if (ipInput) { // Ensure input exists
        ipInput.addEventListener('keypress', (event) => {
            if (event.key === 'Enter') {
                calculateNetworkInfo(); // Allow enter in IP field
            }
        });
        ipInput.addEventListener('input', hideError);
    }
    if (maskInput) { // Ensure input exists
         maskInput.addEventListener('keypress', (event) => {
            if (event.key === 'Enter') {
                calculateNetworkInfo(); // Allow enter in Mask field
            }
        });
        maskInput.addEventListener('input', hideError);
    }

}); // End of DOMContentLoaded listener