export interface EditPreview {
	readonly path: string;
	readonly diff: string;
}

const previews = new Map<string, EditPreview>();
const invalidators = new Map<string, () => void>();

export function getEditPreview(toolCallId: string, invalidate: () => void): EditPreview | undefined {
	invalidators.set(toolCallId, invalidate);
	return previews.get(toolCallId);
}

export function setEditPreview(toolCallId: string, preview: EditPreview): void {
	previews.set(toolCallId, {
		...preview,
		diff: preview.diff.replace(
			// biome-ignore lint/suspicious/noControlCharactersInRegex: Escape terminal controls from file content.
			/[\u0000-\u0008\u000b-\u001f\u007f-\u009f]/g,
			(c) => `\\u${c.charCodeAt(0).toString(16).padStart(4, "0")}`,
		),
	});
	invalidators.get(toolCallId)?.();
}

export function clearEditPreview(toolCallId?: string): void {
	if (toolCallId !== undefined) {
		previews.delete(toolCallId);
		invalidators.delete(toolCallId);
	} else {
		previews.clear();
		invalidators.clear();
	}
}
