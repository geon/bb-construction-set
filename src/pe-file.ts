export type CharBitmap = [
	number,
	number,
	number,
	number,
	number,
	number,
	number,
	number
];

export type Bit = 0 | 1;
export type SpriteBitmapByte = [Bit, Bit, Bit, Bit, Bit, Bit, Bit, Bit];

type ColorMode = "single" | "multicolor";

export interface PeFileData {
	app: "PETSCII Editor";
	url: "http://petscii.krissz.hu/";
	meta: {
		name: string;
		authorName: string;
		editorVersion: "3.0";
		fileFormatVersion: "3.0";
		createTime: number;
		lastSaveTime: number;
	};
	options: {
		palette: "pepto-pal";
		crtFilter: "scanlines";
		fileName: string;
		saveCounter: 1;
		concatSaveCounter: "yes";
		autosave: "yes";
		autosaveInterval: 10;
		keyboardLayout: "us";
		firstKeydown: "draw";
		firstClick: "draw";
		tooltips: "yes";
		cursorFollow: "yes";
	};
	clipboards: { screenEditor: []; charsetEditor: false; spriteEditor: false };
	charsets: {
		name: string;
		mode: ColorMode;
		bgColor: number;
		charColor: number;
		multiColor1: number;
		multiColor2: number;
		// `bitmaps.length` should be exactly 256.
		bitmaps: CharBitmap[];
	}[];
	screens: {
		name: string;
		mode: ColorMode;
		sizeX: 40;
		sizeY: 25;
		colorBorder: number;
		colorBg: number;
		colorChar: number;
		multiColor1: number;
		multiColor2: number;
		extBgColor1: number;
		extBgColor2: number;
		extBgColor3: number;
		spriteMultiColor1: number;
		spriteMultiColor2: number;
		spritesInBorder: "hidden";
		spritesVisible: true;
		characterSet: number;
		// `charData.length` should match `sizeY` and `charData[n].length` should match `sizeX`.
		charData: number[][];
		// Same for colorData.
		colorData: number[][];
		sprites: {
			setId: number;
			uid: string;
			x: number;
			y: number;
			color: number;
			expandX: false;
			expandY: false;
			priority: "front";
		}[];
		undoStack: [];
		redoStack: [];
	}[];
	spriteSets: {
		name: string;
		sprites: {
			uid: string;
			mode: ColorMode;
			colorBg: number;
			colorSprite: number;
			multiColor1: number;
			multiColor2: number;
			expandX: false;
			expandY: false;
			// `bitmapData.length` should be 3*21 = 63.
			bitmapData: SpriteBitmapByte[];
		}[];
		undoStack: [];
		redoStack: [];
	}[];
}

export function serializePeFileData(data: PeFileData): string {
	return JSON.stringify({ app: "PETSCII Editor", data: JSON.stringify(data) });
}
