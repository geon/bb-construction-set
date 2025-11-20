import { InputWithSizeMeta, makeZip } from "client-zip";
import { ComponentPropsWithoutRef } from "react";

export function BlobDownloadButton(
	props: {
		getBlob?: () => Promise<
			| ({
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
			  ))
			| undefined
		>;
	} & Omit<ComponentPropsWithoutRef<"button">, "onClick" | "disabled">
) {
	const { getBlob, ...rest } = props;

	return (
		<button
			{...rest}
			disabled={!getBlob}
			onClick={
				getBlob &&
				(async () => {
					const result = await getBlob();
					if (!result) {
						return;
					}
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
				})
			}
		/>
	);
}
