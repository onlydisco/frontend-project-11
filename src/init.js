import * as yup from 'yup';
import i18next from 'i18next';
import axios from 'axios';
import resources from './locales/index.js';
import watch from './view.js';
import parse from './parser.js';

const yupSchema = (validLinks) => yup.string().required().url().notOneOf(validLinks);

const proxy = (link) => {
	const base = 'https://allorigins.hexlet.app/';
	const href = new URL('/get', base);
	href.searchParams.append('disableCache', 'true');
	href.searchParams.append('url', link);

	return href;
};

const init = () => {
	const state = {
		app: {
			processState: 'initialization', // initialization, loading, loaded, parser_error, network_error, spying
			language: 'ru',
			feedback: null,
		},
		form: {
			processState: 'filling', // filling, validating, valid, invalid
			link: null,
			validLinks: [],
		},
		data: {
			feeds: [],
			posts: [],
		},
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
		feeds: document.querySelector('.feeds'),
		posts: document.querySelector('.posts'),
	};

	const i18nInstance = i18next.createInstance();
	i18nInstance.init({
		lng: state.app.language,
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
				watchedState.app.feedback = null;
				watchedState.form.processState = 'valid';
				watchedState.form.validLinks.push(link);

				console.log(state);

				const proxyUrl = proxy(link);
				const response = axios.get(proxyUrl);

				return response;
			})
			.then((response) => response.data.contents)
			.then((content) => {
				const parsedContent = parse(content);
				console.log('.then -> parsedContent:', parsedContent);
			})
			.catch((error) => {
				const [errorCode] = error.errors;

				switch (error.name) {
					case 'ValidationError':
						watchedState.app.feedback = errorCode;
						watchedState.form.processState = 'invalid';

						console.error(error);
						console.log(state);
						break;
					default:
						throw new Error(`Unknown error name ${error.name}`);
				}
			});
	});
};

export default init;
