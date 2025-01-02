import { useSelector } from "react-redux";

import { RootState } from "@store/reducers";

const FontSizeWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	const fontSize = useSelector((state: RootState) => state.app.fontSize);

	return <div className={`text-${fontSize}`}>{children}</div>;
};

export default FontSizeWrapper;