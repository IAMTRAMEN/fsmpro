import React from 'react';
import { Download, Smartphone } from 'lucide-react';

interface PWAInstallButtonProps {
  isInstallable: boolean;
  onInstall: () => void;
}

const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ isInstallable, onInstall }) => {
  if (!isInstallable) return null;

  return (
    <button
      onClick={onInstall}
      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-lg"
      title="Install Quality First as an app"
    >
      <Smartphone className="w-4 h-4" />
      <span className="hidden sm:inline">Install App</span>
      <Download className="w-4 h-4" />
    </button>
  );
};

export default PWAInstallButton;