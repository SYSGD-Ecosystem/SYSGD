import type { FC } from "react";
import MdEditor from "react-markdown-editor-lite";
import "react-markdown-editor-lite/lib/index.css";
import MarkdownIt from "markdown-it";

const mdParser = new MarkdownIt();

const DevPreview: FC = () => {
	const handleEditorChange = ({ text }: { text: string }) => {
		console.log("Contenido en Markdown:", text);
	};

	return (
		<div className="flex items-center justify-center bg-slate-500 h-screen p-2">
			<MdEditor
				className="bg-slate-300 h-80"
				renderHTML={(text) => mdParser.render(text)}
				onChange={handleEditorChange}
			/>
		</div>
	);
};

export default DevPreview;
