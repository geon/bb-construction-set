export function BlobDownloadButton(props: {
	getBlob: () => Blob;
	label: string;
	fileName: string;
}) {
	return (
		<button
			onClick={() => {
				const fileName = props.fileName;

				var link = document.createElement("a");
				link.download = fileName;
				link.href = URL.createObjectURL(props.getBlob());
				link.click();
			}}
		>
			{props.label}
		</button>
	);
}
