import onChange from 'on-change';

const renderInitText = (elements, i18nInstance) => {
	const { header, cta, input, label, example } = elements;

	header.textContent = i18nInstance.t('header');
	cta.textContent = i18nInstance.t('cta');
	input.textContent = i18nInstance.t('form.input');
	label.textContent = i18nInstance.t('form.label');
	example.textContent = i18nInstance.t('example');
};

const renderFeedback = (elements, value, i18nInstance) => {
	const { feedback } = elements;

	feedback.textContent = i18nInstance.t(value);

	switch (value) {
		case 'feedback.succes':
			feedback.classList.replace('text-danger', 'text-success');
			break;
		case 'feedback.errors.empty_field':
		case 'feedback.errors.invalid_url':
		case 'feedback.errors.duplicate_url':
			feedback.classList.replace('text-success', 'text-danger');
			break;
		default:
			throw new Error(`Unknown feedback value ${value}`);
	}
};

const renderFormProcessState = (elements, formProcessState) => {
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

const watch = (state, elements, i18nInstance) => {
	renderInitText(elements, i18nInstance);

	const watchedState = onChange(state, (path, value) => {
		switch (path) {
			case 'form.processState':
				renderFormProcessState(elements, value);
				break;
			case 'form.link':
			case 'form.validLinks':
				break;
			case 'feedback':
				renderFeedback(elements, value, i18nInstance);
				break;
			default:
				throw new Error(`Unknown state path ${path}`);
		}
	});

	return watchedState;
};

export default watch;
