import { InputWithSizeMeta, makeZip } from "client-zip";

export function BlobDownloadButton(props: {
	getBlob: () => Promise<
		{
			readonly fileName: string;
		} & (
			| {
					readonly blob: Blob;
			  }
			| {
					readonly parts: readonly {
						readonly fileName: string;
						readonly blob: Blob;
					}[];
			  }
		)
	>;
	label: string;
	className?: string;
}) {
	return (
		<button
			className={props.className}
			onClick={async () => {
				const result = await props.getBlob();
				const { blob, fileName } = !("parts" in result)
					? result
					: {
							blob: await new Response(
								makeZip(
									result.parts.map(
										(x): InputWithSizeMeta => ({
											input: x.blob,
											name: x.fileName,
										})
									)
								)
							).blob(),
							fileName: result.fileName,
					  };

				const link = document.createElement("a");
				link.download = fileName;
				link.href = URL.createObjectURL(blob);
				link.click();
				URL.revokeObjectURL(link.href);
			}}
		>
			{props.label}
		</button>
	);
}
