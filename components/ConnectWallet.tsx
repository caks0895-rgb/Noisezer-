'use client';

import { useState } from 'react';
import { useConnect, useAccount, useSignMessage, useDisconnect } from 'wagmi';
import { SiweMessage } from 'siwe';

export function ConnectWallet() {
  const { connect, connectors } = useConnect();
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const { disconnect } = useDisconnect();
  const [isSigning, setIsSigning] = useState(false);

  const handleSignIn = async () => {
    try {
      setIsSigning(true);
      
      // 1. Get nonce
      const res = await fetch('/api/auth/siwe');
      const { nonce } = await res.json();

      // 2. Create SIWE message
      const message = new SiweMessage({
        domain: window.location.host,
        address,
        statement: 'Sign in with Ethereum to Noisezer.',
        uri: window.location.origin,
        version: '1',
        chainId: 8453, // Base
        nonce,
      });

      // 3. Sign message
      const signature = await signMessageAsync({ message: message.prepareMessage() });

      // 4. Verify signature
      await fetch('/api/auth/siwe', {
        method: 'POST',
        body: JSON.stringify({ message: message.prepareMessage(), signature, nonce }),
        headers: { 'Content-Type': 'application/json' },
      });

      window.location.reload();
    } catch (error) {
      console.error(error);
    } finally {
      setIsSigning(false);
    }
  };

  if (isConnected) {
    return (
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-400">{address?.slice(0, 6)}...{address?.slice(-4)}</span>
        <button onClick={() => disconnect()} className="text-sm text-red-500">Disconnect</button>
        <button onClick={handleSignIn} disabled={isSigning} className="px-4 py-2 bg-blue-600 text-white rounded">
          {isSigning ? 'Signing...' : 'Sign In'}
        </button>
      </div>
    );
  }

  return (
    <button onClick={() => connect({ connector: connectors[0] })} className="px-4 py-2 bg-blue-600 text-white rounded">
      Connect Wallet
    </button>
  );
}
