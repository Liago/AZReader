import React, { useState, useEffect, useRef, useCallback } from 'react';
import ReactDOM from 'react-dom';
import {
	IonIcon,
	IonRange,
	IonButton,
	IonPopover,
	IonContent,
	IonList,
	IonItem,
	IonLabel,
	IonToggle,
	IonChip,
	IonGrid,
	IonRow,
	IonCol,
} from '@ionic/react';
import {
	textOutline,
	removeOutline,
	addOutline,
	contrastOutline,
	sunnyOutline,
	moonOutline,
	resizeOutline,
	libraryOutline,
	colorPaletteOutline,
} from 'ionicons/icons';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@store/store-rtk';
import {
	setFontSize,
	setFontFamily,
	setTheme,
	setSpacing,
	setWidth,
	setBrightness,
	updateReadingSettings,
} from '@store/slices/appSlice';

export interface EnhancedReadingControlsProps {
	className?: string;
	triggerIcon?: string;
	showTriggerText?: boolean;
	compact?: boolean;
}

interface FontSizeOption {
	label: string;
	value: number; // pixels
	description: string;
}

interface LineSpacingOption {
	label: string;
	value: number;
	description: string;
}

interface ColumnWidthOption {
	label: string;
	value: number; // CSS max-width in rem
	description: string;
}

const EnhancedReadingControls: React.FC<EnhancedReadingControlsProps> = ({
	className = '',
	triggerIcon = textOutline,
	showTriggerText = true,
	compact = false,
}) => {
	const dispatch = useDispatch();
	const {
		fontSize,
		fontFamily,
		theme,
		brightness,
		spacing,
		width,
	} = useSelector((state: RootState) => ({
		fontSize: state.app.fontSize,
		fontFamily: state.app.fontFamily,
		theme: state.app.theme,
		brightness: state.app.brightness,
		spacing: state.app.spacing,
		width: state.app.width,
	}));

	// State
	const [isOpen, setIsOpen] = useState(false);
	const [activeTab, setActiveTab] = useState<'typography' | 'layout' | 'theme'>('typography');
	const buttonRef = useRef<HTMLIonButtonElement>(null);
	const [popoverEvent, setPopoverEvent] = useState<Event | undefined>();

	// Font size options (12px to 24px)
	const fontSizeOptions: FontSizeOption[] = [
		{ label: 'XS', value: 12, description: 'Molto piccolo' },
		{ label: 'S', value: 14, description: 'Piccolo' },
		{ label: 'M', value: 16, description: 'Normale' },
		{ label: 'L', value: 18, description: 'Grande' },
		{ label: 'XL', value: 20, description: 'Molto grande' },
		{ label: 'XXL', value: 24, description: 'Enorme' },
	];

	// Line spacing options (1.2x to 2.0x)
	const lineSpacingOptions: LineSpacingOption[] = [
		{ label: 'Compatta', value: 1.2, description: 'Spaziatura ridotta' },
		{ label: 'Normale', value: 1.5, description: 'Spaziatura standard' },
		{ label: 'Comoda', value: 1.7, description: 'Spaziatura ampia' },
		{ label: 'Ariosa', value: 2.0, description: 'Spaziatura massima' },
	];

	// Column width options
	const columnWidthOptions: ColumnWidthOption[] = [
		{ label: 'Stretta', value: 35, description: 'Ottima per focus' },
		{ label: 'Media', value: 42, description: 'Bilanciata' },
		{ label: 'Larga', value: 50, description: 'Sfrutta lo schermo' },
	];

	// Font families
	const fontFamilies = [
		{ id: 'system-ui', name: 'Sistema', preview: 'Aa' },
		{ id: 'New York', name: 'New York', preview: 'Aa' },
		{ id: 'San Francisco', name: 'San Francisco', preview: 'Aa' },
		{ id: 'Georgia', name: 'Georgia', preview: 'Aa' },
		{ id: 'Times New Roman', name: 'Times', preview: 'Aa' },
		{ id: 'Helvetica Neue', name: 'Helvetica', preview: 'Aa' },
		{ id: 'Arial', name: 'Arial', preview: 'Aa' },
	];

	// Reading themes
	const readingThemes = [
		{ id: 'white', name: 'Bianco', color: '#ffffff', textColor: '#000000' },
		{ id: 'sepia', name: 'Seppia', color: '#f4ecd8', textColor: '#5c5c5c' },
		{ id: 'paper', name: 'Carta', color: '#f7f5f3', textColor: '#2c2c2c' },
		{ id: 'dark', name: 'Scuro', color: '#1a1a1a', textColor: '#e5e5e5' },
		{ id: 'amoled', name: 'Nero', color: '#000000', textColor: '#ffffff' },
	];

	// Convert current fontSize (class) to pixel value for display
	const getCurrentFontSizeValue = useCallback((): number => {
		const sizeMap: Record<string, number> = {
			xs: 12, sm: 14, base: 16, lg: 18, xl: 20, '2xl': 24
		};
		return sizeMap[fontSize] || 16;
	}, [fontSize]);

	// Convert pixel value to fontSize class
	const pixelToFontSizeClass = useCallback((pixels: number): 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' => {
		const classMap: Record<number, 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl'> = {
			12: 'xs', 14: 'sm', 16: 'base', 18: 'lg', 20: 'xl', 24: '2xl'
		};
		return classMap[pixels] || 'base';
	}, []);

	// Event handlers
	const handleToggleControls = useCallback((e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();
		setPopoverEvent(e.nativeEvent);
		setIsOpen(!isOpen);
	}, [isOpen]);

	const handleFontSizeChange = useCallback((pixels: number) => {
		const fontSizeClass = pixelToFontSizeClass(pixels);
		dispatch(setFontSize(fontSizeClass));
	}, [dispatch, pixelToFontSizeClass]);

	const handleFontFamilyChange = useCallback((family: string) => {
		dispatch(setFontFamily(family));
	}, [dispatch]);

	const handleSpacingChange = useCallback((value: number) => {
		dispatch(setSpacing(value));
	}, [dispatch]);

	const handleWidthChange = useCallback((value: number) => {
		dispatch(setWidth(value));
	}, [dispatch]);

	const handleThemeChange = useCallback((themeId: string) => {
		dispatch(setTheme(themeId));
	}, [dispatch]);

	const handleBrightnessChange = useCallback((value: number) => {
		dispatch(setBrightness(value));
	}, [dispatch]);

	const handleResetToDefaults = useCallback(() => {
		dispatch(updateReadingSettings({
			fontSize: 'base',
			fontFamily: 'system-ui',
			spacing: 1.5,
			width: 42,
			brightness: 1.0,
		}));
	}, [dispatch]);

	// Apply CSS custom properties for real-time preview
	useEffect(() => {
		const root = document.documentElement;
		root.style.setProperty('--reading-font-size', `${getCurrentFontSizeValue()}px`);
		root.style.setProperty('--reading-line-height', spacing.toString());
		root.style.setProperty('--reading-max-width', `${width}rem`);
		root.style.setProperty('--reading-brightness', brightness.toString());
		root.style.setProperty('--reading-font-family', fontFamily);
	}, [getCurrentFontSizeValue, spacing, width, brightness, fontFamily]);

	// Render typography tab
	const renderTypographyTab = () => (
		<div className="controls-tab-content">
			{/* Font Size */}
			<div className="control-section">
				<div className="control-header">
					<IonLabel>
						<h3>Dimensione carattere</h3>
						<p>{getCurrentFontSizeValue()}px</p>
					</IonLabel>
				</div>
				<IonGrid>
					<IonRow>
						{fontSizeOptions.map((option) => (
							<IonCol size="4" key={option.value}>
								<IonButton
									fill={getCurrentFontSizeValue() === option.value ? 'solid' : 'outline'}
									size="small"
									expand="block"
									onClick={() => handleFontSizeChange(option.value)}
									className="font-size-button"
								>
									<div className="font-size-preview">
										<span className="size-label">{option.label}</span>
										<span className="size-pixels">{option.value}px</span>
									</div>
								</IonButton>
							</IonCol>
						))}
					</IonRow>
				</IonGrid>
			</div>

			{/* Font Family */}
			<div className="control-section">
				<div className="control-header">
					<IonLabel>
						<h3>Carattere</h3>
						<p>{fontFamilies.find(f => f.id === fontFamily)?.name || fontFamily}</p>
					</IonLabel>
				</div>
				<div className="font-family-grid">
					{fontFamilies.map((font) => (
						<IonButton
							key={font.id}
							fill={fontFamily === font.id ? 'solid' : 'outline'}
							className="font-family-button"
							onClick={() => handleFontFamilyChange(font.id)}
						>
							<div className="font-preview" style={{ fontFamily: font.id }}>
								<span className="preview-text">{font.preview}</span>
								<span className="font-name">{font.name}</span>
							</div>
						</IonButton>
					))}
				</div>
			</div>
		</div>
	);

	// Render layout tab
	const renderLayoutTab = () => (
		<div className="controls-tab-content">
			{/* Line Spacing */}
			<div className="control-section">
				<div className="control-header">
					<IonLabel>
						<h3>Interlinea</h3>
						<p>{spacing.toFixed(1)}x</p>
					</IonLabel>
				</div>
				<IonRange
					min={1.2}
					max={2.0}
					step={0.1}
					value={spacing}
					onIonChange={(e) => handleSpacingChange(e.detail.value as number)}
					className="custom-range"
				>
					<IonLabel slot="start">1.2x</IonLabel>
					<IonLabel slot="end">2.0x</IonLabel>
				</IonRange>
				<div className="spacing-presets">
					{lineSpacingOptions.map((option) => (
						<IonChip
							key={option.value}
							color={Math.abs(spacing - option.value) < 0.05 ? 'primary' : 'medium'}
							onClick={() => handleSpacingChange(option.value)}
						>
							{option.label}
						</IonChip>
					))}
				</div>
			</div>

			{/* Column Width */}
			<div className="control-section">
				<div className="control-header">
					<IonLabel>
						<h3>Larghezza colonna</h3>
						<p>{width}rem</p>
					</IonLabel>
				</div>
				<IonRange
					min={35}
					max={50}
					step={1}
					value={width}
					onIonChange={(e) => handleWidthChange(e.detail.value as number)}
					className="custom-range"
				>
					<IonLabel slot="start">35rem</IonLabel>
					<IonLabel slot="end">50rem</IonLabel>
				</IonRange>
				<div className="width-presets">
					{columnWidthOptions.map((option) => (
						<IonChip
							key={option.value}
							color={width === option.value ? 'primary' : 'medium'}
							onClick={() => handleWidthChange(option.value)}
						>
							{option.label}
						</IonChip>
					))}
				</div>
			</div>
		</div>
	);

	// Render theme tab
	const renderThemeTab = () => (
		<div className="controls-tab-content">
			{/* Reading Themes */}
			<div className="control-section">
				<div className="control-header">
					<IonLabel>
						<h3>Tema lettura</h3>
						<p>{readingThemes.find(t => t.id === theme)?.name || theme}</p>
					</IonLabel>
				</div>
				<div className="theme-grid">
					{readingThemes.map((themeOption) => (
						<IonButton
							key={themeOption.id}
							fill="clear"
							className={`theme-button ${theme === themeOption.id ? 'active' : ''}`}
							onClick={() => handleThemeChange(themeOption.id)}
						>
							<div className="theme-preview">
								<div 
									className="theme-swatch"
									style={{ 
										backgroundColor: themeOption.color,
										color: themeOption.textColor,
										border: themeOption.color === '#ffffff' ? '1px solid #e2e8f0' : 'none'
									}}
								>
									Aa
								</div>
								<span className="theme-name">{themeOption.name}</span>
							</div>
						</IonButton>
					))}
				</div>
			</div>

			{/* Brightness */}
			<div className="control-section">
				<div className="control-header">
					<IonLabel>
						<h3>Luminosità</h3>
						<p>{Math.round(brightness * 100)}%</p>
					</IonLabel>
				</div>
				<IonRange
					min={0.3}
					max={1.0}
					step={0.1}
					value={brightness}
					onIonChange={(e) => handleBrightnessChange(e.detail.value as number)}
					className="custom-range"
				>
					<IonIcon icon={moonOutline} slot="start" />
					<IonIcon icon={sunnyOutline} slot="end" />
				</IonRange>
			</div>
		</div>
	);

	return (
		<>
			<IonButton
				ref={buttonRef}
				id="enhanced-reading-controls-trigger"
				fill="clear"
				onClick={handleToggleControls}
				className={`reading-controls-trigger ${className}`}
			>
				<IonIcon icon={triggerIcon} />
				{showTriggerText && !compact && (
					<IonLabel className="trigger-label">Aa</IonLabel>
				)}
			</IonButton>

			<IonPopover
				trigger="enhanced-reading-controls-trigger"
				isOpen={isOpen}
				onDidDismiss={() => setIsOpen(false)}
				event={popoverEvent}
				showBackdrop={true}
				side="bottom"
				alignment="center"
				className="enhanced-reading-popover"
			>
				<IonContent className="reading-controls-content">
					{/* Header */}
					<div className="controls-header">
						<h2>Personalizza lettura</h2>
						<IonButton fill="clear" size="small" onClick={handleResetToDefaults}>
							Reset
						</IonButton>
					</div>

					{/* Tabs */}
					<div className="controls-tabs">
						<IonButton
							fill={activeTab === 'typography' ? 'solid' : 'clear'}
							size="small"
							onClick={() => setActiveTab('typography')}
						>
							<IonIcon icon={textOutline} />
							<IonLabel>Testo</IonLabel>
						</IonButton>
						<IonButton
							fill={activeTab === 'layout' ? 'solid' : 'clear'}
							size="small"
							onClick={() => setActiveTab('layout')}
						>
							<IonIcon icon={resizeOutline} />
							<IonLabel>Layout</IonLabel>
						</IonButton>
						<IonButton
							fill={activeTab === 'theme' ? 'solid' : 'clear'}
							size="small"
							onClick={() => setActiveTab('theme')}
						>
							<IonIcon icon={colorPaletteOutline} />
							<IonLabel>Tema</IonLabel>
						</IonButton>
					</div>

					{/* Tab Content */}
					<div className="controls-content">
						{activeTab === 'typography' && renderTypographyTab()}
						{activeTab === 'layout' && renderLayoutTab()}
						{activeTab === 'theme' && renderThemeTab()}
					</div>
				</IonContent>
			</IonPopover>

			{/* Styles */}
			<style>{`
				.enhanced-reading-popover {
					--width: min(400px, 90vw);
					--max-height: 80vh;
				}

				.reading-controls-trigger {
					--padding-start: 8px;
					--padding-end: 8px;
					--color: var(--ion-color-medium);
				}

				.trigger-label {
					font-weight: 600;
					font-size: 16px;
					margin-left: 4px;
				}

				.reading-controls-content {
					--padding-start: 0;
					--padding-end: 0;
					--padding-top: 0;
					--padding-bottom: 0;
				}

				.controls-header {
					display: flex;
					justify-content: space-between;
					align-items: center;
					padding: 16px 20px 12px;
					border-bottom: 1px solid var(--ion-color-light);
				}

				.controls-header h2 {
					margin: 0;
					font-size: 18px;
					font-weight: 600;
					color: var(--ion-color-dark);
				}

				.controls-tabs {
					display: flex;
					padding: 12px 16px;
					gap: 8px;
					border-bottom: 1px solid var(--ion-color-light);
				}

				.controls-tabs ion-button {
					flex: 1;
					--padding-start: 8px;
					--padding-end: 8px;
					margin: 0;
				}

				.controls-tabs ion-button ion-icon {
					margin-right: 4px;
				}

				.controls-content {
					max-height: 60vh;
					overflow-y: auto;
				}

				.controls-tab-content {
					padding: 20px;
				}

				.control-section {
					margin-bottom: 24px;
				}

				.control-section:last-child {
					margin-bottom: 0;
				}

				.control-header {
					margin-bottom: 12px;
				}

				.control-header h3 {
					margin: 0 0 4px 0;
					font-size: 16px;
					font-weight: 600;
					color: var(--ion-color-dark);
				}

				.control-header p {
					margin: 0;
					font-size: 14px;
					color: var(--ion-color-medium);
				}

				.font-size-button {
					--border-radius: 12px;
					margin: 2px 0;
					height: 60px;
				}

				.font-size-preview {
					display: flex;
					flex-direction: column;
					align-items: center;
					gap: 4px;
				}

				.size-label {
					font-weight: 600;
					font-size: 14px;
				}

				.size-pixels {
					font-size: 11px;
					opacity: 0.7;
				}

				.font-family-grid {
					display: grid;
					grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
					gap: 8px;
				}

				.font-family-button {
					--border-radius: 12px;
					height: 60px;
				}

				.font-preview {
					display: flex;
					flex-direction: column;
					align-items: center;
					gap: 4px;
				}

				.preview-text {
					font-size: 18px;
					font-weight: 400;
				}

				.font-name {
					font-size: 11px;
					opacity: 0.7;
				}

				.custom-range {
					--bar-background: var(--ion-color-light);
					--bar-background-active: var(--ion-color-primary);
					--bar-height: 6px;
					--bar-border-radius: 3px;
					--knob-background: var(--ion-color-primary);
					--knob-size: 20px;
					margin: 12px 0;
				}

				.spacing-presets,
				.width-presets {
					display: flex;
					flex-wrap: wrap;
					gap: 8px;
					margin-top: 12px;
				}

				.theme-grid {
					display: grid;
					grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
					gap: 12px;
				}

				.theme-button {
					--border-radius: 12px;
					height: 80px;
				}

				.theme-button.active {
					--background: var(--ion-color-primary-tint);
					--color: var(--ion-color-primary);
				}

				.theme-preview {
					display: flex;
					flex-direction: column;
					align-items: center;
					gap: 8px;
				}

				.theme-swatch {
					width: 40px;
					height: 40px;
					border-radius: 8px;
					display: flex;
					align-items: center;
					justify-content: center;
					font-weight: 600;
					font-size: 16px;
					box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
				}

				.theme-name {
					font-size: 12px;
					text-align: center;
				}

				/* Mobile optimizations */
				@media (max-width: 480px) {
					.enhanced-reading-popover {
						--width: 95vw;
						--max-height: 85vh;
					}

					.controls-header {
						padding: 12px 16px 8px;
					}

					.controls-header h2 {
						font-size: 16px;
					}

					.controls-tabs {
						padding: 8px 12px;
					}

					.controls-tab-content {
						padding: 16px;
					}

					.font-family-grid {
						grid-template-columns: repeat(2, 1fr);
					}

					.theme-grid {
						grid-template-columns: repeat(3, 1fr);
					}

					.font-size-button,
					.font-family-button {
						height: 50px;
					}

					.theme-button {
						height: 70px;
					}

					.theme-swatch {
						width: 32px;
						height: 32px;
						font-size: 14px;
					}
				}
			`}</style>
		</>
	);
};

export default EnhancedReadingControls;