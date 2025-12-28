type usePrintReturnType = {
	print: () => void;
};

const usePrint = (): usePrintReturnType => {
	const print = () => {
		//const content = document.getElementById("content")!.innerHTML
		const windowPrint = window.open("/print");
		if (windowPrint) {
			// windowPrint.document.write("<html><head><title>SYSGD</title>")
			// windowPrint.document.write("</head></body>")
			// windowPrint.document.write(content)
			// windowPrint.document.write("</body></html>")
			// windowPrint.document.close()
			//windowPrint.print()
		}
	};

	return { print };
};

export default usePrint;
