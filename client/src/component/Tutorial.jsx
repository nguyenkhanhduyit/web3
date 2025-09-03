import React from "react";

const Tutorial = ({ theme }) => {
  const textColor = theme === "dark-mode" ? "text-white" : "text-gray-800";
  const linkColor = theme === "dark-mode" ? "text-blue-400" : "text-blue-600";
  const cardBg =
    theme === "dark-mode" ? "bg-black/30 backdrop-blur-sm" : "bg-white/60";

  return (
    <div
      className={`${theme} min-h-screen w-full flex justify-center items-start py-10 px-4`}
    >
      <div
        className={`${cardBg} ${textColor} max-w-3xl w-full rounded-2xl shadow-lg p-8 leading-relaxed`}
      >
        {/* Title */}
        <h1 className="text-3xl font-bold mb-2 text-center">
          MetaMask Setup Guide
        </h1>
        <p className="text-center text-lg opacity-80 mb-8">
          Step-by-step instructions to install and configure MetaMask.
        </p>

        {/* Steps */}
        <ol className="list-decimal list-inside space-y-8">
          <li>
            <p>
              Go to the{" "}
              <a
                href="https://chromewebstore.google.com/detail/metamask/nkbihfbeogaeaoehlefnkodbefgpgknn"
                target="_blank"
                rel="noopener noreferrer"
                className={`${linkColor} underline font-medium`}
              >
                official MetaMask page on Chrome Web Store
              </a>{" "}
              and install the extension.
            </p>
            <img
              src="/images/install_metamask1.png"
              alt="Install MetaMask"
              className="mt-3 rounded-lg shadow-md"
            />
          </li>

          <li>
            <p>Open MetaMask after installation and accept the terms.</p>
            <img
              src="/images/setup_metamask_1.png"
              alt="Accept terms"
              className="mt-3 rounded-lg shadow-md m-auto"
            />
          </li>

          <li>
            <p>
              Create a new wallet → Choose{" "}
              <strong>Use Secret Recovery Phrase</strong>.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
              <img
                src="/images/setup_metamask_2.png"
                alt="Create wallet"
                className="rounded-lg shadow-md"
              />
              <img
                src="/images/setup_metamask_3.png"
                alt="Recovery phrase option"
                className="rounded-lg shadow-md"
              />
            </div>
          </li>

          <li>
            <p>Set a strong password to secure your wallet.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
              <img
                src="/images/setup_metamask_4.png"
                alt="Password setup"
                className="rounded-lg shadow-md"
              />
              <img
                src="/images/setup_metamask_5.png"
                alt="Password confirm"
                className="rounded-lg shadow-md"
              />
            </div>
          </li>

          <li>
            <p>
              Backup your <strong>Secret Recovery Phrase</strong> and keep it in
              a safe place.
            </p>
            <img
              src="/images/setup_metamask_6.png"
              alt="Secret phrase backup"
              className="mt-3 rounded-lg shadow-md"
            />
          </li>

          <li>
            <p>Enter the recovery phrase words in the correct order.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
              <img
                src="/images/setup_metamask_7.png"
                alt="Enter recovery phrase"
                className="rounded-lg shadow-md"
              />
              <img
                src="/images/setup_metamask_8.png"
                alt="Confirm recovery phrase"
                className="rounded-lg shadow-md"
              />
            </div>
          </li>

          <li>
            <p>Setup completed! You should now see your wallet dashboard.</p>
            <img
              src="/images/setup_metamask_9.png"
              alt="Wallet created"
              className="mt-3 rounded-lg shadow-md"
            />
            <img
              src="/images/setup_metamask_10.png"
              alt="Wallet created"
              className="mt-3 rounded-lg shadow-md"
            />
            <img
              src="/images/setup_metamask_11.png"
              alt="Wallet created"
              className="mt-3 rounded-lg shadow-md"
            />
            <img
              src="/images/setup_metamask_12.png"
              alt="Wallet created"
              className="mt-3 rounded-lg shadow-md"
            />
            <img
              src="/images/setup_metamask_13.png"
              alt="Wallet created"
              className="mt-3 rounded-lg shadow-md"
            />
          </li>

          <li>
            <p>Click <strong>Connect Wallet</strong> to use DApp features.</p>
            <img
              src="/images/useweb_1.png"
              alt="Connect wallet"
              className="mt-3 rounded-lg shadow-md"
            />
            <p className="mt-3">Confirm the connection request.</p>
            <img
              src="/images/useweb_2.png"
              alt="Confirm connection"
              className="mt-3 rounded-lg shadow-md"
            />
          </li>

          <li>
            <p>
              Explore the <strong>Market</strong> to view token prices (BTC,
              ETH, ...).
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
              <img
                src="/images/useweb_3.png"
                alt="Market page"
                className="rounded-lg shadow-md"
              />
              <img
                src="/images/useweb_4.png"
                alt="Market tokens"
                className="rounded-lg shadow-md"
              />
            </div>
          </li>

          <li>
            <p>
              Go to <strong>Transaction</strong> to send ETH on Sepolia testnet.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
              <img
                src="/images/useweb_9.png"
                alt="Transaction page"
                className="rounded-lg shadow-md"
              />
              <img
                src="/images/useweb_5.png"
                alt="Send ETH"
                className="rounded-lg shadow-md"
              />
            </div>
          </li>

          <li>
            <p>
              Click <strong>Convert</strong> (top-left) to switch to{" "}
              <strong>Swap</strong> and trade tokens on the DIT Testnet.
            </p>
            <img
              src="/images/useweb_10.png"
              alt="Convert to swap"
              className="mt-3 rounded-lg shadow-md"
            />
            <p className="mt-3">You’ll see the Swap interface:</p>
            <img
              src="/images/useweb_6.png"
              alt="Swap UI"
              className="mt-3 rounded-lg shadow-md"
            />
          </li>

          <li>
            <p>
              Navigate to <strong>Faucet</strong> to request testnet tokens.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
              <img
                src="/images/useweb_7.png"
                alt="Faucet menu"
                className="rounded-lg shadow-md"
              />
              <img
                src="/images/useweb_8.png"
                alt="Faucet tokens"
                className="rounded-lg shadow-md"
              />
            </div>
          </li>
        </ol>
      </div>
    </div>
  );
};

export default Tutorial;
