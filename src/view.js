import onChange from 'on-change';

const handleFormProcessState = (elements, formProcessState) => {
	const { form, input, submit } = elements;
	switch (formProcessState) {
		case 'filling':
			submit.disabled = false;
			break;
		case 'validating':
			submit.disabled = true;
			break;
		case 'valid':
			submit.disabled = false;
			input.classList.remove('is-invalid');
			form.reset();
			input.focus();
			break;
		case 'invalid':
			submit.disabled = false;
			input.classList.add('is-invalid');
			break;
		default:
			throw new Error(`Unknown form process state ${formProcessState}`);
	}
};

const watch = (state, elements) => {
	const watchedState = onChange(state, (path, value) => {
		switch (path) {
			case 'form.processState':
				handleFormProcessState(elements, value);
				break;
			case 'form.link':
			case 'form.validLinks':
				break;
			default:
				throw new Error(`Unknown state path ${path}`);
		}
	});

	return watchedState;
};

export default watch;
