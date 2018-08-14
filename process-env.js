// Ensure `process.env` is available on the window
if (typeof window.process === 'undefined') {
	window.process = {
		env: {}
	};
} else if (window.process.env == null) {
	window.process.env = {};
}
