import { padRight, strictChunk } from "../functions";
import { palette, PaletteIndex } from "../internal-data-formats/palette";
import { PaletteImage } from "./palette-image";

// https://stackoverflow.com/a/47785639/446536

const fileHeaderSize = 14;
const infoHeaderSize = 40;

const bytesPerColorEntry = 4;

// static uint8_t fileHeader[] = {
//     0,0, // signature
//     0,0,0,0, // image file size in bytes
//     0,0,0,0, // reserved
//     0,0,0,0, // start of pixel array
// };
interface FileHeader {
	fileSize: number;
}

function serializeFileHeader(header: FileHeader): Uint8Array {
	const buffer = new Uint8Array(fileHeaderSize);
	const view = new DataView(buffer.buffer);

	view.setUint8(0, "B".charCodeAt(0));
	view.setUint8(1, "M".charCodeAt(0));
	view.setUint32(2, header.fileSize, true);
	view.setUint8(10, fileHeaderSize + infoHeaderSize + 16 * bytesPerColorEntry);

	return buffer;
}

// static uint8_t infoHeader[] = {
//     0,0,0,0, // header size
//     0,0,0,0, // image width
//     0,0,0,0, // image height
//     0,0, // number of color planes
//     0,0, // bits per pixel
//     0,0,0,0, // compression
//     0,0,0,0, // image size
//     0,0,0,0, // horizontal resolution
//     0,0,0,0, // vertical resolution
//     0,0,0,0, // colors in color table
//     0,0,0,0, // important color count
// };
interface InfoHeader {
	width: number;
	height: number;
	upsideDown: boolean;
	bitsPerPixel: number;
	compression: number;
	numColors: number;
}

export function parseInfoHeader(buffer: ArrayBuffer): InfoHeader {
	const view = new DataView(buffer);

	const width = view.getUint32(4, true);
	const _height = view.getInt32(8, true);

	// Some images are stored upside-down. Right-side-up is sigified by a negative height.
	const upsideDown = _height >= 0;
	const height = Math.abs(_height);

	const bitsPerPixel = view.getUint16(14, true);
	const compression = view.getUint32(16, true);
	const numColors = view.getUint32(32, true) || 1 << bitsPerPixel;

	return {
		width,
		height,
		upsideDown,
		bitsPerPixel,
		compression,
		numColors,
	};
}

export function serializeInfoHeader(
	header: Pick<InfoHeader, "width" | "height">
): ArrayBuffer {
	const buffer = new Uint8Array(infoHeaderSize);
	const view = new DataView(buffer.buffer);

	const bitsPerPixel = 4;

	view.setUint32(0, infoHeaderSize, true);
	view.setUint32(4, header.width, true);
	view.setUint32(8, -header.height, true);
	view.setUint16(12, 1, true);
	view.setUint16(14, bitsPerPixel, true);

	return buffer.buffer;
}

export function decodeBmp(buffer: ArrayBuffer): PaletteImage {
	const byteArray = new Uint8Array(buffer);

	const header = parseInfoHeader(
		buffer.slice(fileHeaderSize, fileHeaderSize + infoHeaderSize)
	);

	// console.log("header", header);

	if (header.bitsPerPixel != 4) {
		throw new Error("Only 4-bits-per-pixel images are supported.");
	}

	if (header.compression) {
		throw new Error("Compressed images are not supported.");
	}

	if (header.numColors !== 16) {
		throw new Error("Only supported palette length is 16 colors.");
	}

	const paletteSectionSize = header.numColors * bytesPerColorEntry;
	const pixelSectionStart =
		fileHeaderSize + infoHeaderSize + paletteSectionSize;
	const numPixels = header.width * header.height;

	// console.log(
	// 	"const numPixels = header.width * header.height;",
	// 	numPixels,
	// 	header.width,
	// 	header.height
	// );

	// 2 pixels per byte in 4-bit color.
	const numPixelBytes = Math.ceil(numPixels / 2);
	const pixels = strictChunk(
		[
			...byteArray.subarray(
				pixelSectionStart,
				pixelSectionStart + numPixelBytes
			),
		]
			.flatMap((byte) => [byte >> 4, byte & 0xf] as PaletteIndex[])
			// Cut off any padding pixel.
			.slice(0, numPixels),
		header.width
	);

	return !header.upsideDown ? pixels : pixels.reverse();
}

export function encodeBmp(image: PaletteImage): ArrayBuffer {
	const pixels = image.flat().map((paletteIndex) => paletteIndex ?? 12);

	const width = pixels.length / image.length;
	const height = image.length;

	// Pad pixels to an even number. No half pixels.
	if (pixels.length % 2) {
		pixels.push(0);
	}

	const bitsPerPixel = 4;
	return new Uint8Array([
		...serializeFileHeader({
			fileSize:
				fileHeaderSize +
				infoHeaderSize +
				16 * bytesPerColorEntry +
				(bitsPerPixel / 8) * height * width,
		}),
		...new Uint8Array(
			serializeInfoHeader({
				width,
				height,
			})
		),
		...palette.flatMap(({ r, g, b }) =>
			padRight([b, g, r], bytesPerColorEntry, 0)
		),
		...strictChunk(pixels, 2).map(([a, b]) => (a << 4) | b),
	]).buffer;
}
