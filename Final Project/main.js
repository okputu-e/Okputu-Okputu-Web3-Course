// Globals
let provider; // ethers provider (wraps window.ethereum)
let signer; // ethers signer (connected account)
const connectBtn = document.getElementById("connectBtn");
const accountEl = document.getElementById("account");
const balanceEl = document.getElementById("balance");
const statusEl = document.getElementById("status");

// UTIL: short address
function shortAddr(addr) {
  if (!addr) return "";
  return addr.slice(0, 6) + "..." + addr.slice(-4);
}

// Connect wallet
async function connectWallet() {
  if (!window.ethereum) {
    alert(
      "MetaMask (or another injected wallet) not found. Install MetaMask and try again."
    );
    return;
  }

  try {
    // Wrap injected provider with ethers.js
    provider = new ethers.providers.Web3Provider(window.ethereum, "any"); // "any" prevents automatic chain switching
    // Request account access
    await provider.send("eth_requestAccounts", []);
    signer = provider.getSigner();
    const address = await signer.getAddress();
    accountEl.textContent = shortAddr(address) + " — " + address;
    connectBtn.textContent = "Connected";
    await refreshBalance();

    // Listen for account and chain changes
    window.ethereum.on("accountsChanged", handleAccountsChanged);
    window.ethereum.on("chainChanged", handleChainChanged);
  } catch (err) {
    console.error(err);
    alert("Connection failed: " + (err.message || err));
  }
}

// Refresh displayed ETH balance
async function refreshBalance() {
  try {
    if (!signer) {
      balanceEl.textContent = "--";
      return;
    }
    const addr = await signer.getAddress();
    const bal = await provider.getBalance(addr);
    balanceEl.textContent = ethers.utils.formatEther(bal) + " ETH";
  } catch (err) {
    console.error("balance error", err);
    balanceEl.textContent = "Error";
  }
}

// Send ETH
async function sendETH() {
  if (!signer) {
    alert('Wallet not connected. Click "Connect Wallet" first.');
    return;
  }
  const to = document.getElementById("toAddress").value.trim();
  const amount = document.getElementById("amount").value.trim();

  // Basic validation
  if (!ethers.utils.isAddress(to)) {
    alert("Invalid recipient address.");
    return;
  }
  if (!amount || Number(amount) <= 0) {
    alert("Enter a valid amount.");
    return;
  }

  try {
    statusEl.textContent = "Status: sending transaction...";
    // Create and send transaction
    const txResponse = await signer.sendTransaction({
      to,
      value: ethers.utils.parseEther(amount),
    });

    statusEl.textContent = "Status: transaction sent. Hash: " + txResponse.hash;
    // Wait for 1 confirmation (you can await more if you want)
    const receipt = await txResponse.wait(1);
    statusEl.textContent =
      "Status: confirmed in block " +
      receipt.blockNumber +
      " — " +
      txResponse.hash;
    // Update balance
    await refreshBalance();
  } catch (err) {
    console.error("send error", err);
    statusEl.textContent = "Error: " + (err.message || err);
  }
}

// Handlers for wallet events
async function handleAccountsChanged(accounts) {
  if (accounts.length === 0) {
    // disconnected
    accountEl.textContent = "Not connected";
    balanceEl.textContent = "--";
    connectBtn.textContent = "Connect Wallet";
    signer = null;
  } else {
    // switched account
    accountEl.textContent = shortAddr(accounts[0]) + " — " + accounts[0];
    // rewrap signer
    signer = provider.getSigner();
    await refreshBalance();
  }
}

async function handleChainChanged(chainId) {
  // chainId is hex string; you may want to refresh UI or prompt user
  console.log("chain changed", chainId);
  // Recommended: reload page to avoid subtle provider inconsistencies
  // window.location.reload();
  // But we can just refresh balance
  await refreshBalance();
}

// Wire UI
connectBtn.addEventListener("click", connectWallet);
document.getElementById("sendBtn").addEventListener("click", sendETH);

// Optional: auto-detect if already connected (MetaMask may remember)
(async function init() {
  if (window.ethereum && window.ethereum.selectedAddress) {
    // user previously connected in this browser
    await connectWallet();
  }
})();
