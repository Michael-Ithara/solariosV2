import { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { LoginForm } from './LoginForm';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [isSignUp, setIsSignUp] = useState(false);

  const handleToggleMode = () => {
    setIsSignUp(!isSignUp);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <LoginForm onToggleMode={handleToggleMode} isSignUp={isSignUp} />
      </DialogContent>
    </Dialog>
  );
}