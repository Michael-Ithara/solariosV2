import React from 'react';

interface LoadingSpinnerProps {
	className?: string;
	label?: string;
}

export function LoadingSpinner({ className, label }: LoadingSpinnerProps) {
	return (
		<div className={`flex items-center justify-center ${className || ''}`}>
			<div className="animate-spin rounded-full h-8 w-8 border-2 border-primary/30 border-t-primary" />
			{label && <span className="ml-3 text-sm text-muted-foreground">{label}</span>}
		</div>
	);
}


