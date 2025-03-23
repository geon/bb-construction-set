export function BlobDownloadButton(props: {
	getBlob: () => {
		readonly blob: Blob;
	};
	label: string;
	fileName: string;
}) {
	return (
		<button
			onClick={() => {
				const fileName = props.fileName;
				const { blob } = props.getBlob();

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
