export function BlobDownloadButton(props: {
	getBlob: () => {
		readonly fileName: string;
	} & (
		| {
				readonly blob: Blob;
		  }
		| {
				readonly parts: {
					readonly fileName: string;
					readonly blob: Blob;
				};
		  }
	);
	label: string;
}) {
	return (
		<button
			onClick={async () => {
				const result = props.getBlob();
				const { blob, fileName } = !("parts" in result)
					? result
					: {
							blob: await new Response(makeZip(result.blobs)).blob(),
							fileName: result.fileName,
					  };

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
