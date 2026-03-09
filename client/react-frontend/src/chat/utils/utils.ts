export const getAttachmentType = (
		file: File,
	): "image" | "audio" | "video" | "file" => {
		if (file.type.startsWith("image/")) return "image";
		if (file.type.startsWith("audio/")) return "audio";
		if (file.type.startsWith("video/")) return "video";
		return "file";
	};

    export const formatFileSize = (bytes: number): string => {
            if (bytes < 1024) return `${bytes} B`;
            if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
            return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
        };

	export	function toAttachmentType(
			value?: string | null,
		): "image" | "audio" | "video" | "file" {
			if (value === "image" || value === "audio" || value === "video") return value;
			return "file";
		}