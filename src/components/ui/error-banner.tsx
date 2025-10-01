import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface ErrorBannerProps {
	message: string;
	className?: string;
	action?: React.ReactNode;
}

export function ErrorBanner({ message, className, action }: ErrorBannerProps) {
	return (
		<div className={`flex items-start gap-3 p-3 rounded-md border border-destructive/20 bg-destructive/10 ${className || ''}`}>
			<AlertTriangle className="w-4 h-4 text-destructive mt-0.5" />
			<div className="flex-1 text-sm text-destructive">
				{message}
			</div>
			{action}
		</div>
	);
}


