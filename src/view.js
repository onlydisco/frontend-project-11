import onChange from 'on-change';

const renderInitText = (elements, i18nInstance) => {
	const { header, cta, input, label, example } = elements;

	header.textContent = i18nInstance.t('header');
	cta.textContent = i18nInstance.t('cta');
	input.textContent = i18nInstance.t('form.input');
	label.textContent = i18nInstance.t('form.label');
	example.textContent = i18nInstance.t('example');
};

const renderAppProcessState = (elements, appProcessState) => {
	const { form, input, submit } = elements;

	switch (appProcessState) {
		case 'loading':
			submit.disabled = true;
			break;
		case 'loaded':
			submit.disabled = false;
			form.reset();
			input.focus();
			break;
		case 'initialization':
		case 'parsingError':
			break;
		default:
			throw new Error(`Unknown application proccess state ${appProcessState}`);
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
		case 'feedback.errors.parsing_error':
		case 'feedback.errors.network_error':
			feedback.classList.replace('text-success', 'text-danger');
			break;
		default:
			throw new Error(`Unknown feedback value ${value}`);
	}
};

const watch = (state, elements, i18nInstance) => {
	renderInitText(elements, i18nInstance);

	const watchedState = onChange(state, (path, value) => {
		switch (path) {
			case 'app.processState':
				renderAppProcessState(elements, value);
				break;
			case 'form.processState':
				renderFormProcessState(elements, value);
				break;
			case 'form.link':
			case 'form.validLinks':
				break;

			case 'app.feedback':
				renderFeedback(elements, value, i18nInstance);
				break;
			case 'data.feeds':
				break;
			case 'data.posts':
				break;
			default:
				throw new Error(`Unknown state path ${path}`);
		}
	});

	return watchedState;
};

export default watch;
