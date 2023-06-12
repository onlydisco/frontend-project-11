import * as yup from 'yup';
import i18next from 'i18next';
import axios from 'axios';
import _ from 'lodash';
import resources from './locales/index.js';
import watch from './view.js';
import parse from './parser.js';

const yupSchema = (validLinks) => yup.string().required().url().notOneOf(validLinks);

const proxy = (link) => {
  const base = 'https://allorigins.hexlet.app';
  const url = new URL('/get', base);
  url.searchParams.append('disableCache', 'true');
  url.searchParams.append('url', link);

  return url;
};

const updatePosts = (watchedState) => {
  const update = () => {
    const promises = watchedState.data.feeds.map(
      (
        { url, id }, // eslint-disable-line
      ) =>
        axios // eslint-disable-line
          .get(proxy(url))
          .then((response) => {
            const { posts } = parse(response.data.contents);

            if (!posts) throw new Error('Parsing Error');

            const oldPosts = watchedState.data.posts.filter((post) => post.feedId === id);
            const oldGuids = oldPosts.map((post) => post.guid);
            const newPosts = posts.filter((post) => !oldGuids.includes(post.guid));

            if (newPosts.length === 0) return;

            newPosts.map((post) => {
              post.feedId = id;
              post.id = _.uniqueId();
              watchedState.data.posts.push(post);

              return watchedState.data.posts;
            });
          })
          .catch((error) => console.log(error)),
    ); // eslint-disable-line
    // eslint-disable-line

    Promise.all(promises).finally(() => setTimeout(() => updatePosts(watchedState), 5000));
  };

  update();
};

const app = (i18nInstance) => {
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

  const initialState = {
    app: {
      processState: null,
      feedback: null,
    },
    form: {
      processState: 'filling',
    },
    data: {
      feeds: [],
      posts: [],
    },
    ui: {
      readPosts: [],
    },
  };

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

  elements.form.addEventListener('submit', (event) => {
    event.preventDefault();

    const formData = new FormData(event.target);
    const currentUrl = formData.get('url');

    watchedState.form.processState = 'validating';

    const validLinks = watchedState.data.feeds.map((feed) => feed.url);
    const schema = yupSchema(validLinks);

    let proxyUrl;

    schema
      .validate(currentUrl)
      .then((link) => {
        watchedState.form.processState = 'valid';
        watchedState.app.processState = 'loading';

        proxyUrl = proxy(link);

        return axios.get(proxyUrl);
      })
      .then((response) => {
        const parsedContent = parse(response.data.contents);
        const { feed, posts } = parsedContent;

        feed.id = _.uniqueId();
        feed.url = currentUrl;
        watchedState.data.feeds.push(feed);

        posts.map((post) => {
          post.feedId = feed.id;
          post.id = _.uniqueId();
          watchedState.data.posts.push(post);

          return watchedState.data.posts;
        });

        watchedState.app.processState = 'loaded';
        watchedState.app.feedback = 'feedback.succes';
        watchedState.form.processState = 'filling';
      })
      .catch((error) => {
        console.log(error);

        let errorCode;

        switch (error.name) {
          case 'ValidationError':
            [errorCode] = error.errors;
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

  setTimeout(updatePosts(watchedState), 5000);
};

const init = () => {
  const i18nInstance = i18next.createInstance();

  i18nInstance
    .init({
      lng: 'ru',
      debug: false,
      resources,
    })
    .then(() => app(i18nInstance))
    .catch((error) => {
      throw new Error(`App initialization error: ${error}`);
    });
};

export default init;
