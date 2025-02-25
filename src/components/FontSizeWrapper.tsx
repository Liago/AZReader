import React from "react";
import { useSelector } from "react-redux";
import { RootState } from "@store/reducers";

interface FontSizeWrapperProps {
	children: React.ReactNode;
}

const FontSizeWrapper: React.FC<FontSizeWrapperProps> = ({ children }) => {
	const fontSize = useSelector((state: RootState) => state.app.fontSize);

	return <div className={`text-${fontSize}`}>{children}</div>;
};

export default FontSizeWrapper;
