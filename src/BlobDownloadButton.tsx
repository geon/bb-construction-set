export function BlobDownloadButton(props: {
	getBlob: () => Blob;
	label: string;
	fileName: string;
}) {
	return (
		<button
			onClick={() => {
				var link = document.createElement("a");
				link.download = props.fileName;
				link.href = URL.createObjectURL(props.getBlob());
				link.click();
			}}
		>
			{props.label}
		</button>
	);
}
