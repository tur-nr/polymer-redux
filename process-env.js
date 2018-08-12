if (typeof window.process === 'undefined') {
	window.process = {
		env: {}
	};
} else if (window.process.env == null) {
	window.process.env = {};
}
