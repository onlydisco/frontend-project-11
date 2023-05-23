import * as yup from 'yup';
import i18next from 'i18next';
import resources from './locales/index.js';
import watch from './view.js';

const yupSchema = (validLinks) => yup.string().required().url().notOneOf(validLinks);

const init = () => {
	const state = {
		form: {
			processState: 'filling', // filling, validating, valid, invalid
			link: null,
			validLinks: [],
		},
		feedback: '',
	};

	const elements = {
		header: document.querySelector('h1'),
		cta: document.querySelector('.lead'),
		form: document.querySelector('.rss-form'),
		input: document.getElementById('url-input'),
		label: document.querySelector('.rss-form label'),
		submit: document.querySelector('button[type="submit"]'),
		example: document.getElementById('example'),
		feedback: document.querySelector('.feedback'),
	};

	const i18nInstance = i18next.createInstance();
	i18nInstance.init({
		lng: 'ru',
		debug: false,
		resources,
	});

	yup.setLocale({
		mixed: {
			notOneOf: 'feedback.errors.duplicate_url',
		},
		string: {
			required: 'feedback.errors.empty_field',
			url: 'feedback.errors.invalid_url',
		},
	});

	const watchedState = watch(state, elements, i18nInstance);

	elements.input.addEventListener('change', (event) => {
		watchedState.form.link = event.target.value;
	});

	elements.form.addEventListener('submit', (event) => {
		event.preventDefault();

		watchedState.form.processState = 'validating';
		const schema = yupSchema(watchedState.form.validLinks);

		schema
			.validate(watchedState.form.link)
			.then((link) => {
				watchedState.form.validLinks.push(link);
				watchedState.feedback = '';
				watchedState.form.processState = 'valid';
				console.log(state);
			})
			.catch((error) => {
				const [errorCode] = error.errors;

				switch (error.name) {
					case 'ValidationError':
						watchedState.form.processState = 'invalid';
						watchedState.feedback = errorCode;
						console.error(error.message);
						console.log(state);
						break;
					default:
						throw new Error(`Unknown error name ${error.name}`);
				}
			});
	});
};

export default init;
