import { stringToDOM, swapArrayItems } from './partial/util'
import icons from './partial/icons';
import Styler from './styler';
import Figure from './figure';
import Table from './table';
import Link from './link';
import Selection from './selection';

export default class Section {
  static id = 0; // eslint-disable-line
  static activeSection = null;

  constructor (align, content, {
    position,
    type = 'text'
  } = {}) {
    if (content && content.nodeName === 'BR') {
      return;
    }
    this.id = Section.id++
    this.type = type;
    this.isHTMLView = false;
    this.$align = align;
    if (typeof content === 'string') {
      content = stringToDOM(content);
    }
    this.generateWrapper(content);
    this.generateContent(content);
    if (type === 'text') {
      this.generateControllers();
      this.generateBackground();
      this.el.addEventListener('click', () => {
        this.active();
      });
    }

    if (typeof position === 'number') {
      const before = this.$align.sections[position];
      this.$align.editor.insertBefore(this.el, before.el);
      this.$align.sections.splice(position, 0, this);
      return;
    }
    this.$align.editor.appendChild(this.el);
    this.$align.sections.push(this);
  }

  static config (align) {
    align.$sectionToolbar = new Styler(align, {
      mode: 'bubble',
      hideWhenClickOut: true,
      commands: [
        '_sectionColor',
        '_sectionImage',
        '_sectionVideo',
        '_sectionRemoveBg',
        '_sectionToggleHTML',
        '_sectionDuplicate',
        { '_sectionClasses': ['normal', 'full'] },
        '_remove'
      ],
      tooltip: true,
      position: 'left-top',
      ...align.settings.section
    });
  }

  get content () {
    let output;
    if (this.type === 'text') {
      output = this.el.cloneNode(true);
      const controllers = output.querySelector('.align-sectionControllers');
      const contentDiv = output.querySelector('.align-content');
      const figures = Array.from(contentDiv.querySelectorAll('figure'));
      if (this.isHTMLView) {
        contentDiv.innerHTML = contentDiv.innerText;
      }
      figures.forEach(fig => Figure.render(fig));
      output.classList.remove('is-active');
      output.insertAdjacentHTML('beforeend', contentDiv.innerHTML);
      contentDiv.remove();
      controllers.remove();
    }
    if (this.type === 'title') {
      return this.title.innerText;
    }
    return output.outerHTML;
  }

  generateWrapper (content) {
    this.el = document.createElement('div');
    this.el.classList.add('align-section');
    let classes = content ? content.classList : '';
    if (!classes) {
      return;
    }
    classes = Array.from(classes);
    if (classes.includes('align-section')) {
      const modifiers = classes.filter(cls => cls.startsWith('is-'));
      this.el.classList.add(...modifiers);
      this.bgColor = content.style.backgroundColor;
    }
  }

  generateContent (content) {
    switch (this.type) {
      case 'text':
        if (!this.contentDiv) {
          this.contentDiv = document.createElement('div');
          this.contentDiv.classList.add('align-content');
          this.contentDiv.contentEditable = true;
        }
        if (this.isHTMLView) {
          content = content.innerText;
        }
        if (!this.isHTMLView) {
          content = content ? content.innerHTML : '<p></p>';
        }
        this.contentDiv.innerHTML = content;
        this.el.appendChild(this.contentDiv);
        this.generateElements();
        break;

      case 'title':
        this.title = this.el.querySelector('.align-title') || document.createElement('h1');
        this.title.classList.add('align-title');
        this.title.contentEditable = true;
        this.title.innerText = content;
        this.el.appendChild(this.title);
        this.title.addEventListener('blur', () => {
          this.title.innerHTML = this.title.innerText
        })
        break;

      default:
        break;
    }
  }

  generateElements () {
    const figures = Array.from(this.contentDiv.querySelectorAll('figure'));
    const tables = Array.from(this.contentDiv.querySelectorAll('table'));
    const links = Array.from(this.contentDiv.querySelectorAll('a'));

    figures.forEach(figure => new Figure(this.$align, figure));
    tables.forEach(table => new Table(this.$align, table));
    links.forEach(link => new Link(this.$align, link));
  }

  generateControllers () {
    this.controllers = document.createElement('div');
    this.addButton = document.createElement('button');
    this.upButton = document.createElement('button');
    this.downButton = document.createElement('button');
    this.controllers.classList.add('align-sectionControllers');
    this.addButton.classList.add('align-sectionAdd');
    this.upButton.classList.add('align-sectionUp');
    this.downButton.classList.add('align-sectionDown');

    this.upButton.insertAdjacentHTML('afterbegin', icons.caretUp);
    this.downButton.insertAdjacentHTML('afterbegin', icons.caretDown);

    this.addButton.addEventListener('click', () => {
      const newSection = new Section(this.$align, '', { position: this.getIndex() })
      setTimeout(() => {
        newSection.active();
        Selection.selectElement(newSection.contentDiv.querySelector('p'));
      }, 1);
    });
    this.upButton.addEventListener('click', this.moveUp.bind(this));
    this.downButton.addEventListener('click', this.moveDown.bind(this));
    [this.addButton, this.upButton, this.downButton].forEach(btn => this.controllers.appendChild(btn));
    this.el.appendChild(this.controllers);
  }

  generateBackground () {
    this.bgImage = this.bgImage || this.contentDiv.querySelector('.align-bgImage');
    this.bgVideo = this.bgVideo || this.contentDiv.querySelector('.align-bgVideo');
    this.bgCol = this.bgVideo || this.contentDiv.querySelector('.align-bgVideo');
    if (this.bgImage) {
      this.el.classList.add('has-bgImage');
      this.el.insertAdjacentElement('afterBegin', this.bgImage);
    }
    if (this.bgVideo) {
      this.el.classList.add('has-bgVideo');
      this.el.insertAdjacentElement('afterBegin', this.bgVideo);
    }
    if (this.bgColor) {
      this.el.classList.add('has-bgColor');
      this.el.style.backgroundColor = this.bgColor;
    }
  }

  getIndex () {
    return this.$align.sections.findIndex(el => el === this);
  }

  toggleHTML () {
    if (!this.isHTMLView) {
      this.isHTMLView = true;
      const content = document.createTextNode(this.contentDiv.innerHTML);
      const pre = document.createElement('pre');

      this.contentDiv.innerHTML = '';
      pre.dataset.alignHtml = true;
      pre.appendChild(content);
      this.contentDiv.appendChild(pre);
      this.$align.highlight();
      return;
    }
    this.generateContent(this.contentDiv);
    this.isHTMLView = false;
  }

  backgroundColor (_remove, color) {
    this.el.style.backgroundColor = color;
    // color value maybe in hex, hsl or rgb model
    // so I have to check for background inline style value
    if (this.el.style.backgroundColor !== 'rgb(255, 255, 255)') {
      this.bgColor = color;
      this.el.classList.add('has-bgColor');
      return;
    }
    this.bgColor = null;
    this.el.style.backgroundColor = '';
    this.el.classList.remove('has-bgColor');

    // emit events
    const index = this.getIndex();
    this.$align.$bus.emit('sectionChanged', { from: index, to: index });
    this.$align.$bus.emit('changed');
  }

  removeBackground (_, event) {
    if (this.bgImage) {
      this.bgImage.remove();
      this.bgImage = null;
      this.el.classList.remove('has-bgImage');
    }
    if (this.bgVideo) {
      this.bgVideo.remove();
      this.bgVideo = null;
      this.el.classList.remove('has-bgVideo');
    }

    // emit events
    const index = this.getIndex();
    this.$align.$bus.emit('sectionChanged', { from: index, to: index });
    this.$align.$bus.emit('changed');
  }
  
  backgroundImage (_, event) {
    const input = event.target;
    const file = input.files[0];
    if (!file) return;
    if (!this.bgImage) {
      this.bgImage = document.createElement('div');
      this.bgImage.classList.add('align-bgImage');
      this.el.insertAdjacentElement('afterBegin', this.bgImage);
    }
    const update = (src) => {
      this.bgImage.style.backgroundImage = `url(${src})`;
    };
    this.bgImage.style.backgroundImage = `url(${URL.createObjectURL(file)})`;
    this.el.classList.add('has-bgImage');
    input.value = null;
    this.$align.update();

    // emit events
    const index = this.getIndex();
    this.$align.$bus.emit('imageAdded', { file, update });
    this.$align.$bus.emit('sectionChanged', { from: index, to: index });
    this.$align.$bus.emit('changed');
  }

  backgroundVideo (_, event) {
    const input = event.target;
    const file = input.files[0];
    if (!file) return;
    const url = window.URL.createObjectURL(event.target.files[0]);
    let source = null;

    if (!this.bgVideo) {
      this.bgVideo = stringToDOM(`<video autoplay muted loop class="align-bgVideo"></video>`);
      source = document.createElement('source');
      this.bgVideo.appendChild(source);
      this.el.insertAdjacentElement('afterBegin', this.bgVideo);
    }
    if (this.bgVideo) {
      source = this.bgVideo.querySelector('source');
    }
    this.el.classList.add('has-bgVideo');
    source.src = url;
    const update = (src) => {
      source.src = src;
    };
    input.value = null;
    this.$align.update();

    // emit events
    const index = this.getIndex();
    this.$align.$bus.emit('videoAdded', { file, update });
    this.$align.$bus.emit('sectionChanged', { from: index, to: index });
    this.$align.$bus.emit('changed');
  }

  moveUp () {
    const oldIndx = this.getIndex();
    if (
      !this.$align.sections[oldIndx - 1] ||
      this.$align.sections[oldIndx - 1].type === 'title'
    ) return;

    this.$align.editor.insertBefore(this.el, this.$align.sections[oldIndx - 1].el);
    swapArrayItems(this.$align.sections, oldIndx, oldIndx - 1);

    //emit events
    this.$align.$bus.emit('sectionChanged', { 
      from: oldIndx, to: this.getIndex()
    });
    this.$align.$bus.emit('changed');
  }

  moveDown () {
    const oldIndx = this.getIndex();
    if (!this.$align.sections[oldIndx + 1]) return;
    this.$align.editor.insertBefore(this.el, this.$align.sections[oldIndx + 1].el.nextSibling);
    swapArrayItems(this.$align.sections, oldIndx, oldIndx + 1);

    //emit events
    this.$align.$bus.emit('sectionChanged', { 
      from: oldIndx, to: this.getIndex()
    });
    this.$align.$bus.emit('changed');
  }


  active () {
    if (Section.activeSection) {
      Section.activeSection.inactive();
    }
    Section.activeSection = this;
    this.el.classList.add('is-active');
    this.$align.$sectionToolbar.update(this);
    this.contentDiv.focus();
  }

  inactive () {
    this.el.classList.remove('is-active');
  }

  remove () {
    const oldIndx = this.getIndex();
    this.inactive();
    this.el.remove();
    this.$align.sections.splice(oldIndx, 1);
    this.$align.$sectionToolbar.hide();
    this.$align.update();

    //emit events
    this.$align.$bus.emit('sectionChanged', {
      from: oldIndx, to: null
    });
    this.$align.$bus.emit('changed');
  }

  duplicate () {
    const content = this.content;
    new Section(this.$align, content, { position: this.getIndex() });

    //emit events
    this.$align.$bus.emit('sectionChanged', {
      from: null, to: this.getIndex()
    });
    this.$align.$bus.emit('changed');
  }
}
