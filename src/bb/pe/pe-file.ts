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
		sizeX: number;
		sizeY: number;
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

function unmangle(mangledString: string): string {
	const mangledCharArray = mangledString.split("");

	const dictionary: Record<number, string> = {};
	let nextFreeDictionaryEntry = 256;

	let currentMangledChar = mangledCharArray[0]!;
	const unmangledCharArray = [currentMangledChar];
	let lastUnmangledChar = currentMangledChar;
	for (const char of mangledCharArray.slice(1)) {
		const charCode = char.charCodeAt(0);
		const unmangledChar =
			256 > charCode
				? char
				: dictionary[charCode]!
				? dictionary[charCode]!
				: lastUnmangledChar + currentMangledChar;
		unmangledCharArray.push(unmangledChar);
		currentMangledChar = unmangledChar.charAt(0);
		dictionary[nextFreeDictionaryEntry] =
			lastUnmangledChar + currentMangledChar;
		nextFreeDictionaryEntry++;
		lastUnmangledChar = unmangledChar;
	}

	return unmangledCharArray.join("");
}

export function deserializePeFileData(data: string): PeFileData {
	return JSON.parse(unmangle(JSON.parse(data).data));
}

export function createPeFileData(
	data: Pick<PeFileData, "charsets" | "screens" | "spriteSets">
): PeFileData {
	const now = new Date().getTime();
	const peFileData: PeFileData = {
		app: "PETSCII Editor",
		url: "http://petscii.krissz.hu/",
		meta: {
			name: "Bubble Bobble c64",
			authorName: "",
			editorVersion: "3.0",
			fileFormatVersion: "3.0",
			createTime: now,
			lastSaveTime: now,
		},
		options: {
			palette: "pepto-pal",
			crtFilter: "scanlines",
			fileName: "bubble-bobble-c64",
			saveCounter: 1,
			concatSaveCounter: "yes",
			autosave: "yes",
			autosaveInterval: 10,
			keyboardLayout: "us",
			firstKeydown: "draw",
			firstClick: "draw",
			tooltips: "yes",
			cursorFollow: "yes",
		},
		clipboards: { screenEditor: [], charsetEditor: false, spriteEditor: false },
		...data,
	};

	return peFileData;
}
