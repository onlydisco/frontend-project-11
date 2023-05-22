import * as yup from 'yup';
import watch from './view.js';

const yupSchema = (validLinks) =>
	yup
		.string()
		.required('Обязательное поле')
		.url('Некоректный URL')
		.notOneOf(validLinks, 'Такой URL уже существует');

const init = () => {
	const state = {
		form: {
			processState: 'filling', // filling, validating, valid, invalid
			link: null,
			validLinks: [],
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
	};

	const watchedState = watch(state, elements);

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
				watchedState.form.processState = 'valid';
				console.log(state);
			})
			.catch((error) => {
				switch (error.name) {
					case 'ValidationError':
						watchedState.form.processState = 'invalid';
						console.error(error.message);
						break;
					default:
						throw new Error(`Unknown error name ${error.name}`);
				}
			});
	});
};

export default init;
