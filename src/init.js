import * as yup from 'yup';
import i18next from 'i18next';
import axios from 'axios';
import resources from './locales/index.js';
import watch from './view.js';
import parse from './parser.js';
import generateId from './idgenerator.js';
import updatePosts from './updater.js';

const yupSchema = (validLinks) => yup.string().required().url().notOneOf(validLinks);

const proxy = (link) => {
	const base = 'https://allorigins.hexlet.app';
	const url = new URL('/get', base);
	url.searchParams.append('disableCache', 'true');
	url.searchParams.append('url', link);

	return url;
};

const initialState = {
	app: {
		processState: 'initialization', // initialization, loading, loaded, parsingError, networkError, searching
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

const init = () => {
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
		lng: initialState.app.language,
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

	const watchedState = watch(initialState, elements, i18nInstance);

	elements.input.addEventListener('change', (event) => {
		watchedState.form.link = event.target.value;
	});

	const getId = generateId();

	elements.form.addEventListener('submit', (event) => {
		event.preventDefault();

		watchedState.form.processState = 'validating';
		const schema = yupSchema(watchedState.form.validLinks);

		let proxyUrl;

		schema
			.validate(watchedState.form.link)
			.then((link) => {
				watchedState.form.processState = 'valid';
				watchedState.form.validLinks.push(link);
				watchedState.app.processState = 'loading';

				proxyUrl = proxy(link);

				return axios.get(proxyUrl);
			})
			.then((response) => response.data.contents)
			.then((content) => {
				const parsedContent = parse(content);
				const { feed, posts } = parsedContent;

				if (!feed || !posts) throw new Error(`Parsing Error`);

				feed.id = getId();
				watchedState.data.feeds.push(feed);

				posts.map((post) => {
					post.feedId = feed.id;
					post.id = getId();
					watchedState.data.posts.push(post);

					return watchedState.data.posts;
				});

				watchedState.app.processState = 'loaded';
				watchedState.app.feedback = 'feedback.succes';
				watchedState.form.processState = 'filling';

				console.log(watchedState);

				return feed.id;
			})
			.then((feedId) => {
				watchedState.app.processState = 'searching';
				console.log('ping');
				setTimeout(() => updatePosts(watchedState, proxyUrl, feedId, getId), 5000);
			})
			.catch((error) => {
				console.log(error);

				switch (error.name) {
					case 'ValidationError':
						const [errorCode] = error.errors;
						watchedState.app.feedback = errorCode;
						watchedState.form.processState = 'invalid';
						break;
					case 'Error':
						if (error.message === 'Parsing Error') {
							watchedState.app.processState = 'parsingError';
							watchedState.app.feedback = 'feedback.errors.parsing_error';
						}
						break;
					case 'AxiosError':
						if (error.message === 'Network Error') {
							watchedState.app.processState = 'networkError';
							watchedState.app.feedback = 'feedback.errors.network_error';
						}
						break;
					default:
						throw new Error(`Unknown error name ${error.name}`);
				}
			});
	});
};

export default init;
