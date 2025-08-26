import { useEffect, useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { LoginForm } from './LoginForm';
import { useAuth } from '@/contexts/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      onClose();
      if (onSuccess) {
        onSuccess();
      }
    }
  }, [user, onClose, onSuccess]);

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