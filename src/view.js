import 'bootstrap';
import onChange from 'on-change';

const renderInitText = (elements, i18nInstance) => {
  const { header, cta, label, submit, example } = elements; // eslint-disable-line

  header.textContent = i18nInstance.t('header');
  cta.textContent = i18nInstance.t('cta');
  submit.textContent = i18nInstance.t('form.input');
  label.textContent = i18nInstance.t('form.label');
  example.textContent = i18nInstance.t('example');
};

const renderAppProcessState = (elements, appProcessState) => {
  const { form, input, submit } = elements;

  switch (appProcessState) {
    case 'initialization':
    case 'filling':
      break;
    case 'loading':
      submit.disabled = true;
      break;
    case 'loaded':
      submit.disabled = false;
      form.reset();
      input.focus();
      break;
    case 'parsingError':
    case 'networkError':
      submit.disabled = false;
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

const renderFeeds = (elements, feedsList, i18nInstance) => {
  const { feeds } = elements;
  feeds.replaceChildren();

  const card = document.createElement('div');
  card.classList.add('card', 'border-0');

  const cardBody = document.createElement('div');
  cardBody.classList.add('card-body');

  const cardTitle = document.createElement('h2');
  cardTitle.classList.add('h4', 'card-title');
  cardTitle.textContent = i18nInstance.t('feeds');

  const list = document.createElement('ul');
  list.classList.add('list-group', 'border-0', 'rounded-0');

  feedsList.map((feed) => {
    const listItem = document.createElement('li');
    listItem.classList.add('list-group-item', 'border-0', 'border-end-0');

    const title = document.createElement('h3');
    title.classList.add('h6', 'm-0');
    title.textContent = feed.title;

    const description = document.createElement('p');
    description.classList.add('small', 'm-0', 'text-black-50');
    description.textContent = feed.description;

    listItem.append(title, description);
    list.prepend(listItem);

    return list;
  });

  cardBody.append(cardTitle);
  card.append(cardBody, list);
  feeds.append(card);
};

const renderPosts = (elements, postsList, i18nInstance, watchedState) => {
  const { posts } = elements;
  posts.replaceChildren();

  const card = document.createElement('div');
  card.classList.add('card', 'border-0');

  const cardBody = document.createElement('div');
  cardBody.classList.add('card-body');

  const cardTitle = document.createElement('h2');
  cardTitle.classList.add('h4', 'card-title');
  cardTitle.textContent = i18nInstance.t('posts');

  const list = document.createElement('ul');
  list.classList.add('list-group', 'border-0', 'rounded-0');

  postsList.map((post) => {
    const listItem = document.createElement('li');
    listItem.classList.add(
      'list-group-item',
      'd-flex',
      'justify-content-between',
      'align-items-start',
      'border-0',
      'border-end-0',
    );

    const link = document.createElement('a');
    link.setAttribute('href', post.link);
    link.setAttribute('target', '_blank');
    link.setAttribute('rel', 'noopener noreferrer');
    link.classList.add('fw-bold');
    link.dataset.id = post.id;
    link.textContent = post.title;

    link.addEventListener('click', (event) => {
      const { id } = event.target.dataset;
      watchedState.ui.readPosts.push(id);
    });

    const button = document.createElement('button');
    button.setAttribute('type', 'button');
    button.classList.add('btn', 'btn-outline-primary', 'btn-sm');
    button.dataset.id = post.id;
    button.dataset.bsToggle = 'modal';
    button.dataset.bsTarget = '#modal';
    button.textContent = i18nInstance.t('modal.open');

    button.addEventListener('click', (event) => {
      event.preventDefault();

      const { id, bsTarget } = event.target.dataset;

      watchedState.ui.readPosts.push(id);

      const modal = document.querySelector(bsTarget);
      const modalTitle = modal.querySelector('.modal-title');
      const modalBody = modal.querySelector('.modal-body');
      const modalFullButton = modal.querySelector('.modal-footer a');
      const modalCloseButton = modal.querySelector('.modal-footer button');

      modalTitle.textContent = post.title;
      modalBody.textContent = post.description;
      modalFullButton.setAttribute('href', post.link);
      modalFullButton.textContent = i18nInstance.t('modal.read');
      modalCloseButton.textContent = i18nInstance.t('modal.close');
    });

    listItem.append(link, button);
    list.prepend(listItem);

    return list;
  });

  cardBody.append(cardTitle);
  card.append(cardBody, list);
  posts.append(card);
};

const renderReadPosts = (idList) => {
  const links = document.querySelectorAll('.posts a');

  links.forEach((link) => {
    if (idList.includes(link.dataset.id)) {
      link.classList.replace('fw-bold', 'fw-normal');
      link.classList.add('link-secondary');
    }
  });
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
      case 'app.feedback':
        renderFeedback(elements, value, i18nInstance);
        break;
      case 'data.feeds':
        renderFeeds(elements, value, i18nInstance);
        break;
      case 'data.posts':
        renderPosts(elements, value, i18nInstance, watchedState);
        break;
      case 'ui.readPosts':
        renderReadPosts(value);
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
