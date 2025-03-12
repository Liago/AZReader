import React, { ReactNode, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@store/reducers';
import '@theme/reading-theme.css';

interface ReadingThemeWrapperProps {
	children: ReactNode;
	className?: string;
}

const ReadingThemeWrapper: React.FC<ReadingThemeWrapperProps> = ({ children, className = '' }) => {
	const {
		theme,
		brightness,
		fontFamily,
		fontSize,
		spacing,
		width
	} = useSelector((state: RootState) => state.app);

	useEffect(() => {
		document.documentElement.style.setProperty('--app-brightness', `${brightness}%`);
		document.documentElement.style.setProperty('--app-spacing', spacing.toString());
		document.documentElement.style.setProperty('--app-width', width.toString());
	}, [brightness, spacing, width]);

	const themeClass = `theme-${theme}`;
	const fontClass = `font-${fontFamily.toLowerCase().replace(' ', '-')}`;

	return (
		<div className={`reading-content ${themeClass} ${fontClass} text-${fontSize} ${className}`}>
			{children}
		</div>
	);
};

export default ReadingThemeWrapper; 