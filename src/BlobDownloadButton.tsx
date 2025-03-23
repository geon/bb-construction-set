export function BlobDownloadButton(props: {
	getBlob: () => {
		readonly blob: Blob;
		readonly fileName: string;
	};
	label: string;
}) {
	return (
		<button
			onClick={() => {
				const { blob, fileName } = props.getBlob();

				var link = document.createElement("a");
				link.download = fileName;
				link.href = URL.createObjectURL(blob);
				link.click();
			}}
		>
			{props.label}
		</button>
	);
}
