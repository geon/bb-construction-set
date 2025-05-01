export const spriteWidthBytes = 3;
const spriteWidthPixels = 12;
export const spriteHeight = 21;

// https://www.lemon64.com/forum/viewtopic.php?t=73528
/** x=24 y=50 will put a sprite in the top left corner of the display, touching the border. */
export const spritePosOffset = {
	x: 24,
	y: 50,
};

export const spriteSize = {
	x: spriteWidthBytes * 8,
	y: spriteHeight,
};

export const spriteSizePixels = {
	x: spriteWidthPixels,
	y: spriteHeight,
} as const;

export const spriteSizeBytes = 63;
