import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { IonIcon, IonRange } from '@ionic/react';
import { textOutline, remove, add } from 'ionicons/icons';
import { useDispatch, useSelector } from 'react-redux';
import {
	increaseFontSize,
	decreaseFontSize,
	setTheme,
	setBrightness,
	setFontFamily,
	setSpacing,
	setWidth
} from '@store/slices/appSlice';
import { RootState } from '@store/store-rtk';

interface Props {
	className?: string;
}

const FontSizeControls: React.FC<Props> = ({ className }) => {
	const [isOpen, setIsOpen] = useState(false);
	const [isMobile, setIsMobile] = useState(false);
	const [activeTab, setActiveTab] = useState('testo'); // 'testo', 'tema', 'avanzate'
	const buttonRef = useRef<HTMLButtonElement>(null);
	const [portalContainer, setPortalContainer] = useState<HTMLDivElement | null>(null);
	const dispatch = useDispatch();
	const {
		fontSize,
		theme,
		brightness,
		fontFamily,
		spacing,
		width
	} = useSelector((state: RootState) => state.app);

	// Rileva se siamo su un dispositivo mobile
	useEffect(() => {
		const checkMobile = () => {
			setIsMobile(window.innerWidth < 768);
		};

		// Verifica iniziale
		checkMobile();

		// Aggiungi listener per il resize
		window.addEventListener('resize', checkMobile);

		// Cleanup
		return () => {
			window.removeEventListener('resize', checkMobile);
		};
	}, []);

	// Crea il container del portale se necessario
	useEffect(() => {
		if (!isOpen) return;

		if (!portalContainer) {
			// Cerca o crea il container per il portale
			let container = document.getElementById('font-settings-portal') as HTMLDivElement;
			if (!container) {
				container = document.createElement('div');
				container.id = 'font-settings-portal';
				document.body.appendChild(container);
			}
			setPortalContainer(container);
		}

		// Pulizia
		return () => {
			// Non rimuoviamo il container per evitare problemi di re-rendering
		};
	}, [isOpen, portalContainer]);

	// Gestori per i cambiamenti
	const handleIncreaseFontSize = (e: React.MouseEvent) => {
		e.stopPropagation();
		console.log('🔥 Increasing font size, current:', fontSize);
		dispatch(increaseFontSize());
	};

	const handleDecreaseFontSize = (e: React.MouseEvent) => {
		e.stopPropagation();
		console.log('🔥 Decreasing font size, current:', fontSize);
		dispatch(decreaseFontSize());
	};

	const handleThemeChange = (newTheme: string) => {
		console.log('🔥 Changing theme to:', newTheme);
		dispatch(setTheme(newTheme));
	};

	const handleBrightnessChange = (value: number) => {
		console.log('🔥 Changing brightness to:', value);
		dispatch(setBrightness(value));
	};

	const handleFontFamilyChange = (value: string) => {
		console.log('🔥 Changing font family to:', value);
		dispatch(setFontFamily(value));
	};

	const handleSpacingChange = (value: number) => {
		console.log('🔥 Changing spacing to:', value);
		dispatch(setSpacing(value));
	};

	const handleWidthChange = (value: number) => {
		console.log('🔥 Changing width to:', value);
		dispatch(setWidth(value));
	};

	// Gestore per aprire/chiudere i controlli
	const handleToggleControls = (e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();
		setIsOpen(!isOpen);
	};

	// Chiudi i controlli se si clicca fuori
	const handleClickOutside = () => {
		setIsOpen(false);
	};

	// Lista dei temi disponibili
	const themes = [
		{ id: 'white', label: 'Bianco', color: '#ffffff' },
		{ id: 'sepia', label: 'Seppia', color: '#f8f1e3' },
		{ id: 'paper', label: 'Carta', color: '#e8e8e8' },
		{ id: 'dawn', label: 'Alba', color: '#f2f2f2' },
		{ id: 'dark', label: 'Scuro', color: '#121212' },
		{ id: 'amoled', label: 'Amoled', color: '#000000' }
	];

	// Lista dei font disponibili
	const fonts = [
		{ id: 'New York', label: 'New York', sample: 'AaBbCc' },
		{ id: 'San Francisco', label: 'San Francisco', sample: 'AaBbCc' },
		{ id: 'Gentium Book Basic', label: 'Gentium', sample: 'AaBbCc' },
		{ id: 'Lato', label: 'Lato', sample: 'AaBbCc' },
		{ id: 'Montserrat', label: 'Montserrat', sample: 'AaBbCc' },
		{ id: 'Open Sans', label: 'Open Sans', sample: 'AaBbCc' },
		{ id: 'Roboto Slab', label: 'Roboto', sample: 'AaBbCc' }
	];

	// Calcola la larghezza del menu in base al dispositivo
	const menuWidth = isMobile ? '90vw' : '400px';

	// Calcola la posizione del menu in base al dispositivo
	const getMenuPosition = () => {
		if (isMobile) {
			return {
				position: 'fixed' as const,
				top: '50%',
				left: '50%',
				right: 'auto',
				transform: 'translate(-50%, -50%)'
			};
		} else if (buttonRef.current) {
			// Posizionamento per desktop in base alla posizione del pulsante
			const rect = buttonRef.current.getBoundingClientRect();
			return {
				position: 'fixed' as const,
				top: `${rect.bottom + 8}px`,
				right: `${window.innerWidth - rect.right}px`,
				transform: 'none'
			};
		} else {
			// Fallback se non possiamo ottenere la posizione del pulsante
			return {
				position: 'fixed' as const,
				top: '60px',
				right: '16px',
				transform: 'none'
			};
		}
	};

	// Renderizzazione del menu a discesa nel portale
	const renderDropdownMenu = () => {
		if (!isOpen || !portalContainer) return null;

		const menuContent = (
			<>
				{/* Overlay invisibile che copre tutta la pagina per catturare i click fuori dal menu */}
				<div
					style={{
						position: 'fixed',
						top: 0,
						left: 0,
						right: 0,
						bottom: 0,
						zIndex: 9998,
						backgroundColor: 'rgba(0,0,0,0.5)',
						backdropFilter: 'blur(3px)'
					}}
					onClick={handleClickOutside}
				/>

				{/* Dropdown menu per le impostazioni */}
				<div
					style={{
						...getMenuPosition(),
						width: menuWidth,
						maxWidth: '100vw',
						maxHeight: isMobile ? '90vh' : '80vh',
						overflowY: 'auto',
						backgroundColor: 'white',
						borderRadius: '12px',
						boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
						padding: '0',
						marginTop: isMobile ? 0 : '8px',
						zIndex: 9999,
						animation: 'fadeInDown 0.2s ease-out'
					}}
					onClick={(e) => e.stopPropagation()}
				>
					{/* Header */}
					<div style={{
						display: 'flex',
						justifyContent: 'space-between',
						alignItems: 'center',
						padding: '16px 20px',
						borderBottom: '1px solid #f0f0f0'
					}}>
						<div style={{
							fontSize: '18px',
							fontWeight: 'bold'
						}}>
							Impostazioni Lettura
						</div>
						<button
							onClick={handleClickOutside}
							style={{
								border: 'none',
								background: 'transparent',
								fontSize: '24px',
								cursor: 'pointer',
								padding: '4px 8px'
							}}
						>
							✕
						</button>
					</div>

					{/* Tabs per le diverse sezioni */}
					<div style={{
						display: 'flex',
						borderBottom: '1px solid #f0f0f0'
					}}>
						{['testo', 'tema', 'avanzate'].map(tab => (
							<button
								key={tab}
								onClick={() => setActiveTab(tab)}
								style={{
									flex: 1,
									padding: '12px 8px',
									border: 'none',
									backgroundColor: activeTab === tab ? '#f5f5f5' : 'white',
									borderBottom: activeTab === tab ? '2px solid #3182CE' : 'none',
									fontWeight: activeTab === tab ? 'bold' : 'normal',
									color: activeTab === tab ? '#3182CE' : '#4a5568',
									cursor: 'pointer'
								}}
							>
								{tab === 'testo' ? 'Testo' : tab === 'tema' ? 'Tema' : 'Avanzate'}
							</button>
						))}
					</div>

					{/* Contenuto delle tabs */}
					<div style={{ padding: '20px' }}>
						{/* Tab: Testo */}
						{activeTab === 'testo' && (
							<>
								{/* Font Family */}
								<div style={{ marginBottom: '20px' }}>
									<div style={{
										fontSize: '16px',
										fontWeight: 'bold',
										marginBottom: '12px'
									}}>
										Carattere
									</div>
									<div style={{
										display: 'grid',
										gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
										gap: '10px'
									}}>
										{fonts.map(item => (
											<button
												key={item.id}
												style={{
													padding: '12px 8px',
													border: `2px solid ${fontFamily === item.id ? '#3182CE' : '#E2E8F0'}`,
													borderRadius: '8px',
													background: 'white',
													display: 'flex',
													flexDirection: 'column',
													alignItems: 'center',
													cursor: 'pointer'
												}}
												onClick={() => handleFontFamilyChange(item.id)}
											>
												<div style={{
													fontFamily: item.id,
													fontSize: '16px',
													marginBottom: '4px'
												}}>
													{item.sample}
												</div>
												<span style={{
													fontSize: '12px',
													color: '#718096',
													fontWeight: fontFamily === item.id ? 'bold' : 'normal'
												}}>
													{item.label}
												</span>
											</button>
										))}
									</div>
								</div>

								{/* Font Size */}
								<div style={{ marginBottom: '20px' }}>
									<div style={{
										fontSize: '16px',
										fontWeight: 'bold',
										marginBottom: '12px'
									}}>
										Dimensione testo
									</div>
									<div style={{
										display: 'flex',
										alignItems: 'center'
									}}>
										<button
											style={{
												width: '36px',
												height: '36px',
												borderRadius: '50%',
												border: '1px solid #e2e8f0',
												display: 'flex',
												alignItems: 'center',
												justifyContent: 'center',
												background: 'white',
												cursor: 'pointer'
											}}
											onClick={handleDecreaseFontSize}
										>
											<IonIcon icon={remove} />
										</button>
										<div style={{
											flex: 1,
											margin: '0 16px',
											height: '6px',
											background: '#e2e8f0',
											borderRadius: '3px',
											position: 'relative'
										}}>
											<div style={{
												height: '100%',
												width: `${fontSize === 'base' ? 40 : fontSize === 'lg' ? 60 : fontSize === 'xl' ? 80 : 40}%`,
												background: '#3b82f6',
												borderRadius: '3px'
											}} />

											{/* Indicatori di dimensione testo */}
											<div style={{
												display: 'flex',
												justifyContent: 'space-between',
												position: 'absolute',
												top: '12px',
												left: 0,
												right: 0
											}}>
												<span style={{
													fontSize: '12px',
													color: fontSize === 'base' ? '#2563eb' : '#94a3b8',
													fontWeight: fontSize === 'base' ? 'bold' : 'normal',
													transform: 'translateX(-50%)',
													position: 'absolute',
													left: '40%'
												}}>
													A
												</span>
												<span style={{
													fontSize: '14px',
													color: fontSize === 'lg' ? '#2563eb' : '#94a3b8',
													fontWeight: fontSize === 'lg' ? 'bold' : 'normal',
													transform: 'translateX(-50%)',
													position: 'absolute',
													left: '60%'
												}}>
													A
												</span>
												<span style={{
													fontSize: '16px',
													color: fontSize === 'xl' ? '#2563eb' : '#94a3b8',
													fontWeight: fontSize === 'xl' ? 'bold' : 'normal',
													transform: 'translateX(-50%)',
													position: 'absolute',
													left: '80%'
												}}>
													A
												</span>
											</div>
										</div>
										<button
											style={{
												width: '36px',
												height: '36px',
												borderRadius: '50%',
												border: '1px solid #e2e8f0',
												display: 'flex',
												alignItems: 'center',
												justifyContent: 'center',
												background: 'white',
												cursor: 'pointer'
											}}
											onClick={handleIncreaseFontSize}
										>
											<IonIcon icon={add} />
										</button>
									</div>
								</div>

								{/* Line spacing */}
								<div style={{ marginBottom: '20px' }}>
									<div style={{
										fontSize: '16px',
										fontWeight: 'bold',
										marginBottom: '12px',
										display: 'flex',
										justifyContent: 'space-between'
									}}>
										<span>Interlinea</span>
										<span style={{ fontSize: '14px', color: '#718096' }}>
											{spacing.toFixed(1)}
										</span>
									</div>
									<IonRange
										min={0.8}
										max={2}
										step={0.1}
										value={spacing}
										onIonChange={(e) => handleSpacingChange(e.detail.value as number)}
										style={{
											"--bar-background": '#e2e8f0',
											"--bar-background-active": '#3b82f6',
											"--bar-height": '6px',
											"--bar-border-radius": '3px',
											"--knob-background": '#ffffff',
											"--knob-size": '20px',
											"--padding-top": '0px',
											"--padding-bottom": '0px'
										} as any}
									/>
									<div style={{
										display: 'flex',
										justifyContent: 'space-between',
										fontSize: '12px',
										color: '#718096',
										marginTop: '4px'
									}}>
										<span>Compatta</span>
										<span>Ariosa</span>
									</div>
								</div>

								{/* Content Width */}
								<div style={{ marginBottom: '20px' }}>
									<div style={{
										fontSize: '16px',
										fontWeight: 'bold',
										marginBottom: '12px',
										display: 'flex',
										justifyContent: 'space-between'
									}}>
										<span>Larghezza contenuto</span>
										<span style={{ fontSize: '14px', color: '#718096' }}>
											{width.toFixed(0)}%
										</span>
									</div>
									<IonRange
										min={50}
										max={100}
										step={5}
										value={width}
										onIonChange={(e) => handleWidthChange(e.detail.value as number)}
										style={{
											"--bar-background": '#e2e8f0',
											"--bar-background-active": '#3b82f6',
											"--bar-height": '6px',
											"--bar-border-radius": '3px',
											"--knob-background": '#ffffff',
											"--knob-size": '20px',
											"--padding-top": '0px',
											"--padding-bottom": '0px'
										} as any}
									/>
									<div style={{
										display: 'flex',
										justifyContent: 'space-between',
										fontSize: '12px',
										color: '#718096',
										marginTop: '4px'
									}}>
										<span>Ridotta</span>
										<span>Ampia</span>
									</div>
								</div>
							</>
						)}

						{/* Tab: Tema */}
						{activeTab === 'tema' && (
							<>
								{/* Brightness Control */}
								<div style={{ marginBottom: '20px' }}>
									<div style={{
										fontSize: '16px',
										fontWeight: 'bold',
										marginBottom: '12px',
										display: 'flex',
										justifyContent: 'space-between'
									}}>
										<span>Luminosità</span>
										<span style={{ fontSize: '14px', color: '#718096' }}>
											{Math.round(brightness)}%
										</span>
									</div>
									<IonRange
										min={30}
										max={100}
										step={5}
										value={brightness}
										onIonChange={(e) => handleBrightnessChange(e.detail.value as number)}
										style={{
											"--bar-background": '#e2e8f0',
											"--bar-background-active": '#3b82f6',
											"--bar-height": '6px',
											"--bar-border-radius": '3px',
											"--knob-background": '#ffffff',
											"--knob-size": '20px',
											"--padding-top": '0px',
											"--padding-bottom": '0px'
										} as any}
									/>
									<div style={{
										display: 'flex',
										justifyContent: 'space-between',
										fontSize: '12px',
										color: '#718096',
										marginTop: '4px'
									}}>
										<span>Scura</span>
										<span>Chiara</span>
									</div>
								</div>

								{/* Theme Selection */}
								<div style={{ marginBottom: '20px' }}>
									<div style={{
										fontSize: '16px',
										fontWeight: 'bold',
										marginBottom: '12px'
									}}>
										Tema
									</div>
									<div style={{
										display: 'grid',
										gridTemplateColumns: 'repeat(3, 1fr)',
										gap: '12px'
									}}>
										{themes.map(item => (
											<button
												key={item.id}
												style={{
													padding: '12px 8px',
													border: `2px solid ${theme === item.id ? '#3182CE' : '#E2E8F0'}`,
													borderRadius: '8px',
													background: 'white',
													display: 'flex',
													flexDirection: 'column',
													alignItems: 'center',
													cursor: 'pointer'
												}}
												onClick={() => handleThemeChange(item.id)}
											>
												<div style={{
													width: '100%',
													height: '36px',
													background: item.color,
													borderRadius: '4px',
													marginBottom: '8px',
													border: item.id === 'white' ? '1px solid #e2e8f0' : 'none'
												}} />
												<span style={{
													fontSize: '12px',
													fontWeight: theme === item.id ? 'bold' : 'normal'
												}}>
													{item.label}
												</span>
											</button>
										))}
									</div>
								</div>
							</>
						)}

						{/* Tab: Avanzate */}
						{activeTab === 'avanzate' && (
							<>
								<div style={{ marginBottom: '20px' }}>
									<div style={{
										fontSize: '16px',
										fontWeight: 'bold',
										marginBottom: '12px'
									}}>
										Impostazioni avanzate
									</div>
									<p style={{ color: '#718096', fontSize: '14px', lineHeight: '1.6' }}>
										Queste impostazioni ti permettono di personalizzare ulteriormente la tua esperienza di lettura.
										Sperimenta con diverse combinazioni per trovare lo stile più confortevole per i tuoi occhi.
									</p>

									<div style={{
										marginTop: '16px',
										backgroundColor: '#f9fafb',
										borderRadius: '8px',
										padding: '16px',
										border: '1px solid #e2e8f0'
									}}>
										<p style={{ fontSize: '14px', marginBottom: '8px' }}>
											<strong>Suggerimento:</strong> Per la lettura notturna, prova il tema Scuro
											con luminosità ridotta per ridurre l'affaticamento degli occhi.
										</p>
										<p style={{ fontSize: '14px' }}>
											Se leggi per lunghi periodi, una larghezza contenuta e un'interlinea spaziosa
											possono migliorare notevolmente la leggibilità.
										</p>
									</div>
								</div>
							</>
						)}
					</div>

					{/* Footer con pulsante di chiusura */}
					<div style={{
						padding: '16px 20px',
						borderTop: '1px solid #f0f0f0',
						display: 'flex',
						justifyContent: 'flex-end'
					}}>
						<button
							onClick={handleClickOutside}
							style={{
								padding: '8px 16px',
								backgroundColor: '#3182CE',
								color: 'white',
								border: 'none',
								borderRadius: '6px',
								fontWeight: 'bold',
								cursor: 'pointer'
							}}
						>
							Chiudi
						</button>
					</div>
				</div>
			</>
		);

		return ReactDOM.createPortal(menuContent, portalContainer);
	};

	return (
		<div className={`font-size-controls relative ${className || ''}`}>
			<button
				ref={buttonRef}
				type="button"
				onClick={handleToggleControls}
				style={{
					padding: '10px',
					background: '#f5f5f5',
					border: '1px solid #ddd',
					borderRadius: '8px',
					cursor: 'pointer',
					fontSize: '16px',
					minWidth: '50px',
					minHeight: '44px',
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
				}}
			>
				<span style={{ marginRight: '5px', fontWeight: 'bold' }}>Aa</span>
				<IonIcon icon={textOutline} />
			</button>

			{renderDropdownMenu()}
		</div>
	);
};

export default FontSizeControls; 